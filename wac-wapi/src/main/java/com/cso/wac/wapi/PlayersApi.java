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
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.cso.wac.wapi.secure.SecurityInterceptor;
import com.cso.wac.web.WACSession;

/**
 * Expose current players, channels;
 * e.g. transient session data (NOT from database, only "live" data)
 * 
 * Usage: GET 
	<pre>
	https://localhost:9443/wac-wapi/players/list/channels
	https://localhost:9443/wac-wapi/players/list/-1
	</pre>
	
	Where "-1" is a channel id returned from GET #1 (the default channel id is -1)
 * 
 * @author rleuthner
 *
 */

@Path("/players")
public class PlayersApi {
	
	@EJB
	private WACSession sessions;
	
	@Inject 
	private HttpServletRequest request;		
	
	public PlayersApi() {
	}
    
	/**
	 * Get list of users.
	 * 
	 * @return
	 */
    @GET
    @Path( "/list" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_ADMIN" )
    public String[] listUsers( ) {    
    	List<String>s = sessions.listUsers( SecurityInterceptor.getChanId( request ) );
    	return s.toArray( new String[ s.size() ] );
    } 
    
    @GET
    @Path( "/list/channels" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_USER" )
    public Long[] listChannels( ) {    
    	List<Long>s = sessions.listChannels( );
    	return s.toArray( new Long[ s.size() ] );
    } 
    
}