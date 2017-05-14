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

package com.cso.wac.wapi.secure;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.cso.wac.data.services.AppService;
import com.cso.wac.data.services.misc.UserService;
import com.cso.wac.wapi.InternalException;

/**
 * Web API for authorization and support for the {@link StatefulApp.getName()} app
 *
 * @author rleuthner
 *
 */

@Path("/auth")
public class AuthApi {

	@EJB
	private UserService userService;

	@EJB
	private AppService appService;

	public AuthApi() {
	}

    /**
     * Generate hashed password, for use in creating system users.  Returns arbitrary JSON data structure (any Javabean will do)
     *
     * OWF Admin access
     *
     * TODO convert to ResponsePkg
     *
     * @param password
     * @return
     */
    @GET
    @Path( "/generate/{password}" )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_ADMIN" )
    public Object generate( @PathParam( "password" ) String password ) throws InternalException {

    	try {
        	final String hashed = UserService.generatePasswordHash( password );

        	return new Object() {
        		@SuppressWarnings("unused")
				public String getHashed() {
        			return hashed;
        		}
        	};
    	} catch ( Exception e ) {
    		throw new InternalException( e.getMessage() );
    	}
    }
}

