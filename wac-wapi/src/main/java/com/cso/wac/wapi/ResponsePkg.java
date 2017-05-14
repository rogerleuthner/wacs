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

/**
 * Response Package
 * For sending data Response entity to the ReST consumer, e.g.:
 * <pre>
 * 	return Response.status( Response.Status.OK ).entity( new ResponsePkg( "Hi-di Ho!" ).build();
 * </pre>
 * 
 * @author rleuthner
 *
 */

public class ResponsePkg {
	private String text;

	// javabean compliant (or json-serialization-compatible) object to encapsulate for sending to UI	
	private Object data;
	private Response.Status status;
	
	public Response.Status getStatus() {
		return status;
	}
	
	public void setStatus( Response.Status s ) {
		this.status = s;
	}
	
	public ResponsePkg( String text ) {
		this.text = text;
	}
	
	public ResponsePkg( Object data ) {
		this.data = data;
	}
	
	public ResponsePkg( ) {}
	
	public String getText() {
		return text;
	}
	
	public void setText(String text) {
		this.text = text;
	}

	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}
}