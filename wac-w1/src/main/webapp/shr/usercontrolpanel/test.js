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


var WAC = WAC || {};

WAC.edit = WAC.edit || {};

WAC.edit = (function(win) {



function start() {
	document.getElementById( 'who' ).style.backgroundColor = 'yellow';
}
function finish() {
	document.getElementById( 'who' ).style.backgroundColor = 'white';
}


function initApp( ) {
	WAC.sys.initApp( 'c', '*', function() {

		document.getElementById( 'who' ).innerHTML = WAC.sys.getUser();

		WAC.sys.initSubApp( 'usercontrolpanel', 'c',
				function( appId ) {
					WAC.usercontrolpanel.init(appId, 'c', start, finish );
				}
			);
	});
}

WAC.sys.WACInit( initApp, null, null );

return {
};

})(window);