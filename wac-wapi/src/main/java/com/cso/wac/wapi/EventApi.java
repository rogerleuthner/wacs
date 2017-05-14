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

package com.cso.wac.wapi;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.cso.wac.wapi.secure.SecurityInterceptor;
import com.cso.wac.web.WACSession;

/**
 * Expose Eventing
 *
 * @author rleuthner
 *
 */
@Path("/event")
public class EventApi {

	@EJB
	private WACSession wacSession;

	@Inject
	private HttpServletRequest request;

	public EventApi() {
	}

    /**
     * Send unrecorded event/data to all app contexts, no subscription required.
     *
     * @param event
     */
    @GET
    @Path( "/all/{event}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public void all( @PathParam( "event" ) String event  ) {
    	wacSession.sendToAllApps( SecurityInterceptor.getChanId( request ), event );
    }

    /**
     * Send unrecorded event to all of this users' apps, including the originating app.
     *
     * Note that semantic differs from the usual WS message that is filtered to not be sent to the originating user.
     */
    @GET
    @Path( "/allmine/{cmd}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public void saveState( @PathParam( "cmd" ) String cmd ) {
    	wacSession.sendToUsersApps( SecurityInterceptor.getUserName( request ),
    									SecurityInterceptor.getChanId( request ),
    									cmd );
    }
}