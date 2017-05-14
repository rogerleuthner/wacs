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

timedApp.factory('TimedService',['Restangular', function (Restangular) {

	return {
		getCount: function( ) {
			var baseCount = Restangular.one( 'timed/count' );
			return baseCount.get();
		},

		// get the list of apps that have a state within the given snapshot id
		getStates: function( snapshotId ) {
			var baseStates = Restangular.one( 'timed/getstates', snapshotId );
			return baseStates.getList();
		},

		getSnapshots: function( prevRow ) {
			var baseSnaps = Restangular.one( 'timed/getsnapshots' );
			return baseSnaps.all( prevRow ).getList();
		},

		deleteSnapshot: function( snapId ) {
			return Restangular.one( 'timed/delete', snapId ).get();
		},

		// set the head snapshot (that on WACSession.channel) to the given snapshot,
		// then send setstate message to all apps telling them to get their app state
		setState:  function( snapId ) {
						Restangular.one( 'timed/sethead' ).one( encodeURIComponent( snapId ) ).get().then(
							function( result ) {
								WAC.wst.sendSet( snapId );
								WAC.sys.stopSpinner();
							}, function( err ) {
								$scope.showMess( err.text );
								WAC.sys.stopSpinner();
							}
						);
		},

		// create empty snapshot, return it's id
		snapshot:  function( name, desc ) {
			WAC.sys.startSpinner();
			var app = Restangular.one( 'timed/snapshot' ).one( encodeURIComponent( name ) ).one( encodeURIComponent( desc ) );
			return app.get();
		}
	};
}]);