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
 * Links Manager app.
 * Set grid options used in controller.
 * Set up Restangular
 * Set routes
 *
 * @author rleuthner
 */

var linksManagerApp = angular.module( 'linksManagerApp',
		[ 'ngRoute', 'restangular', 'ui.grid', 'ui.grid.edit', 'ui.grid.selection', 'ui.grid.resizeColumns', 'ngdragdrop' ]
).config(

		function ( $routeProvider, RestangularProvider ) {

					// TODO this crap should be handled by general purpose WACRestangular module
			RestangularProvider.setBaseUrl( '/wac-wapi' );

			RestangularProvider.setDefaultHeaders( { Authorization: WAC.sys.getJWT() } );

			// don't want cache data as we do database updates and want to see them
			// upon refresh
			RestangularProvider.setDefaultHttpFields( { cache: false } );

			$routeProvider.when( '/', {
				templateUrl:'views/main.html',
				controller: 'LinksManagerController'
		    });
		}

).config( ['$httpProvider', function( $httpProvider ) {
	// following supposedly fixes CORS problems
	$httpProvider.defaults.useXDomain = true;
	delete $httpProvider.defaults.headers.common[ 'X-Requested-With' ];
}]);