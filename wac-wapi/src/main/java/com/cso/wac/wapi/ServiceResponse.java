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

import java.io.Serializable;

import javax.servlet.http.HttpServletResponse;

/**
 * Subclass this response object to provide the typed setPayload/getPayload; helps
 * to avoid elaborate JSON mapping schemes, yet allow uniform handling by restangular
 * at the front end.
 * 
 * Any (serializable) properties implemented as bean fields (set/get) will be exposed in the
 * "response" portion of RestangularProvider.setResponseExtractor(function(response, operation, what, url) 
 * 
 * <pre>
 * in response extractor body:
 *   alert( response.set[0]['@type'] );
 * shows 'double'
 * 
 * when this class provides data:
 *   private Set set = new HashSet();
 *   set.add( new Double( 3.14 ) );
 *   
 * and 'set' is given setter/getter
 * </pre>
 * 
 * 
 * @author rleuthner
 *
 */
//201 - Created
//304 - Not Modified
//400 - Bad Request
//401 - Unauthorized
//403 - Forbidden
//200 - OK
//404 - Not Found
//500 - Internal Server Error


public abstract class ServiceResponse implements Serializable {

	private static final long serialVersionUID = -1568737578556350280L;
	public final static String STATUS_SUCCESS = "SUCCESS";
	public final static String STATUS_FAILURE = "FAILURE";
	protected String status = STATUS_SUCCESS;
	protected int code = HttpServletResponse.SC_OK;   // these codes are not the HTTP header codes, so may just create our own enum/interpretation
	protected String message = "Request processed successfully";	
	
	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public int getCode() {
		return code;
	}

	public void setCode(int code) {
		this.code = code;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
}
