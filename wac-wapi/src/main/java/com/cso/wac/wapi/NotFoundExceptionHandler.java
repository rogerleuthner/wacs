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

import javax.ws.rs.NotFoundException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import org.apache.log4j.Logger;

/**
 * Avoid ugly stack trace when a rest service is called that does not exist.
 *
 * This merely ensures that the client just receives an HTTP not found instead of throwing a NotFoundException
 * that would otherwise result in a stack trace in the logs, just output a one line error message.
 *
 * As a side effect, it also is used to cloak password fails, but that can be changed to something
 * more (or less) informative if desired.
 *
 * @author rleuthner
 *
 */

@Provider
public class NotFoundExceptionHandler extends WapiExceptionHandler implements ExceptionMapper<NotFoundException> {

	public NotFoundExceptionHandler() {
		super( Status.NOT_FOUND );
	}

	@Override
	public Response toResponse( NotFoundException nfe ) {
		Logger logger = Logger.getLogger( NotFoundExceptionHandler.class );
		logger.info( "Rejecting REST access: " + nfe.getMessage() );
		return super.toResponse( nfe );
	}
}