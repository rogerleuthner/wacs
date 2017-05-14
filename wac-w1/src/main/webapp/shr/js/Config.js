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


// module which provides a central place to configure WAC modules/apps
// the included config items either default or merely provide documentation
// that they are expected

angular.module( 'WAC.Config', [] )
.provider( 'ConfigProvider', function() {
	var config = {
		// "/wac-wapi/auth/generate"
		baseServiceUrl : '',
		//
		jwt: '',
		// cache data so it's not fetched every time a page is refreshed if possible, set to false if problematic
		restCaching: true
	};
	
	return {
		set: function( settings ) {
			config = settings;
		},
		$get: function() {
			return config;
		}		
	};
});