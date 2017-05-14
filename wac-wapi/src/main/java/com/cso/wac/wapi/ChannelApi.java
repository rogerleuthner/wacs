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
import java.util.Map;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.cso.wac.data.domain.Channel;
import com.cso.wac.data.services.ChannelService;
import com.cso.wac.data.services.SnapshotService;
import com.cso.wac.exc.PersistenceException;
import com.cso.wac.web.WACSession;

/**
 * Support for Channel Builder
 *
 * @author rleuthner
 *
 */

@Path("/channel")
public class ChannelApi {

	@EJB
	private ChannelService channelService;

	@EJB
	private WACSession wacSession;

	@EJB
	private SnapshotService snapshotService;

	public ChannelApi() {
	}

	/**
	 * Get list of channels.
	 *
	 * TODO filter these on perchannel/roles
	 * TODO secure the method (RolesAllowed( ... ) )
	 *
	 * @return
	 */
    @GET
    @Path( "/list" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public List<Channel> list( ) {
    	return channelService.getChannels();
    }

    @GET
    @Path( "/listnames" )
    @Produces( MediaType.APPLICATION_JSON )
    @PermitAll
    public List<Object[]>listnames( ) {
    	return channelService.getChannelNames();
    }

    @GET
    @Path("/listsummary")
    @Produces(MediaType.APPLICATION_JSON)
    @PermitAll
    public List<Map<String,String>>listtest() {
    	return channelService.getChannelSummary();
    }

    /**
     * Update an existing channel.  Update methods don't leverage REST/Easy capability to materialize
     * the java object from the json representation behind the scenes since we only want to update
     * fields that were changed (and not have to send the entire set of fields back and forth every
     * time).  So, caller merely sends the json object string with the changed (java beans nomenclature)
     * fields that are affected.
     *
     * @throws InternalException
     */
    @POST
    @Path( "/update" )
    @Consumes( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_ADMIN" )
    public Long updateChannel( String json ) throws InternalException {
    	Channel tmp;
    	try {
    		tmp = channelService.update( json );

		} catch (PersistenceException e) {
			throw new InternalException( e.getMessage() );
		}

    	return tmp.getId();
    }

    /**
     * Create a new channel from scratch, using user-specified name and description
     */
    @POST
    @Path("/createchannel")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public Long createChannel(String json) throws InternalException {

    	Long ch;
    	try {
    		ch = channelService.create(json);
    	} catch (PersistenceException e) {
    		throw new InternalException(e.getMessage());
    	}

    	return ch;
    }

    /**
     * Create a channel
     */
    // ...
}