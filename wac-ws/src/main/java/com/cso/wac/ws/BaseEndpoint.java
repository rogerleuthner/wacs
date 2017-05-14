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

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;
import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;

import com.cso.wac.JWTData;
import com.cso.wac.JWTService;
import com.cso.wac.exc.BadInitializationException;
import com.cso.wac.exc.JWSException;
import com.cso.wac.exc.ProgrammingException;
import com.cso.wac.web.WACSession;
import com.cso.wac.web.AppUtil;

/**
 * A base implementation for passing string messages without any translation/coercion.
 * It links service into the WAC authorization and channel bookkeeping.
 * Sends messages to only those sessions with matching channel/user/target.
 *
 * PERFORMS JWT AUTHENTICATION ON OPEN.  If creating an endpoint that cannot extend
 * this class or that overrides the 'OnOpen', AUTHENTICATION MUST BE MANUALLY PERFORMED
 * in that endpoint.
 *
 * It also links into the WACSession data structure so that each websocket message
 * may be recorded in the 'transient channel state' so that playback and/or refresh
 * of current particpants may be set to the current shared state, and new participants
 * may be brought to the current shared state (for ex annotations on a slide, slide
 * number, etc.).
 *
 * @author rleuthner
 *
 */

public abstract class BaseEndpoint {

	// keys into query string and session properties
	// query string parameter keys; note that these are hardcoded in the front end as well!!
	// TODO config and retrieve from same source for front and backend
	// qs parm for jwt
	protected static final String JWS = "jws";
	// qs parm for target service, and also key into session properties for target parameters data structure
	protected static final String TARGET = "target";
	// magic string used to signal WSApi that we're done processing; merely using 'onopen' does not ensure required processing is finished
	// so we send a message when done.
	protected static final String READY = "READY";

	@Inject
	private JWTService jwtService;

	@Inject
	protected WACSession wacSession;

	protected BaseEndpoint() {
	}

	/**
	 * Invoked after all messages have been asynchronously sent off; does not know whether the messages were successful or not.
	 *
	 * @param ch
	 * @param originatingUser
	 * @param target
	 * @param message
	 */
	protected void finish( Long ch, String wuid, String message ) {
		wacSession.addAppMessage( ch, wuid, message );
	}

	protected static final TargetParms getParms( Session session ) {
		return (TargetParms)session.getUserProperties().get( TARGET );
	}

	/**
	 * Filter sessions from all open sessions known by this endpoint by the properties defined within the from session.
	 * Note this DOES NOT return itself, so the actual sessions are returned sessions + starting (from) session.
	 *
	 * Note that the session list may have changed between getting it and doing with it what you need, so expect
	 * sessions may exist that you don't know about, or sessions that are in the list that become dead before you
	 * do what you need with them.
	 * <p>
	 * FILTERING LOGIC WITH RESPECT EVENTS, APP ID's and ID's containing wildcards
	 * <ul>
	 * <li>Never return ourselves (we don't send events to ourself, presumably we already know about our own event).</li>
	 * <li>if the whole generated id matches OR if the app name matches AND the SENDER desc is wildcard, get the app.
	 * This allows one instance of a 'class' of apps to send messages to every other instance of that class, even through
	 * the generated id of the instances may be different.  (this means that for example the 'default' viewer app sends
	 * messages to every instance of viewer through what amounts to broadcast to all viewer instances).  This a</li>
	 * </ul>
	 * </p>
	 * <p>
	 * An important point is that apps of the same class (e.g. viewer) sometimes need to send messages to all other
	 * instances of that class (e.g. viewer apps with a different picture); for example when a new picture is dropped
	 * into a viewer ALL viewer instances need to be told that so they may query the user if they want to remain at their
	 * current picture or switch to the new one.
	 * </p>
	 * @param fromSession - session which contains the defining filter properties
	 * @param filteredSessions - pass in an empty list (by reference) to contain the output (filtered) list
	 *
	 * @return
	 */
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

        	if ( otherTarget.ch.equals(targetParms.ch) ) {
        		// if the whole steenkin id matches OR if the app name matches AND the SENDER desc is wildcard ...
        		// (this means that for example the 'default' viewer app sends messages to every instance of viewer)
        		if ( ( otherTarget.appId.equals( targetParms.appId ) ) ||
	    				( AppUtil.getAppName( otherTarget.appId ).equals( AppUtil.getAppName( targetParms.appId ) )
	    				&& AppUtil.getAppUID( targetParms.appId ).equals( AppUtil.PADDED_WILDCARD ) ) ) {

	        		if ( otherSession != fromSession ) {
	        			// note there is a slight chance of it closing between checking and handling, so don't rely
	        			// upon absolute guarantee of a write
	        			if ( otherSession.isOpen() ) {
	        				filteredSessions.add( otherSession );
	        			}
	        		} // else it's originator so don't write
        		} // else, not the right app id/type
        	} // else, wrong channel, don't write
        }
		return targetParms;
	}

	/**
	 * Forward message only to the proper channel/target/open sessions.
	 *
	 * Each endpoint serves all channels and all instances of an endpoint; this message forwarder filters upon
	 * 1) channel, 2) app id and/or app name + desc (class + instance) 3) against original issuer of message
	 *
	 * @param message
	 * @param session
	 */
    @OnMessage
    public void forwardMessageToChannelApps( String message, Session session ) {

    	List<Session>sessions = new ArrayList<Session>();
    	TargetParms targetParms = filterSessions( session, sessions );

    	for( Session otherSession : sessions ) {
    		if ( otherSession.isOpen() ) {
    			try {
    				otherSession.getAsyncRemote().sendText( message );

    			} catch ( Exception e ) {
    				// log? error?
    				// TODO
    	        	System.out.println( "FAILED to complete message sending: " + e.getMessage() );
    			}
    		}
    	}

        finish( targetParms.ch, targetParms.appId, message );
    }

    /**
     * Pick out query properties that allow us to target these events to only specific channel/apps.
     * Send ready message.
     *
     * @param session
     * @throws IllegalArgumentException
     * @throws JWSException
     */
    @OnOpen
    public void onOpen( Session session ) throws JWSException {
    	setupSession( session );
    	sendReady( session );
    }

    /*
     * Send websocket ready message after all your internal processing is completed.
     */
    protected void sendReady( Session session ) {
		try {
			session.getBasicRemote().sendText( READY );
		} catch (IOException e) {
			throw new BadInitializationException( "Failed to notify client of ready." );
		}
    }

    /*
     * Do fundamental session setup (consists of handling JWT validation and then session data setup)
     */
    protected void setupSession( Session session ) throws JWSException {
    	Map<String,List<String>>qm = session.getRequestParameterMap();
    	TargetParms targetParms = new TargetParms();

    	for( Map.Entry<String, List<String>>entry : qm.entrySet() ) {
    		switch ( entry.getKey() ) {
    			case JWS:
        	        JWTData data = jwtService.verifyJwGetData( entry.getValue().get( 0 ) );
        	        targetParms.user = data.getUserId();
        	        targetParms.ch = data.getChId();
    				break;
    			case TARGET:
	    			targetParms.appId = entry.getValue().get( 0 );
    				break;
    		}
    	}
		session.getUserProperties().put( TARGET, targetParms );
    }

    @OnError
    public void onError( Session session, Throwable error ) {
    	try {
    		if ( session.isOpen() ) {
    			session.getBasicRemote().sendText( error != null ? error.getMessage() : "(error is null)" );
    		}
		} catch (IOException e) {
			// error sending errror.
			// TODO need mechanism for dealing here; maybe email or other system-wide out-of-band signal?
			System.out.println( "BaseEndPoint error handling FAILED: " + e.getMessage() );
		}
    }

    @OnClose
    public void onClose( Session session, CloseReason reason ) {

    }

    // package session parameters for placing into the client session's properties when a new client connects
    final class TargetParms {
    	public String user;
    	public Long ch;
    	public String appId;  // appname/UID combo
    }
}
