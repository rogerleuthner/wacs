/*
 * ****************************************************************************
 *  * Source code Copyright 2017 by Roger B. Leuthner
 *  *
 *  * This program is distributed in the hope that it will be useful, but 
 *  * WITHOUT ANY WARRANTY; without even the implied warranty of 
 *  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General
 *  * Public License for more details.
 *  *
 *  * Commercial Distribution License
 *  * If you would like to distribute this source code (or portions thereof) 
 *  * under a license other than the "GNU General Public License, version 2", 
 *  * contact Roger B. Leuthner through GitHub.
 *  *
 *  * GNU Public License, version 2
 *  * All distribution of this source code must conform to the terms of the GNU 
 *  * Public License, version 2.
 *  ***************************************************************************
 */

'use strict';

activityMonitorApp.controller('ActivityController', ['$scope', '$route', 'uiGridConstants', 'activityService',
                                                     function($scope, $route, uiGridConstants, activityService) {

	var count, eventService;

	$scope.activityData = {
			enableRowSelection : false,
			multiSelect : false,
			modifierKeysToMultiSelect : false,
			noUnselect : true,
			enablePaginationControls: false,
			rowTemplate: rowTemplate()
	};

	$scope.historyData = {
			enableRowSelection : false,
			multiSelect : false,
			modifierKeysToMultiSelect : false,
			noUnselect : true,
			rowTemplate: rowTemplate(),
			paginationPageSizes: [10, 20, 40, 80],
			paginationPageSize: 10,
			useExternalPagination: true,
			useExternalSorting: false
	};

	var paginationOptions = {
			pageNumber: 1,
			pageSize: 10,
			sort: null
	};

	var dateFormat = {
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			weekday: 'short',
			year: 'numeric',
			month: 'short'
	};

	$scope.status = {};
	$scope.status.showHistory = false;

	function rowTemplate() {
		return '<div ng-class="{{grid.appScope.getColor(row)}}" ng-click="grid.appScope.processRowClick(row)" ng-repeat="col in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ui-grid-resize-columns ui-grid-cell></div>';
	}

	$scope.activityData.columnDefs =
	[
	 { field: 'eventNum', name: 'eventNum', enableCellEdit: false, sort: { direction: uiGridConstants.DESC }, visible: false },
	 { field: 'name', name: 'name', displayName: 'Type', enableCellEdit: false, width: '30%', enableColumnResizing: true },
	 { field: 'user', name: 'user', displayName: 'User', enableCellEdit: false, width: '28%', enableColumnResizing: true },
	 { field: 'timestamp', name: 'timestamp', displayName: 'Time', enableCellEdit: false, width: '42%', enableColumnResizing: true},
	 { field: 'severity', name: 'severity', enableCellEdit: false, visible: false }
	 ];

	$scope.historyData.columnDefs = $scope.activityData.columnDefs;

	// initialize data and count only if undefined, which means
	// this is the first loading or a reload.
	// note that because of this a browser reload will clear the activity log
	if ($scope.activityData.data === undefined)
	{
		$scope.activityData.data = [];
		count = 0;
	}

	$scope.getColor = function(row) {
		switch(row.entity.severity) {
		case "NORMAL":
			return "green";
			break;
		case "ELEVATED":
			return "yellow";
			break;
		case "SEVERE":
			return "red";
			break;
		default:
			return "green";
			break;
		}
	};

	$scope.processRowClick = function(row) {
		var grid = $scope.gridApi.grid;
		showMess(JSON.stringify( row.entity ));
	};

	$scope.activityData.onRegisterApi = function (gridApi) {
		$scope.gridApi = gridApi;
	};

	$scope.historyData.onRegisterApi = function (gridApi) {
		$scope.gridApi = gridApi;
		gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
			paginationOptions.pageNumber = newPage;
			paginationOptions.pageSize = pageSize;
			getPage();
		});
	};

	function finalizeInit() {
		WAC.sys.initApp( activityService.getAppName(), '*', getPage );
	}

	// listen for all app/app events
	WAC.sys.WACInit( finalizeInit, WAC.sys.evts, processEvent );

	function processEvent(data) {
		var d;

		if ( typeof data === 'string' ) {
			data = JSON.parse( data );
		}

		// this thing has data coming in every which way
		if ( typeof data.op !== 'undefined' ) {
			d = {
				'eventNum' : count++,
				'name' : data.op,
				'user' : data.user,
				'timestamp' : new Date().toLocaleTimeString('en-us', dateFormat ),
				'severity' : 'NORMAL'
			};
		} else if ( typeof data.event !== 'undefined' ) {
			var e = data.event;
			data = JSON.parse( data.data );
			d = {
				'eventNum': count++,
				'name': e + ': ' + data.name,
				'user': data.userName,
				'timestamp': data.created
			};
		} else {
			d = {
				'eventNum': count++,
				'name': data.name,
				'user': data.user,
				'timestamp': new Date( data.timestamp ).toLocaleTimeString('en-us', dateFormat ),
				'severity': data.severity
			};
		}
		$scope.activityData.data.unshift(d); // add the newest element to the front of the array
		//$scope.activityData.data[count++] = d;
		// table won't refresh automatically without the apply call
		$scope.$apply();
	}

	// Get history events from the database with the followin functions

	// create plain array for easy handling, with rows having sequential numbers
	function massageData( dataRows ) {
		var rowsFetched = 0;
		var arr = [];
		var d;

		angular.forEach( dataRows, function( activityEntry ) {
			d = {
				'id' : rowsFetched,
				'eventNum' : activityEntry.id,
				'name' : activityEntry.name,
				'user' : activityEntry.user.first + ' ' + activityEntry.user.last,
				'timestamp' : new Date( activityEntry.created ).toLocaleTimeString('en-us', dateFormat ),
				'severity': activityEntry.severity
			};
			arr[ rowsFetched++ ] = d;
		});

		return arr;
	}

	// Every time we get a new page, get the total number of available event in the database
	// in case events have been added or removed: this avoids the need for a timer
	// Then get the next page in the history
	function getPage() {
		activityService.numEvents().get().then(
				function(n) { $scope.historyData.totalItems = n; },
				function(e) { showMess(e.data); }
				);
		activityService.nextHistory(paginationOptions.pageNumber, paginationOptions.pageSize).get().then(
				function (rows) { $scope.historyData.data = massageData(rows); },
				function(e) { showMess(e.data) }
				);
	}

	function showMess( mess ) {
		document.getElementById( 'message' ).innerHTML = mess;
		document.getElementById( 'errModal' ).style.display = 'block';
	}

	// we need a scope wrapper to bind this function to the view
	$scope.refreshPage = function() {
		getPage();
	}

}]);