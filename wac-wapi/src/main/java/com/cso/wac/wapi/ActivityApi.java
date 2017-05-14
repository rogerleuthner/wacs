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

import java.util.List;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.cso.wac.data.domain.EventNotice;
import com.cso.wac.data.services.misc.EventNoticeService;
import com.cso.wac.wapi.secure.SecurityInterceptor;

/**
 * Activity API
 *
 * @author wkrueger
 *
 */

@Path("/activity")
public class ActivityApi {

	@EJB
	private EventNoticeService eventNoticeService;

	@Inject
	private HttpServletRequest request;

	/* constructor */
	public ActivityApi() {
	}

	// Get all activity notices for the current channel ID
	@GET
	@Path("/listall")
	@Produces(MediaType.APPLICATION_JSON)
	@RolesAllowed("ROLE_ADMIN")
	public List<EventNotice> listAll() {
		List<EventNotice>notices = eventNoticeService.getAllEventNotices(SecurityInterceptor.getChanId( request ));
		return notices;
	}

	// Get all activity notices for the current channel ID
	@GET
	@Path("/list/{startrow}/{pagesize}")
	@Produces(MediaType.APPLICATION_JSON)
	@RolesAllowed("ROLE_ADMIN")
	public List<EventNotice> list( @PathParam( "startrow") int startrow, @PathParam("pagesize") int pagesize ) {
		List<EventNotice>notices = eventNoticeService.getEventNotices( SecurityInterceptor.getChanId( request ), startrow, pagesize );
		return notices;
	}

	// Get number of activity notices for the current channel ID
	@GET
	@Path("/nactivities")
	@Produces(MediaType.TEXT_PLAIN)
	@RolesAllowed("ROLE_ADMIN")
	public Long getNum() {
		return eventNoticeService.getNumEvents(SecurityInterceptor.getChanId(request));
	}

	// Get only published notices for the current channel ID
	@GET
	@Path("/listpub")
	@Produces(MediaType.APPLICATION_JSON)
	@RolesAllowed("ROLE_ADMIN")
	public List<EventNotice> listPublished() {
		return eventNoticeService.getEventNotices(SecurityInterceptor.getChanId( request ), true);
	}

	// Get only unpublished notices for the current channel ID
	@GET
	@Path("/listunpub")
	@Produces(MediaType.APPLICATION_JSON)
	@RolesAllowed("ROLE_ADMIN")
	public List<EventNotice> listUnpublished() {
		return eventNoticeService.getEventNotices(SecurityInterceptor.getChanId( request ), false);
	}
}