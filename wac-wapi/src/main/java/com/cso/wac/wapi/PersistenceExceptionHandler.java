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

import javax.ws.rs.ServerErrorException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import org.apache.log4j.Logger;

import com.cso.wac.exc.PersistenceException;

@Provider
public class PersistenceExceptionHandler extends WapiExceptionHandler implements ExceptionMapper<PersistenceException> {

	public PersistenceExceptionHandler() {
		super( Status.INTERNAL_SERVER_ERROR );
	}

	@Override
	public Response toResponse( PersistenceException nfe ) {
		Logger logger = Logger.getLogger( ServerErrorException.class );
		logger.info( "Failed to save data: " + nfe.getMessage() );
		return super.toResponse( nfe );
	}
}