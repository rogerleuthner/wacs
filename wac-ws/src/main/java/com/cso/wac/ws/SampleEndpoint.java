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

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.cso.wac.JWTData;
import com.cso.wac.JWTService;
import com.cso.wac.exc.JWSException;

@Stateless // required (!) to get EJB injection working
@ServerEndpoint("/hello")
//@Interceptors(Log.class)
public class SampleEndpoint {
    
	@EJB
	private JWTService jwtService;
	
	public SampleEndpoint() {
	}
	
    @OnMessage
    public void hello( String message, Session session ) {
        System.out.println("Received : "+ message);
                
        for( Session others : session.getOpenSessions() ) {
        	
        	if ( others.getUserProperties().get( "ch" ) == session.getUserProperties().get( "ch" ) ) {
        		if ( others != session ) {
        			others.getAsyncRemote().sendText( "time: " + System.currentTimeMillis() );
        		}
        	}
        }
    }
    
    @OnOpen
    public void myOnOpen(Session session) throws JWSException {
        System.out.println("Wildfly WebSocket opened: " + session.getId());

        JWTData d = jwtService.verifyJwGetData( session.getQueryString() );
        
        session.getUserProperties().put( "user", d.getUserId() );
        session.getUserProperties().put( "ch", d.getChId() );
    }
    @OnClose
    public void myOnClose(Session session, CloseReason reason) {
    	// since we don't have the id of the session, reaping has to remove it from the tracker; if we knew the id
    	// of the session would could delete it directly from WACsession right now
        System.out.println("Closing a WebSocket due to " +( reason != null ? reason.getReasonPhrase() : " connection broken, null response" ) );
    }
}

//class Log {
//	@AroundInvoke
//	public Object manageTransaction( InvocationContext ctx ) throws Exception {
//		System.out.println( "allowing transaction to proceed" );
//		return ctx.proceed();
//	}
//}

// example from: http://mgreau.com/posts/2013/11/11/javaee7-websocket-angularjs-wildfly.html

// 'wamp' is a candidate 'subprotocol'

// shows how to handle multiple simultaneous matches (here, the "match" will be the channel)

// @ServerEndpoint( value = "/matches/{match-id}",   decoders = { MessageDecoder.class },  encoders = { MatchMessageEncoder.class, BetMessageEncoder.class }

/*

        public static void send(MatchMessage msg, String matchId) {
          try {
            // Send updates to all open WebSocket sessions for this match 
            for (Session session : queue) {
              if (Boolean.TRUE.equals(session.getUserProperties().get(matchId))){
                if (session.isOpen()){
                      session.getBasicRemote().sendObject(msg);        
                }
              }
            }
          } catch (IOException | EncodeException e) {
            logger.log(Level.INFO, e.toString());
          }
        }

*/

/*
 * public class MatchMessageEncoder implements Encoder.Text<MatchMessage> {

        @Override
        public String encode(MatchMessage m) throws EncodeException {
                StringWriter swriter = new StringWriter();
                try (JsonWriter jsonWrite = Json.createWriter(swriter)) {
                        JsonObjectBuilder builder = Json.createObjectBuilder();
                        builder.add(
                                "match",
                                Json.createObjectBuilder()
                                        .add("serve", m.getMatch().getServe())
                                        .add("title", m.getMatch().getTitle())
                                        ...
                        }

                        jsonWrite.writeObject(builder.build());
                }
                return swriter.toString();
        }
}
 */
