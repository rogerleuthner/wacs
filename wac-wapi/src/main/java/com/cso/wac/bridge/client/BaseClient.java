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

package com.cso.wac.bridge.client;

import javax.ws.rs.core.Cookie;

import org.jboss.resteasy.client.jaxrs.ResteasyClient;
import org.jboss.resteasy.client.jaxrs.ResteasyClientBuilder;
import org.jboss.resteasy.client.jaxrs.ResteasyWebTarget;

import com.cso.wac.JWTService;
import com.cso.wac.data.domain.User;

/**
 * Since we own both endpoints, disable the trust manager so we can access the web api without using the WAC server truststore
 * Otherwise, must use some variation of (VM argument '-D' may also work):
 * <pre>
 *  System.setProperty("javax.net.ssl.trustStore", "C:\\appservers\\WACII\\wildfly-9.0.1.Final\\standalone\\configuration\\server.keystore" );
 * </pre>
 *
 * @author rleuthner
 *
 */

public class BaseClient {

	final String authURL;
	final String serviceURL;
	final String contentType = "application/json;charset=UTF-8";

	final ResteasyClient eventClient;
	final ResteasyWebTarget eventTarget;
	final Cookie jwtCookie;

	@SuppressWarnings("unused")
	private BaseClient() { throw new RuntimeException("Don't use me");}

	public BaseClient( String baseURL, String targetURL, String user, String password, int chId ) {

		authURL = baseURL + "/wac-wapi/user/init";
		serviceURL = baseURL + targetURL;
		// unauthenticated call to get a JWT
        ResteasyClient authClient = new ResteasyClientBuilder().disableTrustManager().build();
        ResteasyWebTarget authTarget = authClient.target( authURL ).path(user).path(password).path( Integer.toString( chId ) );

        User userO = authTarget.request().get( User.class );

        if ( userO == null ) {
        	throw new RuntimeException( "Login failed, bad user name or password" );
        }

        eventClient = new ResteasyClientBuilder().disableTrustManager().build();
        jwtCookie = new Cookie( JWTService.JWT_COOKIE, userO.getJWT() );

        if ( serviceURL != null ) {
        	eventTarget = eventClient.target( serviceURL );
        } else {
        	eventTarget = null;
        	System.out.println( "Not executing any services, just running login (testing)" );
        }

        // TODO best practice dictates that we should be using query parameters or authorization header
        // for this thing
        // example of manually adding authorization header
		//User user = resource.request( MediaType.APPLICATION_JSON ).header(HttpHeaders.AUTHORIZATION, "ROLE_FOKKER").get( User.class );
	}
}


/**
 * Sample ClientRequestFilter to automatically apply the cookie, see companion code
 * <code>
 * eventClient.register( new CookieClientRequestFilter( new Cookie( JWTService.JWT_COOKIE, userO.getJWT() ) ) );
 * </code>
 * <pre>
private final class CookieClientRequestFilter implements ClientRequestFilter {
	private Cookie cookie;
	public CookieClientRequestFilter( Cookie cookie ) {
		super();
		this.cookie = cookie;
	}
	@Override
	public void filter( ClientRequestContext clientRequestContext ) throws IOException {
		List<Object>cookies = new ArrayList<>();
		cookies.add( cookie );
		clientRequestContext.getHeaders().put( "Cookie", cookies );
	}
}
* </pre>
*/