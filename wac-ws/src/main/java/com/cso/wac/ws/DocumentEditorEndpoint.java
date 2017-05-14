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

import javax.inject.Inject;
import javax.json.Json;
import javax.json.JsonBuilderFactory;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.JsonString;
import javax.websocket.CloseReason;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.data.domain.types.Events;
import com.cso.wac.data.services.misc.EventNoticeService;
import com.cso.wac.exc.JWSException;

// TODO this BS duplicate code objectbuilder; make a function that transforms a message into json

@ServerEndpoint( value="/documentEditorService" )
public class DocumentEditorEndpoint extends BaseEndpoint {
	@Inject
	private EventNoticeService eventNoticeService;

	JsonBuilderFactory factory;

	public DocumentEditorEndpoint() {
		super();
		factory = Json.createBuilderFactory(null);
	}

    @Override
	public void onOpen(Session session_originator) throws JWSException {
    	setupSession( session_originator );
    	ArrayList<Session> sessions = new ArrayList<Session>();
    	filterSessions( session_originator, sessions );
    	session_originator.getUserProperties().put( "owns_lock", new Boolean( false ) );
    	sendReady( session_originator );

    	// if there's an existing lock holder, respect that by sending message to myself
        for( Session session: sessions) {
			if ( (Boolean)session.getUserProperties().get( "owns_lock" ) ) {
		    	JsonObjectBuilder job =factory.createObjectBuilder();
		        job = job.add("op", "lock").add("who", getParms( session ).user );//.add("data", "");
		        JsonObject jobj = job.build();
		        session_originator.getAsyncRemote().sendText( jobj.toString() );
				break; // if there's more than 1, is a bug
			}
        }
    }


    @Override
    public void forwardMessageToChannelApps( String message, Session session_originator )
    {
    	JsonReader jsonReader = Json.createReader(new StringReader(message));
    	JsonObject object = jsonReader.readObject();
    	jsonReader.close();
    	String cmd_name = ((JsonString)object.get("op")).getString();
    	String user_name_of_lock_owner = null;
    	if(cmd_name.equals("lock"))
		{
	    	ArrayList<Session> sessions = new ArrayList<Session>();
	    	filterSessions( session_originator, sessions );
	    	boolean enabled = true;
	        for( Session session: sessions)
	        {
	    			if( (Boolean)session.getUserProperties().get("owns_lock") )
	    			{
	    				enabled = false;
	    				user_name_of_lock_owner = BaseEndpoint.getParms( session ).user;
	    				break;
	    			}
	        }
			if(enabled)
			{
		    	session_originator.getUserProperties().put( "owns_lock", new Boolean( true ) );
		    	JsonObjectBuilder job =factory.createObjectBuilder();
		        job = job.add("op", "locked").add("who", "").add("data", "");
		        JsonObject jobj = job.build();
		        String msg = jobj.toString();
		        session_originator.getAsyncRemote().sendText( msg );
		    	super.forwardMessageToChannelApps(message, session_originator);
			}
			else
			{
		    	JsonObjectBuilder job =factory.createObjectBuilder();
		        job = job.add("op", "lock").add("who", user_name_of_lock_owner).add("data", "");
		        JsonObject jobj = job.build();
		        String msg = jobj.toString();
		        session_originator.getAsyncRemote().sendText( msg );
			}

	    	eventNoticeService.createNotice("document locked", Events.DOC_LOCKED.getEvent(), EventSeverity.NORMAL,
	    			BaseEndpoint.getParms( session_originator ).ch, BaseEndpoint.getParms( session_originator ).user );
		}
		else if(cmd_name.equals("unlock"))
		{
	    	eventNoticeService.createNotice("document unlocked", Events.DOC_UNLOCKED.getEvent(), EventSeverity.NORMAL,
	    			BaseEndpoint.getParms( session_originator ).ch, BaseEndpoint.getParms( session_originator ).user );

	    	session_originator.getUserProperties().put( "owns_lock", new Boolean( false ) );
	    	super.forwardMessageToChannelApps(message, session_originator);
		}
		else
		{
	    	super.forwardMessageToChannelApps(message, session_originator);
		}
    }

    @Override
	public void onClose(Session session_originator, CloseReason reason) {
		if ( (Boolean)session_originator.getUserProperties().get("owns_lock") ) {
			forwardMessageToChannelApps( "{\"op\":\"unlock\"}", session_originator );
		}
    }
}




