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


fileUploader.factory('Service',['$rootElement', function ($rootElement) {

	function handleReturn( object, callback ) {
		if ( object.status === 'OK' ) {
			callback( object.data );
		} else if ( object.status === 'NO_CONTENT' ) {  // TODO define NO_CONTENT
			// TODO no current state.  do we blank? ask user? leave alone?
			alert( 'No state found' );
		} else {
			alert( 'Bad response: ' + JSON.stringify( object ) );
		}
	}

	function appName() {
		return $rootElement.attr('data-ng-app' );
	}

	return {

		getAppName: function() {
			return appName();
		},

//		getState : function( setState ) {
//			Restangular.one( 'app/getstaticstate/fileUploader' ).get().then(
//					function( object ) {
//						handleReturn( object, setState );
//					}, function( err ) {
//						alert( err )
//					}
//				);
//		},

	    saveStateLocal: function( state ) {
	    	sessionStorage.setItem( appName(), JSON.stringify( state ) );
	    },

	    getStateLocal: function() {
	    	return sessionStorage.getItem( appName() );
	    }

	};
}]);