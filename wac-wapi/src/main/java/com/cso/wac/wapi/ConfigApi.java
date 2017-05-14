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

import java.io.IOException;
import java.util.Map;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.cso.wac.data.services.ConfigService;


@Path("/config")
public class ConfigApi {

	@EJB
	private ConfigService configService;

	public ConfigApi() {
	}

    @GET
    @Path( "/get/{key}" )
    @Produces( MediaType.TEXT_HTML )
	@RolesAllowed( "ROLE_USER" )
    public String get( @PathParam( "key" ) String key ) throws IOException {
    	return configService.get( key );
    }

    @GET
    @Path( "/all" )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
    public Map<String,String> get( ) throws IOException {
    	return configService.map();
    }
}