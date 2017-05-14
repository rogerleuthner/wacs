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

package com.tf.wac.ws;

import java.util.List;
import java.util.Map;
import java.util.concurrent.Future;

import javax.inject.Inject;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

import com.tf.wac.JWTService;
import com.tf.wac.exc.BadInitializationException;
import com.tf.wac.exc.JWSException;
///// THIS DOES NOT WORK AS EXPECTED; NO SEGREGATION IS PERFORMED RE VARIABLE PARAMETERS
// path parameters only serve to segregate endpoint users into channels/wuid sets; they aren't used herein
@ServerEndpoint( value="/message/{chId}/{wuid}" )
public class GenericEndpoint {

	// this is also known by the NWSApi.js
	private static final String JWS = "jws";

	@Inject
	private JWTService jwtService;

	public GenericEndpoint() {
	}

	protected Future<Void>send( String message, Session toSession ) {
		return toSession.getAsyncRemote().sendText( message );
	}
	/**
	 * Authenticate the session
	 *
	 * @param jwt
	 * @param wuid
	 * @param session
	 * @throws JWSException
	 */
    @OnOpen
    public void onOpen( @PathParam("chId") Long chId, @PathParam( "wuid" ) String wuid, Session session ) throws JWSException {

        // since the jwt is unique for each client, can't use it as a pathparam (or there would only be a single client per service).
    	// we need to have the jwt in here to do authentication.
        // although the jwt carries the ch information, we use it in the URI path along with the wuid to force automatic grouping
        // into channel/wuid groups (otherwise filtering would have to be manual, as all sessions would show up at 'getSessions()')

        // so passing in the chId in the URI is slightly redundant, but it does our channel-level filtering for us (in addition to wuid filtering)
    	// we then proceed to ignore the chId in this code, as the filtering task of the chId is already done

    	System.out.println( "CHAN: " + chId + ", wuid: " + wuid );

    	Map<String,List<String>>qm = session.getRequestParameterMap();

    	if ( qm.size() != 1 ) {
    		throw new BadInitializationException( "Expected exactly 1 query string parameter (jwt): " + session.getQueryString() );
    	}

    	List<String>entry = qm.get( JWS );

    	if ( entry == null || entry.size() != 1 ) {
    		throw new BadInitializationException( "Expected exactly 1 query string parameter (jwt): " + session.getQueryString() );
    	}

    	jwtService.verifyJwGetData( entry.get( 0 ) );
		System.out.println( "ME: " + session.getId() );
    	for( Session otherSession : session.getOpenSessions() ) {
    		System.out.println( "OTHERSESSION: " + otherSession.getId() );
    	}
    }

    @OnMessage
    public void forwardMessage( String message, Session session ) {
    	// sessions are already filtered on pathparams for the service, so we are segregated from other channels/widgets

    	for( Session otherSession : session.getOpenSessions() ) {
    		// filter out ourselves
    		if ( ! session.equals( otherSession ) ) {
    			send( message, otherSession );
    		}
    	}
    }
}

