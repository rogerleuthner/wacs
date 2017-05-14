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
import javax.ws.rs.core.Response;

import com.cso.wac.data.domain.Snapshot;
import com.cso.wac.data.domain.AppState;
import com.cso.wac.data.services.SnapshotService;
import com.cso.wac.wapi.secure.SecurityInterceptor;
import com.cso.wac.web.WACSession;

/**
 * Expose snapshots and content
 *
 * Usage: GET
	<pre>
	https://localhost:9443/wac-wapi/timed/ ... methods
	</pre>
 *
 * @author rleuthner
 *
 */

@Path("/timed")
public class TimedApi {

	@EJB
	private SnapshotService snapshotService;

	@Inject
	private HttpServletRequest request;

	@EJB
	private WACSession wacSession;

	public TimedApi() {
	}

    @GET
    @Path( "/count" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public Long count() {
    	return snapshotService.getRowCount( SecurityInterceptor.getChanId( request ) );
    }

    /**
     * Get app state from cached channel snapshot or null if none found.
     *
     * @param snapId
     * @param wuid
     * @return
     */
    @GET
    @Path( "/getapphead/{wuid}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_ADMIN" )
    public String getAppHead( @PathParam( "wuid" ) String wuid ) {
    	for( AppState ws : wacSession.getChannelHead( SecurityInterceptor.getChanId( request ) ).getAppStates() ) {
    		if ( ws.getName().equals( wuid ) ) {
    			return ws.getState();
    		}
    	}

    	return null;
    }


    /**
     * Get component AppStates composing snapshot for ch within 'chunksize' of snapshot with id 'prev'
     * Previous is the ID of the "last" previously used entry; if previous is negative, then
     * we are going backwards, otherwise it's forwards.  if we are going backwards, the ordering
     * on date is reverse (most recent is first), while forwards means order is (most recent is last)
		<pre>
            Example: chunksize "3" and x == id of entry #4

                   x
             1 2 3 4 5 6 7 8 9 10
             means return 5, 6, 7

                  -x
             1 2 3 4 5 6 7 8 9 10
             means return 3, 2, 1
		</pre>
     * @param chId
     * @param userName
     * @param previousId
     * @return List<AppState>
     */
    @GET
    @Path( "/getsnapshots/{prev}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public List<Snapshot>getSnapshots( @PathParam( "prev" ) Integer fromRow ) {
    	return snapshotService.getSnapshots( SecurityInterceptor.getChanId( request ), fromRow );
    }


    /**
     * Get component AppStates composing snapshot
     *
     * @param snapshotId
     * @return List<AppState>
     */
    @GET
    @Path( "/getstates/{snapshotId}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public List<AppState>getStates( @PathParam( "snapshotId" ) Long snapshotId ) {
    	return snapshotService.getStates( snapshotId );
    }

    /**
     * Create master snapshot record from CollabApp states and command messages.
     * Intended to be updated by individual task apps for 1) condensing command messages, and 2) recording state that
     * may be only on a particular client. (non-collab state stuff).
     *
     * @param {name} String
     * @param {desc} String
     * @return Response with new snapshot id
     */
    @GET
    @Path( "/snapshot/{name}/{desc}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public Response snapshot( @PathParam( "name" ) String name, @PathParam( "desc" ) String desc ) {
    	Long chId = SecurityInterceptor.getChanId( request );
    	Snapshot snapshot = snapshotService.copySnapshot( wacSession.getHead( chId ), chId, SecurityInterceptor.getUserName( request ), name, desc );
		return Response.status( Response.Status.OK ).entity( snapshot.getId() ).build();
    }

    /**
     * Remove all users from channel except for originator.
     * Retrieve and set the "head" snapshot into WACSession for the user's logged in channel.
     *
     * @param snapId
     * @return
     */
    @GET
    @Path( "/sethead/{snapId}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_ADMIN" )
    public Response set( @PathParam( "snapId" ) Long snapId ) {
		return Response.status( Response.Status.OK ).entity( wacSession.setChannelHead( snapId, SecurityInterceptor.getUserName( request ) ).getId() ).build();
    }

    /**
     * Delete snapshot and associated app states.
     *
     * @param snapId
     * @return
     */
    @GET
    @Path( "/delete/{snapId}" )
    @RolesAllowed( "ROLE_ADMIN" )
    public int delete( @PathParam( "snapId" ) Long snapId ) {
    	return snapshotService.delete( snapId );
    }
}