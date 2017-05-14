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


var shareApi
	,shareMessage = { 'op':'operation', 'value':'data' }
	,currentImage; 	// retain current image so we can suppress shares of the same image

	// TODO when a person 'joins' an in-process graphic that has anno layer, need to start with layer "on"

	var dcb = function(data) {
		var data = JSON.parse( data )
			,getIt = false
			,type;

		// TODO screwy, needs to have switch put into function and called either now or after the file is retrieved
		// + share code with other drop targets
		if ( data.type === 'LINK' ) {
			type = data.path.substring( data.path.lastIndexOf( "." ) + 1);
			getIt = true;
		} else {
			type = data.name.substring( data.name.lastIndexOf( "." ) + 1);
		}

		switch( type ) {
				// legacy typings
			case 'jpg':
			case 'jpeg':
			case 'gif':
			case 'tif':
				// following will be better 'typed' if uploaded by dragging into the form upload (Assets Manager)
			case 'image/jpeg':
			case 'image/tif':
			case 'image/tiff':
			case 'image/jpg':
			case 'image/gif':
				if ( getIt ) {
					WAC.sys.fetchResource( data.id, data.path,
							function( data ) {
								WAC.sys.sendEventNotice( WAC.sys.PICTURESHARE );
								loadImageAndInitialize( {'value':data} );
								shareApi.publish( { 'op' : 'loadImage', 'value': data } );
							},
							showMess
						);

				} else {
					WAC.sys.sendEventNotice( WAC.sys.PICTURESHARE );
					loadImageAndInitialize( {'value':data.name} );
					shareApi.publish( { 'op' : 'loadImage', 'value': data.name } );
				}
				break;

			default:
				showMess( 'Cannot handle provided suffix: ' + JSON.stringify( data ) );
		}
	};

	function showMess( mess ) {
		document.getElementById( 'message' ).innerHTML = mess;
		document.getElementById( 'errModal' ).style.display = 'block';
	}

	function addButtonListItem( list, image ) {
		var li = document.createElement( 'li' );
		var button = document.createElement( 'button' );
		button.setAttribute( 'class', 'btn btn-primary' );
		button.setAttribute( 'style', 'margin: 2px' );
		button.addEventListener( 'click', function( e ) { loadImageAndInitialize( {'value':image} ); }, false );
		button.innerHTML = image;
		li.appendChild( button );
		list.appendChild( li );
	}

	function getAppInstances( ) {
		var request = new XMLHttpRequest();
		request.open("GET", "/wac-wapi/app/listinstances/" + encodeURIComponent( WAC.sys.getAppId() ), true);
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {

					var o = JSON.parse( request.responseText );
					var l = document.getElementById( 'sharedList' );
					for( var i = 0; i < o.length; i++ ) {
						addButtonListItem( l, o[ i ] );
						document.getElementById( 'running' ).style.display = 'block';
					}

				} else {
					// readyState 4 but bad request status
					throw 'Did not receive requested data: ' + request.statusText;
				}
			} // else, just ignore as the request is not "ready" yet
		};
		request.send();
	}

	// dropped in image or startup
	function completeInit() {
		if ( typeof shareApi !== 'undefined' ) {
			shareApi.close();
		}
		shareApi = WSApi( {
			'service' : 'message',
			'target' : WAC.sys.getAppId(),  // always want this to be viewer*, as it's the common channel we always monitor; init before anno
			'jwt' : WAC.sys.getJWT(),
			'messageHandler' : processRequest,
			'errorHandler' : handleError
		} );

		WAC.annoApi.initJS();

		// get running instances so we can assemble a list to choose from
		getAppInstances();
	}

	function handleError(e) {
		alert( JSON.stringify( e ) );
	}

	function processRequest( message ) {
		message = JSON.parse( message );

		switch ( message.op ) {
			case 'loadImage':
				addButtonListItem( document.getElementById( 'sharedList' ), message.value );
				break;
		}
	}

	function dismissMess() {
		document.getElementById( 'errModal' ).style.display = 'none';
	}

	// dropped in image
	function loadImageAndInitialize( data ) {
		currentImage = data.value;
		document.body.style.backgroundImage = 'url(' + '/wac-wapi/asset/imagefile/' + encodeURIComponent( data.value ) + ')';
		WAC.sys.initApp( 'viewer', encodeURIComponent( data.value ), WAC.annoApi.initJS );
		document.getElementById( 'running' ).style.display = 'none';
	}

	function shutdown() {
		WAC.annoApi.terminate();
	}

	function reloadImageAndInitialize( ) {
		WAC.sys.initApp( 'viewer', '*', completeInit );
		SetupDropAttrib( dcb );
	}

	function getState() {
		return WAC.annoApi.getState();
	}

	function setState( stateStr ) {
		WAC.annoApi.setState( stateStr );
		location.reload();  // cheap (expensive) hack
	}

	function eventReceiver( e ) {
		var o = JSON.parse( e );

		switch( o.op ) {
			case WAC.sys.STATESAVE:
				WAC.wst.update( o.data, WAC.sys.getAppId(), currentImage, getState() );
				break;
			case WAC.sys.STATESET:
				WAC.wst.getAppHead( setState );
				break;
		}
	}

	function initApp( ) {
		WAC.sys.initApp( 'viewer', '*', completeInit );
		SetupDropAttrib( dcb );
	}

	WAC.sys.WACInit( initApp, null, eventReceiver );
