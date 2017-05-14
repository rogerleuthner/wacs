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

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.sql.Date;
import java.util.Map;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 * Since we own both endpoints, disable the trust manager so we can access the web api without using the WAC server truststore
 * Otherwise, must use some variation of (VM argument '-D' will also work):
 * <pre>
 *  System.setProperty("javax.net.ssl.trustStore", "C:\\appservers\\WACII\\wildfly-9.0.1.Final\\standalone\\configuration\\server.keystore" );
 * </pre>
 *
 * @author rleuthner
 *
 */

public class SampleClient extends BaseClient {

	public SampleClient( String user, String password, String chId ) {
		super( "https://localhost:9443",  "/wac-wapi/event", "wesley", "wesley", -1 );
	}

	public void postit(  ) {
		SampleEvent st = new SampleEvent("Catain", "Hook", 1L, new Date( System.currentTimeMillis() ) );
		Response r = null;
		try {

			System.out.println( "SENDING: " + st.toString() );

			r = eventTarget.path( "insert" ).request()
					.cookie( jwtCookie ).post( Entity.entity( st,  MediaType.APPLICATION_JSON ) );

			Object o = r.readEntity( SampleEvent.class );

			System.out.println( "STATUS: " + r.getStatus() );
			System.out.println( "RECEIVED: " + ((SampleEvent)o).toString() );

		} finally {
			if ( r != null ) {
				r.close();
			}
		}
	}

	public void getit( ) {
		Response r = null;
		try {
			r = eventTarget.path( "list" ).request().cookie( jwtCookie ).get();
	//		r = eventTarget.request().header(name, value)       .get( Entity.entity( User.class, MediaType.APPLICATION_JSON ) );
			System.out.println( r.readEntity( String.class ) );
		} finally {
			if ( r != null ) {
				r.close();
			}
		}
	}

	/**
	 * Send and receive arbitrary JSON payload so that middleware doesn't need to know anything
	 */
	public void getMapped() {
		@SuppressWarnings("unchecked")
		Map<String,Object> map = eventTarget.path( "insertjson" ).request( MediaType.APPLICATION_JSON ).get( Map.class );
	}



	public static void main(String[] args) throws KeyStoreException, NoSuchAlgorithmException, CertificateException, IOException, KeyManagementException {
		SampleClient client = new SampleClient( "rleuthner", "tifu7us", "-1" );

		client.postit( );
		client.getit( );
		//client.getMapped( );
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
}
