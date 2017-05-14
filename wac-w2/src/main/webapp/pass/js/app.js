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

var passHashApp = angular.module('passHashApp', ['restangular','ngRoute'])

.config( ['$routeProvider','RestangularProvider','$httpProvider',

	function ($routeProvider, RestangularProvider, $httpProvider) {

		RestangularProvider.setBaseUrl("/wac-wapi");

		// no valid JWT required for this app
		RestangularProvider.setDefaultHeaders({ Authorization: WAC.sys.getJWT() });

		// cache data so it's not fetched every time a page is refreshed
		RestangularProvider.setDefaultHttpFields({cache: false});

		$routeProvider.when('/', {
	            templateUrl:'/wac-w2/pass/views/PasswordHasher.html',
	            controller: 'PassHashController'
	     });

		// following supposedly fixes CORS problems
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common[ 'X-Requested-With' ];

	}
]);