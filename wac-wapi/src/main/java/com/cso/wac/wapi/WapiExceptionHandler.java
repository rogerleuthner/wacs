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

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

public abstract class WapiExceptionHandler {

	private Status status;

	public WapiExceptionHandler() {}

	public WapiExceptionHandler( Status status ) {
		this.status = status;
	}

	public Response toResponse( WebApplicationException nfe ) {
		ResponsePkg response = new ResponsePkg( nfe.getMessage() );

		// explicitly set the content type to JSON so it decomposes the ResponsePkg using bean accessors
		return Response.status( status ).entity( response ).type( MediaType.APPLICATION_JSON ).build();
	}
}