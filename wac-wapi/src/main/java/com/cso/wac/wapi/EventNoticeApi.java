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

import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.data.services.misc.EventNoticeService;
import com.cso.wac.wapi.secure.SecurityInterceptor;

/**
 * Expose EventNoticeService
 *
 * @author rleuthner
 *
 */
@Path("/eventNotice")
public class EventNoticeApi {

	@EJB
	private EventNoticeService eventNoticeService;

	@Inject
	private HttpServletRequest request;

	public EventNoticeApi() {
	}

	/**
	 * Send fire and forget recorded event to apps subscribed to the event type.
	 *
	 * @param event
	 */
    @GET
    @Path( "/emit/{event}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public void send( @PathParam( "event" ) String event  ) {
    	eventNoticeService.createNoticeAsync( event, event, EventSeverity.NORMAL,
    			SecurityInterceptor.getChanId( request ), SecurityInterceptor.getUserName( request ) );

    }
}