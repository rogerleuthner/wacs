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

package com.cso.wac.wapi.secure;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import javax.annotation.security.DenyAll;
import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.servlet.ServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.core.Cookie;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.Provider;

import org.jboss.resteasy.core.Headers;
import org.jboss.resteasy.core.ResourceMethodInvoker;
import org.jboss.resteasy.core.ServerResponse;

import com.cso.wac.JWTData;
import com.cso.wac.JWTService;
import com.cso.wac.exc.JWSException;

/**
 * Verifies access level for REStful API services using annotations at the method level.
 * JWT is extracted from a cookie (TODO - move into authorization header).  Roles, channel
 * id and username are extracted from the JWT.  Roles are compared with those allowed; if user
 * is not allowed and access denied exception is thrown.  The channel id and username are added
 * into the container request context, which allows access to them in the API method via
 * injecting the HttpServletRequest into the Api class, then using the static methods defined
 * herein to extract the fields (since most of the Api methods need the ch and/or user name)
 * for use in the Api.
 *
 * The access levels here are purely as roles for specific method access; does not take into
 * account the individual channel (data) roles.  Those channel-specific data roles need to be
 * accounted for in the SQL (with joins against channel/roles in the queries).
 *
 * Filter/permissions code should be optimized, as this is filter is executed on every REST access.
 *
 * @PermitAll and @DenyAll are handled by the container, as the roles don't need encoding anywhere
 * so here we just have to deal with the explicit listing of role names
 *
 * @author rleuthner
 *
 */
// Application scope unless Scope is explicitly stated
@Provider
public class SecurityInterceptor implements ContainerRequestFilter {

	@EJB
	private JWTService jwt;

	// milliseconds that 'PermitAll' methods are always delayed
	private static final int DOS_ATTACK_DELAY = 200;
	private static final String CHAN_ID = "com.wac.chId";
	private static final String USER_NAME = "com.wac.userName";
	// these fields are used to transfer the values extracted from JWT into the REST methods
	// so they don't need to be manually passed into them via rest path parameters
	private final static String RESTEASY_RESOURCE_METHOD_INVOKER = "org.jboss.resteasy.core.ResourceMethodInvoker";

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
	public void filter( ContainerRequestContext crc ) throws IOException {
		try {
			Map<String,Cookie> cookies = crc.getCookies();

			Method m = ((ResourceMethodInvoker)crc.getProperty( RESTEASY_RESOURCE_METHOD_INVOKER )).getMethod();

			if ( m.isAnnotationPresent( RolesAllowed.class ) ) {
				Set<String> rolesAllowed = new HashSet<String>( Arrays.asList( m.getAnnotation( RolesAllowed.class ).value() ) );

				// TODO share definition of this string!!!
				// TODO set/get this from the Authorization header
				Cookie jwtc = cookies.get( JWTService.JWT_COOKIE );

				if ( jwtc == null ) {
					throw new AccessDeniedException( "No token found, access is denied." );
				}

				JWTData d = jwt.verifyJwGetData( jwtc.getValue() );
				verifyRoles( rolesAllowed, d.getRoles() );

				// pass the extract generic fields to the API
				crc.setProperty( CHAN_ID, d.getChId() );
				crc.setProperty( USER_NAME, d.getUserId() );

			} else if ( m.isAnnotationPresent( PermitAll.class ) ) {

				// mitigate DOS attacks by introducing a slight delay on permitall services
		    	try {
					Thread.sleep( DOS_ATTACK_DELAY );
				} catch (InterruptedException e) {
					System.out.println( "DOS delay interrupted: " + e.getMessage() );
				}

				// TODO API might need at least channel id ....
				return;

			} else if ( m.isAnnotationPresent( DenyAll.class ) ) {

//				String s = crc.getHeaderString( HttpHeaders.AUTHORIZATION );
//				Map<String,List<String>>a = crc.getHeaders();

				// whitelisting so certain sensitive rest methods may be invoked from these origins without authentication
				// this is required we need to get started with generating a JWS, but want that to be part of
				// the cas/owf login sequence instead of in a standalone app (ordering might then be an issue)

				throw new AccessDeniedException( "Method not allowed",  Response.Status.UNAUTHORIZED );

			} else {
				throw new AccessDeniedException( "Unknown or absent security annotation" );
			}

		} catch ( AccessDeniedException m ) {
			crc.abortWith( m.getServerResponse() );

		} catch( JWSException j ) {
			crc.abortWith( new ServerResponse( "JWS failed: " + j.getMessage(),
					Response.Status.UNAUTHORIZED.getStatusCode(), new Headers<Object>() ) );
		}
	}

	/*
	 * TODO apps do not show if there is insufficient data in the channel for them to be operated.
	 * TODO the only thing that shows properly in insufficient permissions is the apps permissions themselves,
	 * e.g. when there are insufficient roles to view the app a good error message shows.  insufficient data
	 * error messages need to be implemented somehow (e.g. the servlet interceptor??)
	 */
	private void verifyRoles( Set<String>rolesAllowed, String[] rolesAuthorized ) throws AccessDeniedException {
		StringBuilder sb = null;

		if ( rolesAuthorized != null ) {

			for( String s : rolesAuthorized ) {

				if ( rolesAllowed.contains( s ) ) {
					return;
				}

				// defer this until last possible time; thus if the first (or only) role is suitable,
				// avoid the object creation
				if ( sb == null ) {
					sb = new StringBuilder();
				} else {
					sb.append( ", " );
				}

				sb.append( s );
			}
		}
		throw new AccessDeniedException( "Role(s): " + ( sb != null ? sb.toString() : "(none)" )
				+ " not allowed",  Response.Status.UNAUTHORIZED );
	}

	private class AccessDeniedException extends Exception {
		private static final long serialVersionUID = -7454499139912661993L;
		ServerResponse serverResponse;
		public AccessDeniedException( String mess ) {
			this( mess, Response.Status.UNAUTHORIZED );
		}
		public AccessDeniedException( String mess, Response.Status httpCode ) {
			serverResponse = new ServerResponse( mess, httpCode.getStatusCode(), new Headers<Object>() );
		}
		public ServerResponse getServerResponse() { return serverResponse; }
	}

}