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

package com.cso.wac.misc;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.InetAddress;
import java.util.Map.Entry;

import javax.ejb.EJB;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import com.cso.wac.data.services.ConfigService;

/**
 * Emit JSON representation of the properties to enable sharing between the javascript and
 * backend code running in arbitrary web contexts.
 * 
 * @author rleuthner
 *
 */

@WebServlet( name="Config", urlPatterns={"/Config"}, loadOnStartup=1 )
@Produces ({"application/json"} )
@Path( "Config" )
public class Config extends HttpServlet {

	private static final long serialVersionUID = -6785780341535373231L;

	@EJB
	private ConfigService configService;
	
	// key for ConfigService?name=someSpecificParameter
	public static String SPECIFIC_PARAM = "key";

	public Config() {
		super();
	}
	
	/*
	 * Manually build the JSON representation of the properties; note that the JSON.parse() on the javascript side requires
	 * that double quotes be used to quote the keys/values.
	 * 
	 * @see javax.servlet.http.HttpServlet#doGet(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

		resp.setContentType("application/json");
		resp.setCharacterEncoding("UTF-8");
		PrintWriter writer = resp.getWriter();				
		
		if ( req.getParameterMap().containsKey( SPECIFIC_PARAM ) ) {
			writer.write( "{" );
			writer.write( getValue( req.getParameter( SPECIFIC_PARAM ) ) );
			writer.write( "}" );			
		} else if ( req.getParameterMap().containsKey( ConfigService.GENERATED_IP ) ) {
			writer.write( InetAddress.getLocalHost().getHostAddress() );
		} else {
			writer.write( "{" );
			writer.write( getAll() );
			writer.write( "}" );			
		}		
		writer.flush();
		resp.flushBuffer();
	}

	private String getValue( String key ) {
		String value = configService.get( key );
		if ( value != null ) {
			return ( "\"" + key + "\":\"" + value + "\"" );
		}
		return "";
	}
	
	private String getAll() {
		StringBuilder sb = new StringBuilder();
		boolean first = true;
		
		for ( Entry<Object, Object> entry : configService.all() ) {
			if ( ! first ) {
				sb.append( ", "  );
			} else {
				first = false;				
			}
			sb.append( "\"" + entry.getKey() + "\":\"" + entry.getValue() + "\"" );			
		}
		return sb.toString();
	}
}