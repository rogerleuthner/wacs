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

// utility functions
// requires the inclusion of OWF js, so is separated from other WAC

if ( typeof OWF === 'undefined' || typeof OWF.Preferences === 'undefined' ) {
	throw 'OWF js must be included before this file';
}

if ( typeof WAC === 'undefined' ) {
	throw 'WAC must be included before this file';
}

WAC.util = (function(win) {

	// title is window title
	// uName is the app URL or the universal name (Ozone)
	// unique is a string identifying the content uniquely
	// data is arbitrary data passed in
	function launchApp( appTitle, uName, unique, data ) {
		// if in Ozone, expect universal name uName
		if ( typeof Ozone === 'object' && Ozone.util.isRunningInOWF() ) {
			// find the app then launch it
			OWF.Preferences.findApps( {
				searchParams:
					{ universalName: uName },
				onSuccess: function(result) {
					OWF.Launcher.launch({
						guid: result[0].id,  /*got appGUID*/
						launchOnlyIfClosed: false,
						title: appTitle,
						data: data},
						function(response) {
							console.log(JSON.stringify(response));
						});
					},
				onFailure: function(err) {
					alert( JSON.stringify( err ) );
				}
			});
		// otherwise, uName should be URL
		} else {
			var w = win.open( uName + "?" + encodeURIComponent( JSON.stringify( data ) ) );
			w.document.write('<title>' + appTitle + '</title>' );
		}
	}

	// usage: var queryp = getQueryParams( document.location.search );
	function g(qs) {
	    qs = qs.split("+").join(" ");

	    var params = {}, tokens,
	        re = /[?&]?([^=]+)=([^&]*)/g;

	    while (tokens = re.exec(qs)) {
	        params[decodeURIComponent(tokens[1])]
	            = decodeURIComponent(tokens[2]);
	    }

	    return params;
	}

	// usage: var o = g( document.location.search );
	// o.parameter ...
	function getQueryParams( qs ) {
		var params = {};
		qs = decodeURIComponent( qs );
		if (location.search) {
		    var parts = qs.substring(1).split('&');

		    for (var i = 0; i < parts.length; i++) {
		        var nv = parts[i].split('=');
		        if (!nv[0]) continue;
		        params[nv[0]] = nv[1] || true;
		    }
		}
		return params;
	}



	return {
		launchApp: launchApp,
		getQueryParams: getQueryParams
	};

})(window);