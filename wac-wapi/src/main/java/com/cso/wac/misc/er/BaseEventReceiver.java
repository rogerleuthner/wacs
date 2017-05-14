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

package com.cso.wac.misc.er;

import java.io.IOException;

import javax.ejb.EJB;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.fasterxml.jackson.core.io.JsonStringEncoder;
import com.cso.wac.JWTService;
import com.cso.wac.web.JWTAuthenticationFilter;
import com.cso.wac.web.WACSession;

/**
 * CCI Initialization.
 * 
 * TODO attribute names should match the cookie names to lessen confusion
 * 
 * @author rleuthner
 */
public abstract class BaseEventReceiver extends HttpServlet {
	private static final long serialVersionUID = 1L;
	public static final String WAC_JSON_ATTRIB = "wac_json";
	public static final String WAC_EVENT = "wac_event";	

	@EJB
	protected WACSession sessions;
	@EJB
	private JWTService jwtService;	
	
	public BaseEventReceiver() {
	}
	
	@Override
	public void init() throws ServletException {
	}

	@Override
	public void destroy() {
		super.destroy();
	}
	
	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
		response.setContentType("text/event-stream");
		response.setCharacterEncoding("UTF-8");
	}	
	
	// reminder to implement the parameter checker
	protected abstract void checkParms( EventParms ep ) throws ServletException;
	
	// TODO probably should extract this functionality into a base class for all WAC servlets
	// whether they participate in events or not; the event part could be added in for  those using
	// (or maybe just ignored if not existing/null)
	protected class EventParms {
		private final Long chId;
		private final String userId;
		private final String json;
		private final String event;

		public EventParms( HttpServletRequest request ) throws ServletException {			
			
			// JWTAuthenticationFilter has checked the JWT and extracted the
			// chId and userName and placed into the request attributes
			chId = JWTAuthenticationFilter.getChanId( request );			
			userId = JWTAuthenticationFilter.getUserName( request );
			json = request.getParameter( WAC_JSON_ATTRIB );
			event = request.getParameter( WAC_EVENT );
					
			checkParms( this );
		}
		
		public Long getChId() {
			return chId;
		}

		public String getUserId() {
			return userId;
		}

		public String getRawJson() {
			return json;
		}
		
		public String getEscapedJson() {
			return new String( JsonStringEncoder.getInstance().quoteAsString( json ) );
		}		

		public String getEvent() {
			return event;
		}
	}	
}

