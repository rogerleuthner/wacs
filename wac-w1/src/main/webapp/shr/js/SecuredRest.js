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

//
//angular.module('WAC.securedRest', ['restangular','ngRoute', 'Config']).
//
//config( function( RestangularProvider, $routeProvider, ConfigProvider ) {
//	
//}).
//
//run( function( RestangularProvider, ConfigProvider ) {	
//
//	RestangularProvider.setBaseUrl( ConfigProvider.baseServiceUrl );
//
//	RestangularProvider.setDefaultHeaders( { Authorization: ConfigProvider.jwt } );
//	
//	// cache data so it's not fetched every time a page is refreshed
//	RestangularProvider.setDefaultHttpFields({cache: ConfigProvider.restCaching });	
//	
//}).
//
//factory('ClientSecurity', function( ) {
//	return 
//});
//
//


/* setup restangular for our security model */






function SecuredRest( RestangularProvider, url, jws ) {
	RestangularProvider.setBaseUrl( url );
	RestangularProvider.setDefaultHeaders( {'Authorization' : jws} );	
	// cache data so it's not fetched every time a page is refreshed
	RestangularProvider.setDefaultHttpFields( {'cache': true} );	
	// set "X-Requested-With" to empty in order to bypass CORS pre-flight OPTION request
	RestangularProvider.setDefaultHeaders( {'X-Requested-With' :''} );	
		
	return {
		GetOne : function( onSuccess, onError ) {
			RestangularProvider.get().then(
					function( object ) {
			    		onSuccess( object );
			    	}, function( err ) {
			    		onError( err );
			    	}				
				);
			},
			// mite want to install a responseextractor
		GetMulti : function( onSuccess, onError ) {
			RestangularProvider.all().then(
					function( object ) {
						onSuccess( object );
					}, function( err ) {
						onError( err );
					}
				);
		}
	};
	
}