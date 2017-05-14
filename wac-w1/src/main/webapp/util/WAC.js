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


/**
 * Execute in each app to interface with user, channel, jwt and the intra and inter event mechanism.
 * Each app has an instance of this object; so object-local data is private to that app
 *
 * @author Roger Leuthner
 */

var WAC = WAC || {};

WAC.sys = WAC.sys || {};

WAC.sys = (function(win) {

	var eventService;
	var app = {
		id: undefined
	};

	const FILEADD = 'fileAdd';	// payload is file meta data
	const FILEREMOVE = 'fileRemove';
	const FILECHANGE = 'fileChange'; // some field was edited
	const FILEFETCH = 'fileFetch';  // link fetched, added as a file
	const LOCKDOC = 'lockDocument';
	const UNLOCKDOC = 'unlockDocument';
	const LOGIN = 'login';
	const LOGOUT = 'logout';
	const FORMUPLOAD = 'formUpload';
	const FORMSHARE = 'formShare';
	const SLIDESHOWPUBLISH = 'slidePublish';
	const PICTURESHARE = 'pictureShare';
	const GIS = 'gisCoords';
	const STICKY = 'sticky';
	const STATESAVE = 'stateSave';
	const STATESET = 'stateSet';
	const EVENTS = [ FILEADD, FILEREMOVE, FILECHANGE, FILEFETCH, LOCKDOC, UNLOCKDOC, LOGIN, LOGOUT, FORMUPLOAD, FORMSHARE,
	                 SLIDESHOWPUBLISH, PICTURESHARE, GIS, STATESAVE, STATESET, STICKY ];

	////////////////// WAC_SESSION
	// CHAN and JWT cookies are set by OWF in OWF, but manually for standalone
	// USER is always set here
	const WAC_CH_ID = 'WAC_chId';
	const WAC_JWT = 'WAC_jwt';
	const WAC_USER = 'WAC_user';

	// app id is set while initializing the front end;
	// at end of that initialization, the app completes it's initialization by sending the requisite id
	// to the backend so that the app may be positively identified for sharing purposes
	function getAppId() {
		if ( typeof app.id === 'undefined' ) {
			showError( 'WAC Initialization error: app id must be set in user code as part of initialization' );
		}
		return app.id;
	}
	function setAppId( id ) {
		app.id = id;
	}

	function getChID() {
		return readCookie( WAC_CH_ID );
	}

	function getUser() {
		return readCookie( WAC_USER );
	}

	function setUser( user ) {
		createCookie( WAC_USER, user, 1 );
	}

	function getJWT() {
		return readCookie( WAC_JWT );
	}

	// used for standalone setup only
	function setJWT( jwt ) {
		createCookie( WAC_JWT, jwt, 1 );
	}

	// used for standalone setup only
	function setChID( ch ) {
		createCookie( WAC_CH_ID, ch, 1 );
	}

	function deleteJWT() {
		eraseCookie( WAC_JWT );
	}

	function createCookie(name,value,days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; secure=true; path=/";
	}

	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

	function eraseCookie(name) {
		createCookie(name,"",-1);
	}

	function set( key, val ) {
		sessionStorage.setItem( key, val );
	}

	function rem( key ) {
		sessionStorage.removeItem( key );
	}

	function get( key ) {
		return sessionStorage.getItem( key );
	}

	// reset the session storage functions since if it is not available
	function disableSessionStorageUse( mess ) {
		set = function( a, b ) { alert( mess ); };
		rem = function( a ) { alert( mess ); };
		get = function( a ) { alert( mess ); };
	}

	function stopSpinner() {
		var y = win.document.getElementById( 'initializing' );
		if ( typeof y !== 'undefined' && y !== null ) {
			y.setAttribute( 'style', 'display: none;' );
		}
	}

	function startSpinner() {
		var y = win.document.getElementById( 'initializing' );
		if ( typeof y !== 'undefined' && y !== null ) {
			y.setAttribute( 'style', 'display: block;' );
		}
	}

	function showError( e ) {
		var x = win.document.getElementById( 'init-failure' );
		if ( e === 'undefined' ) {
			e = '(cannot connect)';
		} else if ( e instanceof Error ) {
			e = e.message;
		} else if ( e instanceof Object ) {
			e = JSON.stringify( e );
		}
		if ( typeof x !== 'undefined' && x !== null ) {
			x.setAttribute( 'class', 'init-failure' );
			x.setAttribute( 'style', 'display:block;' );
			x.innerHTML = '<h2>App Failed to Initialize</h2><h3>ERROR: ' + e
							+ '</h3><h3>If refresh fails to fix this error, please contact support</h3>';
			stopSpinner();
		}
		console.log( e );  // stopgap in case user hasn't created the error div
	}

	function errorResponse( request ) {
		// readyState 4 but bad request status
		if ( request.status === 401 ) {
			showError( 'Not authorized OR cookies (session) must be enabled' );
		} else {
			showError( 'Did not receive requested data: ' + request.statusText );
		}
	}

	// initialize myself as a app.
	// app initialization; callback is the holder for population with existing instance descriptors
	function initApp( name, desc, callback ) {
		initSubApp( name, desc,
				function( d ) {
					setAppId( d );
					typeof callback === 'function' && callback( d );
				}
		);
	}

	// init app entry point that does not affect the currently running app, capture the returned app id
	// by accepting it as an argument for the provided 'callback' function
	function initSubApp( name, desc, callback ) {
		var request = new XMLHttpRequest();
		request.open("GET", "/wac-wapi/app/register/" + encodeURIComponent( name ) + "/" + encodeURIComponent( desc ), true);
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {
					typeof callback === 'function' && callback( request.responseText );

				} else {
					errorResponse( request );
				}
			} // else, just ignore as the request is not "ready" yet
		};
		request.send();
	}

	// standardize message formats for easier state condensing
	function message( chan, opcode, data, who ) {
		chan.publish( {
			'op' : opcode,
			'data' : data,
			'who' : who
		});
	}

	// this entry point is through a REST call
	// fire and forget event notice
	function sendEventNotice( noticeType ) {
		var request = new XMLHttpRequest();
		request.open("GET", "/wac-wapi/eventNotice/emit/" + encodeURIComponent( noticeType ), true);
		request.send();
	}

	// direct websocket send of arbitrary JSON
	// json text needs to at least contain:
	// {events: 'known event type'} to get through events endpoint;
	// other fields may be required by recipients (e.g. ActivityMonitor and/or final target)
	function publishEvent( json ) {
		eventService.publish( json );
	}

	function uploadFile( file, done, err ) {
		var formdat = new FormData()
			,request = new XMLHttpRequest();

		formdat.append( 'Filedata', file );
		request.open( "POST", "/wac-wapi/FileReceiver" );

		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {
					if ( typeof done === 'function' ) {
						done( file, request.responseText );
					}
					return file;
				} else {
					if ( typeof err === 'function' ) {
						err( file + ': ' + request.responseText );
					} else {
						errorResponse( request.responseText );
					}
					return null;
				}
			}
		};
		request.send( formdat );
	}

	function fetchResource( id, url, done, err ) {
		startSpinner();
		var request = new XMLHttpRequest();
		request.open( "GET", "/wac-wapi/asset/fetchresource/" + id + "/" + encodeURIComponent( url ), true );

		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				switch( request.status ) {
					case 200:
						stopSpinner();
						if ( typeof done === 'function' ) {
							done( request.responseText );
						}
						return request.responseText;

					default:
						stopSpinner();
						if ( typeof err === 'function' ) {
							err( e.currentTarget.responseText );
						} else {
							alert( 'Unexpected server request status: ' + request.status );
						}
				}
			}
		};
		request.send();
	}

	// write string into asset file
	function uploadString( fileName, str, done, err ) {
		var request = new XMLHttpRequest();
		request.open( "POST", "/wac-wapi/asset/strtoasset/" + encodeURIComponent( fileName ), true );

		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {
					if ( typeof done === 'function' ) {
						done( file, request.responseText );
					}
					return request.responseText;;
				} else {
					if ( typeof err === 'function' ) {
						err( file + ': ' + request.responseText );
					} else {
						errorResponse( request.responseText );
					}
					return null;
				}
			}
		};
		request.send( str );
	}

	// get the text of an asset as a string
	// only use this for tiny files (.mil)
	function getAssetText( file, done, err ) {
		var request = new XMLHttpRequest();
		request.open( "GET", '/wac-wapi/asset/textfile/' + encodeURIComponent( file ), true );
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {
					if ( typeof done === 'function' ) {
						done( request.responseText );
					}
					return request.responseText;
				} else {
					errorResponse( request.responseText );
				}
			}
		};
		request.send();
	}

	function generateAppId( name, desc, handler ) {
		var request = new XMLHttpRequest();
		request.open( "GET", '/wac-wapi/app/genid/' + encodeURIComponent( name ) + '/' + encodeURIComponent( desc ), true );
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {
					if ( typeof done === 'function' ) {
						handler( request.responseText );
					}
					return request.responseText;
				} else {
					errorResponse( request.responseText );
				}
			}
		};
		request.send();
	}

	// convert existing .pdf (??) asset into html
	function convert( file, done ) {
		startSpinner();
		var request = new XMLHttpRequest();
		request.open( "GET", "/wac-wapi/asset/convert/" + encodeURIComponent( file ), true );

		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {
					stopSpinner();
					if ( typeof done === 'function' ) {
						done( request.responseText );
					}
					return request.responseText;
				} else {
					stopSpinner();
					errorResponse( request.responseText );
				}
			}
		};
		request.send();
	}


	function WACInit( finisher, events, eventHandler ) {
		var SESSIONSTOREERR = null;

		if ( typeof finisher !== 'function' ) {
			showError( 'Finisher must be a function' );
		}
		if ( eventHandler !== null && typeof eventHandler !== 'function' ) {
			showError( 'EventHandler must be a function' );
		}
		if ( typeof win === 'undefined' ) {
			showError( 'Requires a browser window' );
		}

		function complete( mess ) {
			try {
				eventService = WSApi( {
					'service' : 'events',
					'target' : '*',
					'jwt' : getJWT(),
					'callback' : function() {
									try {
										finisher();
										stopSpinner(); // otherwise stopped by showError
									} catch( e ) {
										showError( e );
									}
								},
					'events' : events,
					'messageHandler' : eventHandler,
					'errorHandler' : function( e ) {
										showError( e );
									}
				} );
			} catch ( e ) {
				showError( e );
			}
		}

		// test usability of sessionStorage, and clean up from
		// previous runs if it's available.  if it's not, reset the
		// relevant functions to emit a user visible message if they
		// are encountered in code.  this way we can use it if available
		// and it's not a showstopper if code you're running doesn't
		// need it; otherwise don't just silently fail.
		// this is all needed since firefox treats the sessionStorage as a
		// cookie, and if user has 'prompt me for cookie setting' on, and
		// they accept, it will continue to work while if they deny there
		// will be a failure.
		// similarly, in chrome we want to allow user to prohibit all third
		// party data setting and still work.
		try {
			if ( typeof sessionStorage !== 'undefined' ) {
				set( 'x', 'y' );
				if ( get( 'x' ) !== 'y' ) {
					SESSIONSTOREERR = 'Did not get expected value from sessionStorage';
				}

			} else {
				SESSIONSTOREERR = 'sessionStorage not supported';
			}
		} catch ( e ) {
			SESSIONSTOREERR = 'sessionStorage failed: ' + e;
		} finally {
			try {
				if ( SESSIONSTOREERR !== null ) {
					disableSessionStorageUse( 'sessionStorage not supported on platform: ' + SESSIONSTOREERR );
				} else {
					rem( 'x' );
				}
			} catch ( e ) {}
		}

		try {

			if ( typeof Ozone === 'object' && Ozone.util.isRunningInOWF() ) {

				function onSuccess( cfg ) {
					// if we're running under OWF, all items are set
					// by owf (and passed/accessed as cookies) at login, so don't need setting
					setUser( cfg.currentUserName );
					complete( 'succeeded' );
				}
				function onFailure( error, status ) {
					if ( e !== 'undefined' && typeof e === 'Error' ) {
						e = e.message;
					}
					if ( e !== 'undefined' && typeof e === 'Object' ) {
						e = JSON.stringify( e );
					}
					showError( e + ' status: ' + status );
				}

				Ozone.pref.PrefServer.getCurrentUser( {onSuccess:onSuccess, onFailure:onFailure} );

			} else if ( getJWT() === null || getUser() === null || getChID() === null ) {
				var username = prompt( "Enter username: ", "" );
				var password = prompt( "Enter password: ", "" );
				var chId = prompt( "Enter channel id: ", "-1" );

				var request = new XMLHttpRequest();
				request.open("GET", "/wac-wapi/user/init/" + encodeURIComponent( username ) + "/" + encodeURIComponent( password ) + "/" + chId, true);
				request.onreadystatechange = function(e) {
					if ( request.readyState === 4 ) {
						if ( request.status === 200 ) {
							var udetails = JSON.parse( request.responseText );
							setUser( udetails.userName );  // should match the sent 'username'
							setJWT( udetails.jwt );
							setChID( chId );

							complete( 'Login "' + username + '" succeeded' );
						} else {
							complete( 'Login failed, expected User details and got: ' + request.statusText );
						}
					} // else, just ignore as the request is not "ready" yet
				};
				request.send();
			} else {
				complete( username + ' is already logged in.' );
			}

		} catch ( e ) {
			complete( 'failed: ' + e );
		}

		return;
	}

	win.oncontextmenu = function() { return false; };

	return {
		WACInit : WACInit,
		// WAC_SESSION
		setAppId: setAppId,
		getAppId: getAppId,
		generateAppId: generateAppId,
		getChID: getChID,

		getUser: getUser,

		getJWT: getJWT,
		deleteJWT: deleteJWT,

		createCookie: createCookie,
		initApp : initApp,
		initSubApp: initSubApp,
		sendEventNotice: sendEventNotice,
		showFatalError: showError,
		message : message,
		startSpinner: startSpinner,
		stopSpinner: stopSpinner,
		uploadFile: uploadFile,
		uploadString: uploadString,
		getAssetText: getAssetText,
		fetchResource: fetchResource,
		convert: convert,

		// session storage stuff
		set : set,
		rem : rem,
		get : get,

		evts : EVENTS,
		publishEvent : publishEvent,

		FILEADD: FILEADD,
		FILEREMOVE: FILEREMOVE,
		FILECHANGE: FILECHANGE,
		FILEFETCH: FILEFETCH,
		LOCKDOC: LOCKDOC,
		UNLOCKDOC: UNLOCKDOC,
		LOGIN: LOGIN,
		LOGOUT: LOGOUT,
		FORMUPLOAD: FORMUPLOAD,
		FORMSHARE: FORMSHARE,
		SLIDESHOWPUBLISH: SLIDESHOWPUBLISH,
		PICTURESHARE: PICTURESHARE,
		GIS: GIS,
		STATESAVE: STATESAVE,
		STATESET: STATESET,
		STICKY: STICKY
	};


})(window);

/*
 * Snapshotting a users' collection of apps
 * Timed copies the current head into a new snapshot (TimedApi.snapshot), including all collab mutators.
 * At completion, Timed sends a message to all of users apps (WAC.wst.sendSave/STATESAVE) (snapshotid).
 * Each app responds to the STATESAVE event by updating itself in that snapshot copy (WAC.wst.update)
 * AppApi.updatestate (app's state, wuid, desc) (desc is sent in case the snapshot does not yet have
 * a copy of the app, in which case we need desc to keep as the instance discriminator data piece).
 *
 *
 */

WAC.wst = (function(win) {

	// if the app id is the current, unambiguous app no need to pass the app id in
	// (e.g. gets the state of *this* app)
	function getMessages( handler, appId, async ) {
		if ( typeof appId === 'undefined' ) {
			appId = WAC.sys.getAppId();
			if ( appId === 'undefined' || appId === null || appId === '' ) {
				WAC.sys.showFatalError( 'WAC.sys.getMessages: app must be initialized or pass in valid appId' );
			}
		}
		if ( typeof handler !== 'function' ) {
			WAC.sys.showFatalError( 'Need function to handle app state' );
		}
		if ( typeof async === 'undefined' ) {
			async = true;
		}

		var request = new XMLHttpRequest();
		request.open( "GET", "/wac-wapi/app/getmessages/" + encodeURIComponent( appId ), async );
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ) {
					handler( request.responseText );
				} else {
					WAC.sys.showFatalError( request );
				}
			}
		};
		request.send();
	}

	// first get the collabapp state and apply it to the app (if any) (static handler)
	// then get collabapp messages and apply those over the state (message handler)
	function getCombo( staticHandler, messageHandler, appId, finish ) {
		if ( typeof appId === 'undefined' ) {
			appId = WAC.sys.getAppId();
		}

		var request = new XMLHttpRequest();
		request.open("GET", "/wac-wapi/app/getstaticstate/" + encodeURIComponent( appId ), true);
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ||  request.status === 204 ) {  // OK or NO_CONTENT
						staticHandler( request.responseText );
						getMessages( messageHandler, appId );
						if ( typeof finish === 'function' ) {
							finish();
						}
				} else {
					WAC.sys.showFatalError( request );
				}
			}
		};
		request.send();
	}

	function getAppHead( handler, appId  ) {
		if ( typeof appId === 'undefined' ) {
			appId = WAC.sys.getAppId();
		}

		var request = new XMLHttpRequest();
		request.open("GET", "/wac-wapi/timed/getapphead/" + encodeURIComponent( appId ), true);
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status === 200 ||  request.status === 204 ) {  // OK or NO_CONTENT
						handler( request.responseText );
				} else {
					WAC.sys.showFatalError( request );
				}
			}
		};
		request.send();
	}

	function clear( appId ) {
		var request = new XMLHttpRequest();
		if ( typeof appId === 'undefined' ) {
			appId = WAC.sys.getAppId();
		}
		request.open("GET", "/wac-wapi/app/clearstate/" + appId, true );
		request.onreadystatechange = function(e) {
			if ( request.readyState === 4 ) {
				if ( request.status !== 200 ) {
					WAC.sys.showFatalError( 'Problem clearing state: ' + JSON.stringify( e ) );
				}
			}
		};
		request.send();
	}

	// standardize message formats for easier state condensing
	function message( chan, opcode, data, who ) {
		chan.publish( {
			'op' : opcode,
			'data' : data,
			'who' : who
		});
	}

	// send command string event to all of this users' apps
	function sendSave( snapId ) {
		var request = new XMLHttpRequest();
		// build string here to reduce knowledge of server
		var msg = {
				op: WAC.sys.STATESAVE,
				user: WAC.sys.getUser(),
				data: snapId
		};

		request.open("GET", "/wac-wapi/event/allmine/" + encodeURIComponent( JSON.stringify( msg ) ), true);
		request.send();
	}

	// send command string event to all of the active apps and users.
	// First, this initializes the "head" snapshot in WACSession to the given state.
	// Second, send an event to all apps to cause them to take (that) head state.
	// receivers are expected to set their app state to the current "Head" snapshot
	function sendSet( snapId ) {
		var request = new XMLHttpRequest();
		// build string here to reduce knowledge of server
		var msg = {
				op: WAC.sys.STATESET,
				user: WAC.sys.getUser(),
				data: snapId
		};

		// should there be a flag/switch to make it a 'public' replay v.s. a private review/setstate

		request.open("GET", "/wac-wapi/event/all/" + encodeURIComponent( JSON.stringify( msg ) ), true);
		request.send();
	}

	/*
	 * Collaborative app expects that the "server resident" state has already been saved.  If desc is undef
	 * or null, then that app class has not been 'instantiated' with any content so don't update it.
	 *
	 * 1) Find that app in the live collabapp data
	 * 2) Push state into the app
	 * 3) Condense the messages since the pushed state has already been mutated by the messages/commands
	 *    (includes clearing the message list)
	 * 4) Overwrite the existing snapshot (persisted/database) app with the new state string and removes
	 *    any messages since they are superceded by the state string
	 *
	 * 'instance' will be null for those apps not characterized by 'instance'
	 */

	// 'desc' part is provided as not reverse engineerable from the wuid, and if there is no app entry in the
	// table for this wuid we will have to create it
	function update( snapId, wuid, desc, state ) {
		if ( typeof desc !== 'undefined' && desc !== null ) {
			var request = new XMLHttpRequest();
			request.open( "POST", "/wac-wapi/app/updatestate/" + snapId + "/" + wuid + "/" + desc, true );
			request.onreadystatechange = function(e) {
				if ( request.readyState === 4 ) {
					if ( request.status === 200 ) {
						console.log( request.responseText );
					} else {
						alert( request.responseText );
					}
				}
			};
			request.send( state );
		}
	}

	return {
		getMessages: getMessages,
		getCombo: getCombo,
		getAppHead: getAppHead,
		clear : clear,
		sendSave: sendSave,
		sendSet: sendSet,
		update: update // add/updates apps to a snapshot
	};


})(window);