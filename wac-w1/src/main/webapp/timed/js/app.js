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

/**
 * Time Dialator app.
 * Set up Restangular
 * Set routes
 *
 * The app determines the direction of movement and gets the 'next' 'chunk' of values in that direction.
 * The current 'chunk' of values is retained in the scope
 *
 * @author Roger Leuthner
 */

var timedApp = angular.module( 'timedApp',
		[ 'ngRoute', 'restangular', 'ui.grid', 'ui.grid.selection' ]
).config(

		function ( $routeProvider, RestangularProvider ) {
			RestangularProvider.setBaseUrl("/wac-wapi"); // this sets to originating host and port;
			RestangularProvider.setDefaultHeaders( { Authorization: WAC.sys.getJWT() } );
			RestangularProvider.setDefaultHttpFields( { cache: false } );

			// setup for our ResponsePkg if possible
			// TODO this error interceptor should be shared component
			// with a callback implemented as to how to handle the error message
			RestangularProvider.setErrorInterceptor(
					function( response ) {
						// only check for problems with those requests returning a Response object (has status field)
						if ( response.status !== 'undefined' && response.status != 200 ) {

							// only handle problems containing our ResponsePkg
							if ( response.data !== 'undefined'
								&& response.data.text !== 'undefined'
									&& response.data.text != null ) {

								$scope.showMess( response.data.text );
								return false; // stop promise chain
							}
						}
						return true;
					}
			);

			$routeProvider.when( '/', {
				templateUrl:'views/main.html',
				controller: 'TimedController'
		    });
		}

).config( ['$httpProvider', function( $httpProvider ) {
	// following supposedly fixes CORS problems
	$httpProvider.defaults.useXDomain = true;
	delete $httpProvider.defaults.headers.common[ 'X-Requested-With' ];
}]);

timedApp.factory(
	'AppStates', ['$compile', '$rootScope', 'TimedService',

	function( $compile, $rootScope, TimedService ) {
		return function() {
			var elm;
			var AppStates = {
				open : function( data, snapId, name ) {

					var html =
						'<div class="modal" ng-style="modalStyle">' +
							'<div class="modal-dialog">' +
								'<div class="modal-content">' +
									'<div>' +
										'<button id="buttonClose" class="btn btn-primary" ng-click="close()">Close</button>' +
										'<button id="buttonSet" class="btn btn-primary" ng-click="setState()">Get Snapshot:</button>' +
											'<input class="xsnapname" id="xsnapname" readonly type="text" data-ng-model="name" size="32"/>' +
									'</div>' +
									'<div class="modal-body">' +
										'<div id="grid1" ui-grid="modalGridOptions" class="grid"></div>' +
									'</div>' +
								'</div>' +
							'</div>' +
						'</div>';

					elm = angular.element(html);
					angular.element(document.body).prepend(elm);

					$rootScope.close = function() {
						AppStates.close();
					};

					$rootScope.name = name;

					$rootScope.setState = function( ) {
						WAC.sys.startSpinner();
						TimedService.setState( snapId );
						$rootScope.close();
						// ohhh noooo
						document.getElementById( 'currentsnap' ).value = name;
					};

					$rootScope.modalGridOptions = {};

					$rootScope.modalGridOptions.columnDefs =
					    [	/*{ name: 'id', displayName: 'Id' },*/
					     	{ name: 'name', displayName: 'App', enableFiltering : true, width: '30%'  },
					     	{ name: 'description', displayName: 'Content', enableFiltering : true, width: '50%' },
					     	/*{ name: 'user.userName', displayName: 'User' },*/
					     	/*{ name: 'active', displayName: 'Active', type: 'boolean' },*/
					     	{ name: 'created', displayName: 'Created', type: 'date', cellFilter: 'date:"yyyy-MM-dd"', width:'20%' } ];

					$rootScope.modalGridOptions.data = data;
					$rootScope.modalStyle = {"display" : "block"};

					$compile(elm)($rootScope);

				},
				close : function() {
					if (elm) {
						elm.remove();
					}
				}
			};

			return AppStates;
		};
	} ]);