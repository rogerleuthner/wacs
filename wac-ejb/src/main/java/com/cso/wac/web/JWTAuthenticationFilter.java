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

package com.cso.wac.web;

import java.io.IOException;

import javax.ejb.EJB;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import com.cso.wac.JWTData;
import com.cso.wac.JWTService;
import com.cso.wac.data.services.ConfigService;
import com.cso.wac.exc.JWSException;

/**
 * Keep folks from poking around in the WAC application components.
 * Even though the data sources are secured, some of the static entry
 * points might reveal some information.
 * 
 * Note that this filter also sets up username and channel id into the
 * request attributes, so if a backend processing servlet needs those the
 * servlet must be secured with this filter (or they will have to extract
 * from the jwt themselves).
 * 
 * Note that securing things like this might be expensive, so don't secure
 * every bit and piece, just main entry points of apps, e.g.:
 * <pre>
	&lt;filter&gt;
		&lt;filter-name&gt;JWTAuthenticationFilter_roleset1&lt;/filter-name&gt;
		&lt;filter-class&gt;com.cso.wac.web.JWTAuthenticationFilter&lt;/filter-class&gt;
		&lt;init-param&gt;
			&lt;param-name&gt;roles-allowed&lt;/param-name&gt;
			&lt;param-value&gt;WAC_CONTROLLER, ... (comma separated list)&lt;/param-value&gt;
		&lt;/init-param&gt;
	&lt;/filter&gt;
 
	&lt;filter-mapping&gt;
		&lt;filter-name&gt;JWTAuthenticationFilter_roleset1&lt;/filter-name&gt;
		&lt;url-pattern&gt;/app1/*&lt;/url-pattern&gt;
		&lt;url-pattern&gt;/app2/*&lt;/url-pattern&gt;
	&lt;/filter-mapping&gt;
	
	(repeat for each set of apps with similar role constraints)
 * </pre>
 * @author rleuthner
 *
 */

// TODO rename me SecurityFilter

// support async since all filters in chain must support it, and this precedes EventReceiver.
// moved the filter config into web.xml since we also support enumeration of roles in there.
//@WebFilter( urlPatterns = "/JWTAuthenticationFilter", asyncSupported = true )
public class JWTAuthenticationFilter implements Filter {
	@EJB
	private JWTService jwt;
	
	@EJB
	private ConfigService configService;
	
	// entry in web.xml conf
	private static String ROLES_PARAMETER = "roles-allowed";
	String[] rolesAllowed = null;
	
	// TODO share the following constants and two static methods with the wapi 'SecurityInterceptor.java'
	private static final String CHAN_ID = "com.wac.chId";
	private static final String USER_NAME = "com.wac.userName";	
	
	/**
	 * Extract chId from the request
	 * 
	 * @param ServletRequest
	 * @return Long channel id or null
	 */
	public static final Long getChanId( ServletRequest r ) {
		return (Long)r.getAttribute( CHAN_ID );
	}
	
	/**
	 * Extract userName from the request
	 * 
	 * @param ServletRequeste
	 * @return String or null
	 */
	public static final String getUserName( ServletRequest r ) {
		return (String)r.getAttribute( USER_NAME );
	}	

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;

        Cookie[] cookies = req.getCookies();
        
        if ( cookies != null ) {
            Cookie jwtC = null;            
        	
            // here could also check the channel cookie if we want to button down in here per channel role as well
	        for( Cookie c : cookies ) {
	        	if ( c.getName().equals( JWTService.JWT_COOKIE ) ) {  // TODO config service cookie name
	        		jwtC = c;
	        		break;
	        	} 
	        }
	        
	        // might not have the cookie at all, in which case fall to fail
	        if ( jwtC != null ) {	        
	    		try {
	    			// basic authentication token verification; not having this token needs to result in redirect
	    			// to an OWF login
	    			JWTData d = jwt.verifyJwGetData( jwtC.getValue() );
	    			
	    			// role violation not so severe, since we're already logged in the redirect is to WAC
	    			if ( verifyRole( d ) ) {
	    				
	    				// extract critical data from jwt and pass it along to consuming servlet so each servlet
	    				// can just pick it out of the request
	    				request.setAttribute( CHAN_ID, d.getChId() );
	    				request.setAttribute( USER_NAME, d.getUserId() );
	    				
						chain.doFilter(request, response);
						
	    			} else {
	    				// access to this web context is not allowed by roles defined in the web.xml/servlet filter definition
	    		        ((HttpServletResponse)response).sendRedirect( configService.get( ConfigService.KEY_APP_DENIED_REDIRECT ) );
	    			}
	    			
	    			return;
					
				} catch (JWSException e) {
					// any exception in this process needs to be dealt with as a severe failure, so fall through
					// to a system login
					Logger.getLogger( JWTAuthenticationFilter.class ).info( "Failed to verify: " + jwtC.getValue() );
				}
	        }
	        	        
        }
        ((HttpServletResponse)response).sendRedirect( configService.get( ConfigService.KEY_APPLICATION_DENIED_REDIRECT ) );	
	}

	// note that this has the tendency to go O^2, yet it MUST be fast.
	// keep the data sets small, and the loop/compare is the most efficient way.
	private boolean verifyRole( JWTData d ) throws JWSException {
		// only do this check if explicit roles are listed in the deployment descriptor
		if ( rolesAllowed != null ) {
			String[] jwtRoles = d.getRoles();
			for( String j : jwtRoles ) {
				for( String a : rolesAllowed ) {
					if ( j.equals( a ) ) {
						return true;
					}
				}
			}
			return false;
		}
		return true;  // no roles specified means allow ... for now
	}
	
	@Override
	public void init(FilterConfig fConfig) throws ServletException {
		String roles = fConfig.getInitParameter( ROLES_PARAMETER );
		
		if ( roles != null ) {
			// the parse/format is a little crude, but keep it simple
			String[] p1 = roles.split( "," );
			rolesAllowed = new String[ p1.length ];
			int i = 0;
			for( String s : p1 ) {
				rolesAllowed[ i++ ] = s.trim();
			}
		}
		
		// TODO do some role verification
		// TODO absence of roles should cause all invocations to be rejected!!
	}
	
	@Override
	public void destroy() {		
	}	

}
