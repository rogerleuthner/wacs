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

import javax.servlet.ServletException;
import javax.servlet.annotation.WebInitParam;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Expose eventing to outside world - no authenticated web session is required.
 * Certain services may be accessed without authentication (blind, vetted uploads for ex),
 * other services require authentication information to be provided in the URL
 *
 * Recieve an httpservletrequest and inititate an SSE to all active clients from it
 *
 * Use from javascript to publish SSE's
 *
 * @author rleuthner
 *
 */

@WebServlet( name="EventInitiator",
	urlPatterns={ "/EventInitiator" },
	asyncSupported=true,
	initParams={
		@WebInitParam( name = "threadpoolsize", value="10" )
	}
)
public class EventInitiator extends BaseEventReceiver {

	private static final long serialVersionUID = 1L;

	public EventInitiator() {}

	@Override
	public void init() throws ServletException {
		super.init();
	}

	@Override
	public void destroy() {
		super.destroy();
	}

	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
		super.service(request, response);
		final EventParms eventParms = new EventParms( request );
		try {
//			sessions.sendEventMessage( eventParms.getEvent(), eventParms.getRawJson(), eventParms.getChId() );
		} catch (Exception e) {
			throw new ServletException( e.getMessage() );
		}
	}

	@Override
	protected void checkParms( EventParms eventParms ) throws ServletException {
		if  ( eventParms.getUserId() == null || eventParms.getUserId().isEmpty() ||
				eventParms.getEvent() == null || eventParms.getEvent().isEmpty() ||
				eventParms.getRawJson() == null || eventParms.getRawJson().isEmpty() ) {

			throw new ServletException( "UserId, Event and JSON are required" );
		}
	}

}

