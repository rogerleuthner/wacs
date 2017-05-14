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
 * @author Roger Leuthner
 */

timedApp.controller( 'TimedController', [ '$scope', '$http', '$window', 'TimedService', 'AppStates', '$rootScope',
    function ( $scope, $http, $window, TimedService,  AppStates, $rootScope ) {
		gridSetup( $scope );

		var myModal = new AppStates();

		$scope.showMess = function( mess ) {
			document.getElementById( 'message' ).innerHTML = mess;
			document.getElementById( 'errModal' ).style.display = 'block';
		}

		// retrieve data for selected row and init/show modal
		$scope.showModal = function( snapshotId, name ) {
			TimedService.getStates( snapshotId ).then( function( data ) {
				myModal.open( data, snapshotId, name  );
				WAC.sys.stopSpinner();
			});
		};

		$scope.consolePush = function() {
			WAC.wst.sendPush();
		}

		/*
		 * Create a snapshot.
			Create a snapshot with all the "live" app state and command messages copied into it.
			Send a save event to all of the users' apps so that they may update and condense the snapshot with their state.

			TODO there may have to be performance tuning done here - e.g. instead of saving a massive command/message list for a app
			it may be necessary to condense it into a JSON-formatted string and save that instead of using the messages child container.
			There is commented out code in WACSession that shows how to generate this string from the messages list.

		 */
		$scope.consoleSnapshot = function() {
			if ( typeof $scope.pager.snapshotName === 'undefined' || $scope.pager.snapshotName === '' ) {
				$scope.showMess( 'You must provide at least a snapshot name.  No snapshot created' );
				return;
			}
			// default this so that the webapi signature always matches even if left blank
			if ( typeof $scope.pager.snapshotDesc === 'undefined' || $scope.pager.snapshotDesc === '' ) {
				$scope.pager.snapshotDesc = '(no description provided)';
			}
			TimedService.snapshot( $scope.pager.snapshotName, $scope.pager.snapshotDesc ).then(
					function( result ) {
						refreshGridData( $scope, TimedService );
						$scope.pager.snapshotName = '';
						$scope.pager.snapshotDesc = '';

						WAC.wst.sendSave( result );

						WAC.sys.stopSpinner();

					}, function( err ) {
						$scope.showMess( err.text );
					}
			);
		};

		function gridSetup( $scope ) {
			$scope.gridOptions = {
					enableRowSelection : true,
					multiSelect : false,
					modifierKeysToMultiSelect : false,
					noUnselect : true,
					enableRowHeaderSelection : false,
					enableFiltering : true
			};
			$scope.gridOptions.data = [];

			$scope.gridOptions.columnDefs =
		    [
		     	// note that 'name' attribute must be resolvable as javabean field for target type
		     	// if database updates are to work!!!!

		     	/*{ name: 'id', displayName: 'Id', enableCellEdit: false, width: '5%', enableFiltering : false },*/
		     	{ name: 'name', displayName: 'Name', enableCellEdit: false, width: '15%' },
		     	{ name: 'description', displayName: 'Description', enableCellEdit: false, width: '50%' },
		     	/*{ name: 'active', displayName: 'Active', width: '5%', type: 'boolean' },*/
		     	{ name: 'user.userName', displayName: 'User', width: '15%' },
		     	{ name: 'created', displayName: 'Date', type: 'date', enableCellEdit: false, cellFilter: 'date:"yyyy-MM-dd"', width: '15%', enableFiltering : true },
	         	{ name: 'Del', enableCellEdit: false,
		             cellTemplate: '<div><button class="rowbtn btn btn-primary" ng-click="grid.appScope.buttonClicked = true;grid.appScope.deleteRow(row)">Del</button></div>',
		             width: '5%', enableFiltering : false, enableCellEdit: false
		         	}
		    ];

			$scope.deleteRow = function(row) {
			    var index = $scope.gridOptions.data.indexOf(row.entity);
			    TimedService.deleteSnapshot( row.entity.id );
			    $scope.gridOptions.data.splice(index, 1);
			};

			$scope.gridOptions.onRegisterApi = function( gridApi ) {

				$scope.gridApi = gridApi;

				gridApi.selection.on.rowSelectionChanged( $scope, function( row ) {
					// little hack to avoid doing row select action if the row delete button is clicked
					if ( ! this.grid.appScope.buttonClicked ) {
						// only act on the target "to" row, not "from" row as the event is
						// fired for both to/from actions
						if ( row.isSelected ) {
							WAC.sys.startSpinner();
							$scope.showModal( row.entity.id, row.entity.name );
						}
					} else {
						this.grid.appScope.buttonClicked = false;
					}
					row.isSelected = false;
				});
			};
		}

		function refreshGridData( $scope, TimedService ) {
			TimedService.getSnapshots( 0 ).then(
					function( snapshots ) {
			    		$scope.gridOptions.data = snapshots;
			    	}
			    );
			$scope.pager.currentsnap = '(current)';
		}

		function Page( TimedService ) {

			var totalRows;
			var that = this;
			var current;
			var lastCurrent = current;

			var countThenSetup = TimedService.getCount( ).then(
					// get # of rows of data, then setup grid as per that
						function( data ) {
							that.totalRows = data;

							that.__defineGetter__("currentValue", function () {
						        return that.current;
						    });

							// when the slider is changed by just so much, the set of cached Snapshot data changes, and then
							// some of the new cached data is loaded into the "target".
							// if changed less than so much, the cached values corresponding to the new slider value are changed
						    that.__defineSetter__("currentValue", function (val) {
						    	that.lastCurrent = that.current;
						    	that.current = val;
						    });
							that.__defineGetter__("direction", function () {
								if ( that.lastCurrent < that.current ) {
									return 'forward';
								}
								return 'back';
						    });
						    that.__defineSetter__("direction", function (val) {
						    	that.direction = val;
						    });
						},
						function err( data ) {
							$scope.showMess( data );
						}
					);
		}

		function init() {
			$scope.pager = new Page( TimedService );
			refreshGridData( $scope, TimedService );
		}

		function fit() {
			WAC.sys.initApp( 'timed', '*', init );
			SlideInMenu.build();
			SlideInMenu.setButtons( [{label: 'Save Snapshot', icon: '/wac-w1/shr/mnu/img/glyphicons_447_floppy_open.png', callback: $scope.consoleSnapshot }] );
		}

		WAC.sys.WACInit( fit, null, null );
}]);

