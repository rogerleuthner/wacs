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

/*
 * Players controller.  Show players list; update as per add/remove via listening to EventSource (WACes.js)
 */

playersApp.controller( 'PlayersController',
    function ( $scope, $http, $window, PlayersService ) {

		$scope.gridOptions = {
				enableRowSelection : true,
				multiSelect : false,
				modifierKeysToMultiSelect : false,
				noUnselect : true,
				enableRowHeaderSelection: false
		};
		$scope.msg = {};
		$scope.gridOptions.data = [];

		$scope.gridOptions.columnDefs =
        [
         	{ name: 'name', displayName: 'Name', width: '100%' }
        ];

		$scope.gridOptions.onRegisterApi = function( gridApi ) {

			$scope.gridApi = gridApi;

			gridApi.selection.on.rowSelectionChanged( $scope, function( row ) {
				if ( row.isSelected ) {
					$scope.msg.lastCellEdited = "Select player: " + row.entity.name;
				}
			});
		};

		$scope.run = function() {
	    	PlayersService.getPlayers( ).then(
    			function( object ) {
		    		var count = 0;
		    		var d;
		    		$scope.gridOptions.data = [];
		    		angular.forEach( object, function( chObject ) {
		    			// note labels must match "name" field in original grid data column defs above
		    			d = {
		    				"name" : chObject
		    			};
		    			$scope.gridOptions.data[ count++ ] = d;
		    		});
		    	}
		    );
		};

		function initApp() {
			$scope.run();
			// since this app does not use any sockets, it is not 'initialized' and thus must get the app id manually set
			// (although we really don't do anything with it, underlayers check to make sure it is defined)
			WAC.sys.setAppId( PlayersService.getAppName() );
		}
		WAC.sys.WACInit( initApp, [ WAC.sys.LOGIN, WAC.sys.LOGOUT ] , $scope.run );
	}
);
