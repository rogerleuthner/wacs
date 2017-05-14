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

var slideshowViewerApp = angular.module('slideshowViewer', ['ngRoute', 'restangular', 'ui.bootstrap', 'ngdragdrop']);

slideshowViewerApp.config(

		['$routeProvider', '$locationProvider', 'RestangularProvider',
		 function ($routeProvider, $locationProvider, RestangularProvider) {

			RestangularProvider.setBaseUrl('/wac-wapi');

			RestangularProvider.setDefaultHeaders({ Authorization: WAC.sys.getJWT() });

			RestangularProvider.setDefaultHttpFields({ cache: false });

			$routeProvider.when('/', {
				templateUrl: 'views/main.html',
				controller: 'slideshowController'
			});
		}]
);

slideshowViewerApp.config(
		['$httpProvider', function($httpProvider) {
			// following supposedly fixes CORS problems
			$httpProvider.defaults.useXDomain = true;
			delete $httpProvider.defaults.headers.common['X-Requested-With'];
		}]
);

slideshowViewerApp.factory('slideshowService', ['Restangular', '$rootElement', function(Restangular, $rootElement) {

	return {

		getAppName: function() {
			return $rootElement.attr('data-ng-app');
		},

		dropSlideshow: function(filename) {
			return Restangular.one('ss/convert').one(filename);
		},

		getMessages: function( wuid ) {
			return Restangular.one('app/getmessages').one( wuid );
		}
	};

}]);