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

var activityMonitorApp = angular.module('activityMonitor',
		['ui.grid', 'ui.grid.selection', 'ui.grid.resizeColumns', 'ui.grid.pagination',
		 'ui.bootstrap', 'ui.bootstrap.tpls', 'ngRoute', 'restangular']);

activityMonitorApp.config(

		function ($routeProvider, RestangularProvider, $locationProvider) {

			RestangularProvider.setBaseUrl("/wac-wapi");

			RestangularProvider.setDefaultHeaders({ Authorization: WAC.sys.getJWT() });

			RestangularProvider.setDefaultHttpFields({ cache: false });

			$routeProvider.when('/', {
				templateUrl: 'views/main.html',
				controller: 'ActivityController'
			});

		}
);

activityMonitorApp.config(
		['$httpProvider', function($httpProvider) {
			// following supposedly fixes CORS problems
			$httpProvider.defaults.useXDomain = true;
			delete $httpProvider.defaults.headers.common[ 'X-Requested-With' ];
		}]
);

activityMonitorApp.factory('activityService', ['Restangular', '$rootElement', function(Restangular, $rootElement) {

	return {

	    history: function() {
	    	return Restangular.one( 'activity/listall' );
	    },

	    nextHistory: function( startrow, pagesize ) {
	    	// conversion to string seems to be the only way to create a URL with two sequential numbers using
	    	// restangular calls
	    	return Restangular.one( 'activity/list', startrow ).one( pagesize.toString() );
	    },

	    numEvents: function () {
	    	return Restangular.one('activity/nactivities');
	    },

		getAppName: function () {
			return $rootElement.attr('data-ng-app');
		}
	};

}]);