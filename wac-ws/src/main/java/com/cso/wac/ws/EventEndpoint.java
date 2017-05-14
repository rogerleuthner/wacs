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

package com.cso.wac.ws;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import javax.json.Json;
import javax.json.stream.JsonParser;
import javax.json.stream.JsonParser.Event;
import javax.json.stream.JsonParserFactory;
import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.cso.wac.exc.BadInitializationException;
import com.cso.wac.exc.JWSException;
import com.cso.wac.exc.ProgrammingException;
import com.cso.wac.web.WACSession;

/**
 * Simple event message service and app/app life-cycle manager.  Allow inclusion of types of events
 * that a client is interested in (so they don't get events in which they aren't interested).
 * That means the set of events of interest must be known at subscribe time, and as coded events
 * can't be dynamically added/removed.
 *
 * Initialize the service then:
 <pre>
 	eventService = WSApi( {
		'service' : 'events',
		'target' : WAC.sys.getAppId(),
		'jwt' : WAC.sys.getJWT(),
		'events' : [ 'kke', 'asdf, 'fdas' ],
		'messageHandler' : receiveData,
		'errorHandler' : null
	} );
 </pre>
 *
 * Each app/app opens this, and may send or receive events (or not).  The app chooses which received events
 * it cares about if it will receive any events.
 *
 * Each app/app must open this even if it does not want to receive any events.  This service now tracks the
 * channel users instead of using the EventSource.  This class embodies the life-cycle of a app/app.
 *
 * @author rleuthner
 *
 */

// TODO it might be necessary to include some type of reconnect/disconnect monitoring here as this endpoint
// serves the purpose of app lifecycle management.
// it might be useful to include that functionality into the baseendpoint so that all websocket instances
// get the benefit.

@ServerEndpoint( value="/events" )
public class EventEndpoint extends BaseEndpoint {
	JsonParserFactory factory;

	public EventEndpoint() {
		super();
		factory = Json.createParserFactory(null);
	}

	@Override
	@OnClose
	public void onClose( Session session, CloseReason reason ) {
		super.onClose( session, reason );
		// remove ourselves from channel, this may cause the channel to be deleted if there are no more event listeners
		TargetParms targetParms = (TargetParms)session.getUserProperties().get( TARGET );
		wacSession.removeSession( targetParms.ch, targetParms.user, session, reason.getReasonPhrase().isEmpty() ? "(closed websocket)" : reason.getReasonPhrase() );
	}

	/**
	 * Note that completion of this method is not guaranteed at the point the server gets the
	 * websocket.onopen event, at least in the Wildfly 9 implementation.
	 */
    @SuppressWarnings("finally")
	@Override
	@OnOpen
    public void onOpen( Session session ) throws JWSException {

	    Map<String,List<String>>qm = session.getRequestParameterMap();

    	if ( qm.size() != 3 ) {
    		try {
    			session.close( new CloseReason(CloseReason.CloseCodes.UNEXPECTED_CONDITION, "Expected exactly 3 query string parameters: " + session.getQueryString() ) );
    		} finally {
    			throw new BadInitializationException( "Expected exactly 3 query string parameters: " + session.getQueryString() );
    		}
    	}

    	for( Map.Entry<String, List<String>>entry : qm.entrySet() ) {
    		switch ( entry.getKey() ) {
				case WACSession.EVENTS:
					// authenticate and get/set normal parameters into session
			    	setupSession( session );

			    	TargetParms targetParms = (TargetParms)session.getUserProperties().get( TARGET );
					String es = entry.getValue().get( 0 );

					// only set a list of events if we indeed listen for events; note that
					// this endpoint may listen no events, in which case it is just a surrogate for
					// a app/app.  the app may have _other_ session/endpoints, in which case
					// it is still a 'live' app/app, and since this class does double duty as event
					// propagator and 'live app' surrogate we need to remain alive.
					if ( es.length() > 0 ) {
						// create events as a list for easy matching on the send
				    	session.getUserProperties().put( WACSession.EVENTS, Arrays.asList( es.split( "," ) ) );
					}

			    	// this is now an operable app for this channel/user
					wacSession.addSession( targetParms.ch, targetParms.user, session );

					// signal to receiving ws that this app is completely initialized
					sendReady( session );

			    	return;

			    default: /*noop*/;
    		}
    	}
		try {
			session.close( new CloseReason(CloseReason.CloseCodes.UNEXPECTED_CONDITION, "Didn't find required 'events' argument to EventEndpoint." ) );
		} finally {
			throw new BadInitializationException( "Didn't find required 'events' argument to EventEndpoint." );
		}
    }

	/**
	 * Must override for the EventsEndpoint since for events the message forward-to set depends upon
	 * the message data, and also sends the message using the WACSession object method sendToSubscriber(),
	 * since that functionality is shared by backend event emission (sim bridge + others) and the regular
	 * event generated at the front end and propagated via the WSApi->events web socket interface.
	 *
	 * The required data is message in JSON format with 'events' key containing a target event type.
	 * While not required, ostensibly the event target is one of
	 * com.tf.wac.data.domain.types.Events
	 *
	 * If a app/app's list of subscribed events contains the event target, the event is issued to
	 * that app/app.
	 *
	 * Any channel users' event session gives a handle to the session websocket which can be used to
	 * enumerate all of the other connections to this websocket (within the channel).
	 */

    @Override
	@OnMessage
    public void forwardMessageToChannelApps( String message, Session session ) {

    	final StringReader reader = new StringReader( message );
    	final JsonParser parser = factory.createParser( reader );
    	String eventName = null;
    	final List<Session>sessions = new ArrayList<Session>();
    	// get all active channel apps
    	final TargetParms targetParms = filterSessions( session, sessions );

    	foundEvent: while( parser.hasNext() ) {
    		Event e = parser.next();
    		switch( e ) {
	    		case KEY_NAME:
	    			String key = parser.getString();
	    			if ( key.equals( WACSession.EVENTS ) ) {
	    				parser.next();
	    				eventName = parser.getString();
		    			break foundEvent;  // done here
	    			}
				default:
					break;
    		}
    	}

    	if ( eventName == null ) {
    		throw new BadInitializationException( "Failed to get event name." );
    	}

    	wacSession.sendToSubscribers( eventName, message, sessions );

    	// stow the message
        try {
        	System.out.println( "NEED TO LOG EVENT: " + targetParms.ch + ", " + targetParms.appId + ", " + message );
        	// finish( targetParms.ch, targetParms.user, targetParms.appId, message );
        } catch ( Exception e ) {
        	// TODO
        	System.out.println( "FAILED to complete message sending: " + e.getMessage() );
        }
    }

    /**
     * Filter sessions only for
     * <ul>
     * <li>Channel</li>
     * <li>Session Open</li>
     * <li>Not self</li>
     * </ul>
     * As events are not app-type-specific, since all apps participate in eventing by default.
     * They just might not be subscribed to certain events, which is coded into the forwardMessageToChannelApps
     *
     */
	@Override
	protected TargetParms filterSessions( Session fromSession, List<Session>filteredSessions ) {

		if ( filteredSessions == null ) {
			throw new ProgrammingException( "You must pass in a list object to add to, it's call by reference" );
		}

		TargetParms targetParms = (TargetParms)fromSession.getUserProperties().get( TARGET );
	    for( Session otherSession : fromSession.getOpenSessions() ) {
	    	TargetParms otherTarget = (TargetParms)otherSession.getUserProperties().get( TARGET );

	    	if ( otherTarget == null ) {
	    		throw new ProgrammingException( "Did not find required TargetParms in other open session" );
	    	}

	    	if ( otherTarget.ch.equals( targetParms.ch ) ) {
	    		// if this is an event, it should go to all subscribed channel apps regardless of class
	    		// and subscribers are filtered in the actual send
        		if ( otherSession != fromSession ) {
        			// note there is a slight chance of it closing between checking and handling, so don't rely
        			// upon absolute guarantee of a write
        			if ( otherSession.isOpen() ) {
        				filteredSessions.add( otherSession );
        			}
        		} // else it's originator so don't write
        	} // else, wrong channel, don't write
        }
		return targetParms;
	}

}