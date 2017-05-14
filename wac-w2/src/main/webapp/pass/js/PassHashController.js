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
 * Everytime a hashword generation is performed, the state is saved locally (sessionStorage).
 * If the app is redrawn (reloaded), get data in order:
 * 	1) if sessionStorage state is found, use that
 * [ note that 2 and 3 are conducted by the REST api call, not local code]
 *  2) if transient channel state is found, use that
 *  3) if database state is found use that
 *  4) come up blank
 *
 *  Clicking on the 'ShareState' button pushes the current state (UI and sessionStorage should match) up to the
 *  transient channel state.
 *  Clicking on the refresh does the same sequence as the redraw.
 *
 *  The backend may choose to save the transient channel state at any time into a snapshot; code in the individual
 *  app does not care.
 */

passHashApp.controller('PassHashController', [ '$scope', 'PassHashService', '$window',
    function ($scope, PassHashService, $window) {

		$scope.newUser = {};

		$scope.run = function() {
	    	PassHashService.generate( $scope.newUser.password ).get().then(
	    		function( object ) {
	    			if ( typeof object === 'string') {
	    				object = JSON.parse( object );
	    			}
	    			// absent output means blank the fields
	    			// TODO this be handled more gracefully
	    			$scope.newUser.password = object.route;
	    			$scope.newUser.result = object.hashed;
		    	});
		};

		function refresh() {
			location.reload();
		}

		WAC.sys.WACInit( function() {
				WAC.sys.initApp( PassHashService.getAppName(), '*', null );
				SlideInMenu.build();
				SlideInMenu.setButtons( [{label: 'Reset', icon: '/wac-w1/shr/mnu/img/glyphicons_081_refresh.png', callback: refresh }] );
			}, null, null );

}]);