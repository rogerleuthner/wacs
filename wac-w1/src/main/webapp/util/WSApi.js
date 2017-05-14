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
 * WSApi - websocket services object factory
 *
 * Two basic functions:
 * <ul>
 * <li>Interface with arbitrary (selectable via config) web socket services.</li>
 * <li>Provide for per-app/app initialization into the eventing system.  Note that this initialization
 * is REQUIRED for all apps/apps, as it performs the basic app/app login/initialization/registration.
 * This initialization functionality is transparently performed as part of the WAC.sys.WACInit() functionality,
 * so is not required to be done manually by app writers.
 * </li>
 * </ul>
 *
 * Link into message share/receive with like 'keyed' entities:
 *
 * Usage:
   <p>
    <pre>

	var config = {
		'service' : 'message',
		'target' : 'passHashApp',  // can be '*' if non-specific app instance
		'jwt' : WAC.sys.getJWT(),
		'events' : [WAC.sys.PICTURESHARE, WAC.sys.LOGON ...],
		'callback' : functionToExecute,  // any post-initialization actions app needs to take
		'messageHandler' : processMessageFunction,
		'errorHandler' : errorFunction
	};

	var wsApi = WSApi( config );
	</pre>
   </p>
 * where processMessage and handleError both accept an "event" argument.
 * <p>
 * then broadcast d:
 * <p>
 * <code>
	wsApi.publish( d );
 * </code>
 * </p>
 * If using angular, both of these can go into a service (naturally singleton).
 *
 * Each instance returned by this function (this WSApi.js is a factory for them) has embedded in it's URL
 * the authorization token, the WUID target, and the ws endpoint.
 * <p>
 * Presence of 'events' array in configuration args switches functionality to that of a context
 * (app or app) event service endpoint.  Such an initialization causes the caller to be set up
 * as an event recipient for the indicated event list.  This initialization is normally performed during
 * the WAC.sys.WACInit( finisher, events[], eventhandler );
 * </p>
 * NOTE that all messages sent on the generic channel (target === '*') are sent to all apps of the same
 * class (all instance apps of that class in addition to the single control/generic instance), which means
 * that when implementing master app that contains subapps (slideshow, viewer, etc.) you will have to
 * explicitly ignore control messages that occur on your subapp channel (unless you want them).
 * This could be simplified by removing that functionality which sends control messages to all instance apps,
 * but that ability is currently exploited by viewer at least.
 *
 * @author Roger Leuthner
 */

function WSApi(conf){

	var websocket;
	// args
	const service = conf.service;
	const target = conf.target;
	const jwt = conf.jwt;
	const events = doEventArgs( conf.events );
	var messageHandler;
	var callback;
	var errorHandler;
	var initialized = false;

	// message handler should be null or undefined if no named events are subscribed to
	if ( typeof conf.messageHandler === 'undefined' || conf.messageHandler === null ) {
		messageHandler = function( e ) {};  // noop
	} else {
		messageHandler = conf.messageHandler;
	}

	if ( typeof conf.errorHandler === 'undefined' || conf.errorHandler === null ) {
		errorHandler = function( e ) {
			WAC.sys.showFatalError( 'Failed to initialize: ' + JSON.stringify( e ) );
		};
	} else {
		errorHandler = conf.errorHandler;
	}

	if ( typeof conf.callback === 'undefined' || conf.callback === null ) {
		callback = function( e ) {}; // noop
	} else {
		callback = conf.callback;
	}

	// no uriencode
	try {
		websocket = new WebSocket( "wss://" + document.location.hostname + ":" + document.location.port
						+ '/wac-ws/' + service
						+ '?target=' + target
						+ '&jws=' + jwt
						+ ( typeof events !== 'undefined' ? events : '' )
					);

		// as soon as the socket is ready, finish up;
		// the onopen here DOES NOT guarantee that the server-side '@OnOpen' is done however,
		// and the callback may well be dependent upon that.  What to do to know for sure that
		// the server side OnOpen is complete?
		websocket.onopen = function( event ) {
		};

		// no translation - caller determines if they expect an object,
		// so caller must parse if that's what's wanted
		websocket.onmessage = function( event ) {
			// TODO "READY" should be shared/otherwise codified other than a magic string hardcoded in BaseEndpoint.java
			// if not initialized, first message must be "READY" so run the initialization callback
			// else there's a failure
			if ( !initialized ) {
				if ( event.data === "READY" ) {
					callback(); // note init callback must succeed
					initialized = true;
				} else {
					errorHandler( event.data );
				}
			} else {
				messageHandler( event.data );
			}
		};

		websocket.onerror = function( event ) {
			errorHandler( event.data );
		};

	} catch( ex ) {
		WAC.sys.showFatalError( 'Failed to build websocket: ' + service + ':' + target + ':' + JSON.stringify( ex ) );
	}

	function publish( data ) {
		if ( typeof data !== 'string' ) {
			data = JSON.stringify( data );
		}
		switch( websocket.readyState ) {
			case WebSocket.OPEN:
				websocket.send( data );
				break;
			case WebSocket.CONNECTING:
				WAC.sys.showFatalError( 'WebSocket CONNECTING, failed send message' );
				break;
			default:
				WAC.sys.showFatalError( 'WebSocket closing or closed, failed send message, state: ' + websocket.readyState );
		}
	}


	// translate string or array of event names into URL string query args
	function doEventArgs( u ) {
		var e = undefined;
		if ( typeof u !== 'undefined' ) {
			e = '&events=';
			if ( Array.isArray( u ) ) {
				var len = u.length;
				for( var i = 0; i < len; i++ ) {
					// space separate if more than one
					if ( i > 0 ) {
						e += ',';
					}
					e += u[i];
				}
			} else {
				e += u;
			}
		}
		return e;
	}

	function close() {
		typeof websocket !== 'undefined' && websocket.close();
	}

	return {
		publish: publish,
		close: close
	};

}

