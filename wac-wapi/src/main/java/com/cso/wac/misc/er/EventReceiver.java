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

package com.cso.wac.misc.er;

import java.io.IOException;

import javax.servlet.AsyncContext;
import javax.servlet.AsyncEvent;
import javax.servlet.AsyncListener;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

/**
 * Base for setting up up an async context and registering that context with the WACSessions.
 * Each app that wants to receive any events, including ping/keepalives, needs to have this
 * servlet set as the event source listener in the page startup, e.g.:
		var source = new EventSource( '/wac-wapi/EventReceiver?wac_session=' + chId + '&wac_user=' + userId );
		source.addEventListener( 'ping', function( e ) {
			console.log( 'ping received' + e.data );
		});
 *
 * This servlet is designed to be invoked once per CCI init, corresponding to initialization
 * of the javascript program associated with the web page, and since it depends upon the userid/chid
 * should be invoked subsequent to the owf init.
 *
 * It sets up a context with no timeout that shuts itself down if it detects that the front end is no longer in
 * communication with it.  The server then periodically "pings" the front end by writing to the response associated
 * with the context; if the write fails we assume that context is dead.
 *
 * This creates a framework by which the active async contexts can be tracked as "sessions".
 *
 * @author rleuthner
 */


/*
 * This servlet corresponds to a single 'CCI' unit for a user, whereby apps in a CCI may communicate
 * using inter-app comms.
 *
 * A user may have several concurrent CCI's.  E.g. FF/OWF console in one window; several tabs each w/ standalone app
 * in chrome - each browser brand would consitute a CCI.  Another example is the user running aa mobile app
 * on the same channel concurrently (a third CCI).  The whole set of CCI's is refered to as a "CC".
 *
 * A Channel is modeled by a structure contained in the WACSession object keyed with the chId.
 * That channel contains a structure that describes the 'shared state'.
 *
 * Participants in a channel may push their 'state' into that shared state (given permission).
 * The shared state from that channel may be saved into the database upon request.
 *
 * Therefore, individual users maintain the state of their apps (in the apps themselves, and also
 * possibly in session or local storage).  The app state of a client is a composition of real-time
 * (e.g. websocket-synchronized apps), static apps and apps that are synchronized through
 * receipt of channel events.
 *
 * Eventually it might be useful to allow users to save their local state directly into the database
 * (w/o going through the channel shared state).
 *
 * A user can do replay by fetching a 'window' of states into local storage, then moving a slider through
 * to signal the apps to load the app-specific state.
 *
 * Channel data is protected (e.g. if you ask for a particpant list for a channel for which you do
 * not have adminstrative role returns no data as the queries do a join of chId with the roles of
 * the requesting user.
 *
 * If the user is not already logged in with another CCI (mobile app, console or standalone app), then
 * a server session is created for the user.
 *
 * In CDI parlance, a sessionStorage is a "conversation" storage, while the localStorage models a JSESSIONID (in the same domain;
 * different domains would have differenct JSESSIONID's since the JSESSIONID is stored at the "root" of a domain.
 *
 * User
 * 	Channel (CI, users picture of channel)
 * 	  C
 *
 * TODO need to finish documentation of the design; perhaps refer to the design document
 *
 *
 * Does a channel need transient data on the server?
 */



@WebServlet(
		name="EventReceiver",
		asyncSupported=true,
		urlPatterns={"/EventReceiver"} )
public class EventReceiver extends BaseEventReceiver {

	private static final long serialVersionUID = 1L;
	// don't timeout; disconnect only if failed to write (client went away)
	static final int CALLBACK_TIMEOUT = 0;

	public EventReceiver() {
	}

	@Override
	public void init() throws ServletException {
	}

	@Override
	public void destroy() {
	}

	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
		super.service( request, response );
		final EventParms eventParms = new EventParms( request );

		try {

			// setup the listener for this client
			final AsyncContext ctx = request.startAsync();
			ctx.setTimeout( CALLBACK_TIMEOUT );
			ctx.addListener( new AsyncListener() {
					@Override
					public void onError( AsyncEvent actx ) throws IOException {
						System.out.println( "Error: remove session" );
						//sessions.removeSession( eventParms.getChId(), actx.getAsyncContext() );
					}
					@Override
					public void onTimeout( AsyncEvent actx ) throws IOException {
						System.out.println( "Timeout: remove session" );
						//sessions.removeSession( eventParms.getChId(), actx.getAsyncContext() );
					}
					@Override
					public void onComplete(AsyncEvent actx) throws IOException {
						System.out.println( "Complete session" );
					}
					@Override
					public void onStartAsync(AsyncEvent actx) throws IOException {
						System.out.println( "Start session" );
					}
				}
			);

			// add this context to the WACSessions
			//sessions.addSession( eventParms.getChId(), eventParms.getUserId(), ctx );

		} catch ( Exception e ) {
			Logger.getLogger( EventReceiver.class ).info( e );
		}
	}

	// TODO move the basic check (user/ch) into the super and/or eliminate entirely
	@Override
	protected void checkParms( EventParms eventParms ) throws ServletException {
		if ( eventParms.getUserId() == null || eventParms.getUserId().isEmpty() ) {
			throw new ServletException( "The SSE eventing mechanism requires user ID" );
		}
	}
}

