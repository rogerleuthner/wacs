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
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;

import com.cso.wac.data.domain.FileEntry;
import com.cso.wac.data.services.WebLinkService;
import com.cso.wac.exc.PersistenceException;

/**
 * Support for Links Manager
 *
 * @author rleuthner
 *
 */

@Path("/weblink")
public class WebLinkApi {

	@EJB
	private WebLinkService webLinkService;

	public WebLinkApi() {
	}

    /**
     * Update an existing weblink.  Update methods don't leverage REST/Easy capability to materialize
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
    public Long updateWebLink( String json ) throws InternalException {
    	FileEntry tmp;
    	try {
    		tmp = webLinkService.update( json );

		} catch (PersistenceException e) {
			throw new InternalException( e.getMessage() );
		}

    	return tmp.getId();
    }

    @POST
    @Path("/createweblink")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public Long createWebLink(String json) throws InternalException {

    	Long webLink;
    	try {
    		webLink = webLinkService.create(json);
    	} catch (PersistenceException e) {
    		throw new InternalException(e.getMessage());
    	}

    	return webLink;
    }

    @POST
    @Path("/removeweblink")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public Boolean removeWebLink(String json) throws InternalException {
    	try {
    		return webLinkService.remove(json);
    	} catch (PersistenceException e) {
    		throw new InternalException(e.getMessage());
    	}
    }

}