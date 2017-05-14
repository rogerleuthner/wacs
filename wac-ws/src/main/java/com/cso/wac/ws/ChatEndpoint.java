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

import java.util.ArrayList;

import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonBuilderFactory;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.websocket.CloseReason;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.cso.wac.exc.JWSException;

/**
 * Chat endpoint
 *
 * @author ggershanok
 *
 */

@ServerEndpoint( value="/chatService" )
public class ChatEndpoint extends BaseEndpoint {

	JsonBuilderFactory factory;
	public ChatEndpoint() {
		super();
		factory = Json.createBuilderFactory(null);
	}

    @Override
	public void onOpen(Session session_originator) throws JWSException {
    	setupSession( session_originator );
    	ArrayList<Session> sessions = new ArrayList<Session>();
    	filterSessions( session_originator, sessions );
    	JsonObjectBuilder job =factory.createObjectBuilder();
        job = job.add("name", "register").add("data", "");
        JsonArrayBuilder arr_builder = Json.createArrayBuilder();

        for( Session session: sessions){
    			arr_builder.add(getParms( session ).user);
        }
        job.add("username",  arr_builder);
        JsonObject jobj = job.build();
        sendReady( session_originator );
        session_originator.getAsyncRemote().sendText( jobj.toString() );
    }

    @Override
	public void onClose(Session session_originator, CloseReason reason) {
    	JsonObjectBuilder job =factory.createObjectBuilder();
    	job = job.add("name", "unregister").add("username", BaseEndpoint.getParms( session_originator ).user).add("data", "");
    	JsonObject jobj = job.build();
    	forwardMessageToChannelApps( jobj.toString(), session_originator );
    }
}

