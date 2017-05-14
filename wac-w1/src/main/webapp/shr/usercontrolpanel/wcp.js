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


var WAC = WAC || {};

WAC.usercontrolpanel = (function(win) {
	var wuid, desc, startCallBack, finishCallBack, dataTable;

	// states which have programmatic meaning yet also display to user
	const CONTROL = {
			HAS : 'has control',
			WAIT : 'waiting'
	};
	const NOBODY = null;

	// internal commands
	const CMDS = {
			RELEASE : 'release',
			ASSIGN : 'assign',
			REQUEST : 'request'
	};

    function init(appId, description, start, finish) {
    	wuid = appId;
    	desc = description;
	    createUserControlPanel();
	    startCallBack = start; //function() {};// start;
	    finishCallBack = finish; //function() {};finish;
    }

    function saveyourself( snapId ) {
    	// here datatable has an extra attribute (haskey for the data grid), but just ignore it
    	// saving control messages is causing more problems than it's worth at the moment
		//WAC.wst.update( snapId, wuid, desc, JSON.stringify( dataTable ) );
    }

	function createUserControlPanel()
	{
		var e = document.createElement( "data-ng-view" );
		// set an id so we can find and invoke methods externally when needed, see editor
		e.setAttribute( 'id', 'cpanel' );
		document.body.appendChild( e );

		angular.module('cpApp', ['ngRoute', 'ui.grid', 'ui.grid.selection' ]
			).config(
					function ( $routeProvider) {
						$routeProvider.when( '/', {
							templateUrl:'/wac-w1/shr/usercontrolpanel/views/main.html',
							controller: 'EditController'
					    });
					}
			).config( ['$httpProvider',
	           function( $httpProvider ) {
						// following supposedly fixes CORS problems
					$httpProvider.defaults.useXDomain = true;
					delete $httpProvider.defaults.headers.common[ 'X-Requested-With' ];
				}
			]).controller('EditController', ['$scope',
			    function ($scope) {
		            window.onbeforeunload = function (event) {
		            	// slightly different in that this user may neither have nor is waiting
		            	// so avoid all actions if has no current collab state
						var me = WAC.sys.getUser();

						switch( getStatus( me ) ) {
							case CONTROL.HAS:
								finishCallBack();
								// fall through to WAIT actions
							case CONTROL.WAIT:
								removeUser( me );
								WAC.sys.message( wsapi, CMDS.RELEASE, '', me );
							default: // neither has nor waiting, do nothing
								break;
						}
		            }

					$scope.gridOptions = {
							headerRowHeight:0,
							enableRowSelection : true,
							multiSelect : false,
							modifierKeysToMultiSelect : false,
							noUnselect : true,
							enableRowHeaderSelection: false,
					};

					$scope.gridOptions.columnDefs =
			        [
			         	{ name: 'username', displayName: 'User', width: '50%' },
			         	{ name: 'status', displayName: 'Status', width: '50%' }
			        ];
					$scope.gridOptions.onRegisterApi = function( gridApi ) {
						$scope.gridApi = gridApi;
					};

					$scope.model = {data:[]};
					$scope.requestButtonDisabled = false;
					$scope.releaseButtonDisabled = true;
					$scope.assignButtonDisabled = true;
					$scope.gridOptions.data = 'model.data';
					// expose the datatable for non-angular use
					dataTable = $scope.model.data;

					var wsapi = WSApi( {
						service:'message',
						target: wuid,
						jwt: WAC.sys.getJWT(),
						messageHandler: function(str) {
								 			receiveCommand(str, true);
								 			$scope.$apply();
										},
						errorHandler: null
				    });

					// TODO just make this a condense and apply rather than command replay
					replayCommandsOnStartup();

				    function replayCommandsOnStartup() {
				    	WAC.wst.getMessages(
			    			function( arg ) {
				    			var o = JSON.parse( arg );
			    				for( var i = 0; i < o.length; i++ ) {
			    					receiveCommand( o[ i ], false );
			    				}
			    				if($scope.model.data.length > 0)
			    				{
			    					var covering_div= document.getElementById("covering_div");
			    					covering_div.style.visibility = 'visible';
			    				}
								// force entries to appear at startup; otherwise repaint of control holder table not guaranteed
								$scope.$apply();
			    			}, wuid );
				    }

					function addUser( user_name, status ) {
						$scope.model.data.push( {username:user_name,status:status} );
					}

					function removeUser( user_name ) {
						for (var i = 0; i < $scope.model.data.length; i++) {
							var row = $scope.model.data[i];
							if (row.username === user_name) {
								$scope.model.data.splice(i, 1);
								break;
							}
						}
					}

					function getController() {
						for (var i = 0; i < $scope.model.data.length; i++) {
							var row = $scope.model.data[i];
							if (row.status === CONTROL.HAS ) {
								return row.username;
								break;
							}
						}
						return NOBODY;
					}

					function setControl( user_name ) {
						for (var i = 0; i < $scope.model.data.length; i++) {
							var row = $scope.model.data[i];
							if (row.username === user_name) {
								row.status = CONTROL.HAS;
								// now move them to top
								$scope.model.data.splice( i, 1 );
								$scope.model.data.unshift( row );
								break;
							}
						}
					}
					function getStatus( user_name ) {
						for (var i = 0; i < $scope.model.data.length; i++) {
							var row = $scope.model.data[i];
							if (row.username === user_name) {
								return row.status;
								break;
							}
						}
						return NOBODY;
					}

					function getNextWaiter() {
						if ( $scope.model.data.length > 0 ) {
							for (var i = 0; i < $scope.model.data.length; i++) {
								var row = $scope.model.data[i];
								if ( row.status === CONTROL.WAIT ) {
									return row.username;
								}
							}
						}
						return null;
					}

					// user requested control
					// no one has it, they get it
					// someone has it, they wait
					function _request( u, call_callbacks ) {
						if ( getController() === NOBODY ) {
							addUser( u, CONTROL.HAS );
							return true;
						} else {
							addUser( u, CONTROL.WAIT );
							return false;
						}
					}

					$scope.request = function() {
						console.log("generating Request Control:  "+WAC.sys.getUser());
						$scope.requestButtonDisabled = true;
						$scope.releaseButtonDisabled = false;

						if ( _request( WAC.sys.getUser(), true ) ) {
							startCallBack();
							$scope.assignButtonDisabled = false;
						} else {
							$scope.assignButtonDisabled = true;
						}

						WAC.sys.message( wsapi, CMDS.REQUEST, '', WAC.sys.getUser() );
					}

					// return true if u released
					// if there are waiters, assign to first one
					function _release( u, call_callbacks ) {
						var status = getStatus( u );

						if( status === CONTROL.HAS ) {

							if ( getNextWaiter() !== null ) {
								_assign( u, getNextWaiter(), call_callbacks );
							} else {
								removeUser( u );
							}
							return true;

						} else if( status === CONTROL.WAIT ) {
							removeUser( u );
							return false;
						}
					}

					$scope.release = function() {
						console.log("generating Release Control:  "+WAC.sys.getUser());
						$scope.requestButtonDisabled = false;
						$scope.releaseButtonDisabled = true;
						$scope.assignButtonDisabled = true;

						if ( _release( WAC.sys.getUser(), true ) ) {
							finishCallBack();
						}

						WAC.sys.message( wsapi, CMDS.RELEASE, '', WAC.sys.getUser() );
					}

					// if person being assigned to is me, start action and allow reassign
					function _assign( from, to, call_callbacks ) {
						removeUser( from );
						setControl( to );
						if ( to === WAC.sys.getUser() ) {
							$scope.assignButtonDisabled = false;
							if(call_callbacks === true)
								startCallBack();
						} else {
							$scope.assignButtonDisabled = true;
						}
					}

					$scope.assign = function() {
						var row = $scope.gridApi.selection.getSelectedRows();

						if ( typeof row !== 'undefined' && row.length === 1 && row[0].username !== WAC.sys.getUser() ) {
							var toWho = row[ 0 ].username;
							console.log("generating Assign Control: from "+WAC.sys.getUser()+" to "+toWho);

							if ( getStatus( toWho ) === CONTROL.WAIT ) {

								$scope.requestButtonDisabled = false;
								$scope.releaseButtonDisabled = true;
								$scope.assignButtonDisabled = true;

								_assign( WAC.sys.getUser(), toWho, true );
								finishCallBack();
								WAC.sys.message( wsapi, CMDS.ASSIGN, WAC.sys.getUser(), toWho );
							} // else, not waiting, just ignore
						} // no selection, just ignore
					}

					function receiveCommand(str, call_callbacks) {
						var cmd = JSON.parse(str);

						switch( cmd.op ) {
							case CMDS.ASSIGN:
								// if I assigned out, make sure I'm done
								if ( cmd.data === WAC.sys.getUser() && call_callbacks) {
										finishCallBack();
								}
								_assign( cmd.data, cmd.who, call_callbacks );
								break;
							case CMDS.RELEASE:
								if ( _release( cmd.who, call_callbacks )&& cmd.who === WAC.sys.getUser() ) {
									$scope.assignButtonDisabled = true;
									if(call_callbacks === true)
										finishCallBack();
								}
								break;
							case CMDS.REQUEST:
								if ( _request( cmd.who, call_callbacks ) && cmd.who === WAC.sys.getUser() && call_callbacks) {
									startCallBack();
								}
								break;
						}
					}
				}
			]);

		angular.bootstrap(document, ['cpApp']);
	}

	// external visibility; e.g. editor can cancel edits/release control themselves.
	function release() {
		var c = document.getElementById( 'cpanel' );
		var scope = angular.element( c ).scope();
		scope.releaseControl();
		scope.$apply();
	}

	function getWuid() {
		return wuid;
	}

	return {
		init:init,
		release:release,
		getWuid:getWuid,
		saveyourself: saveyourself
	};

})(window);