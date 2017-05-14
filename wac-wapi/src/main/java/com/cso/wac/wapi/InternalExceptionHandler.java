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

import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import org.apache.log4j.Logger;

/**
 * General-purpose exception for REST API calls that fail to produce expected results.
 * Most, non-auth-related REST API methods should aggregate all their exceptions into
 * this one.
 *
 * Avoids polluting the log file with stack traces; if traces are found in the logs,
 * then identify the area of the code where failures are occuring and handle with
 * InternalException
 *
 * @author rleuthner
 *
 */

@Provider
public class InternalExceptionHandler extends WapiExceptionHandler implements ExceptionMapper<InternalException> {

	public InternalExceptionHandler() {
		super(  Status.INTERNAL_SERVER_ERROR );
	}

	@Override
	public Response toResponse( InternalException nfe ) {
		Logger logger = Logger.getLogger( InternalException.class );
		logger.info( "Internal Server Error: " + nfe.getMessage() );
		return super.toResponse( nfe );
	}
}