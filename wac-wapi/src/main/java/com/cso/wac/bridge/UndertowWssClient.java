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

package com.cso.wac.bridge;

import java.io.File;
import java.io.FileInputStream;
import java.net.URI;
import java.security.KeyStore;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;
import javax.websocket.ClientEndpointConfig;
import javax.websocket.CloseReason;
import javax.websocket.ContainerProvider;
import javax.websocket.Endpoint;
import javax.websocket.EndpointConfig;
import javax.websocket.Session;
import javax.websocket.WebSocketContainer;

import org.apache.log4j.Logger;

import com.cso.wac.wapi.InternalException;
import com.cso.wac.web.AppUtil;

/**
 * Undertow-specific WSS client.  Does SSL setup that will work in a self-signed environment.
 *
 * @author rleuthner
 *
 */

public class UndertowWssClient extends Endpoint {
	private final String ALGORITHM = "SunX509";
	private final String STORETYPE = "JKS";
	private final String PROTO = "TLS";
	private final String UNDERTOW_SSL_CONTEXT = "io.undertow.websocket.SSL_CONTEXT";

	private Session session;

	private UndertowWssClient() {
		super();
	}
	public UndertowWssClient( String keystoreFile, String keypass, String storepass, URI uri ) throws Exception {
    	this();

		WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        ClientEndpointConfig cec = ClientEndpointConfig.Builder.create().build();
		KeyStore ks = KeyStore.getInstance( STORETYPE );
		File kf = new File( keystoreFile );
		KeyManagerFactory kmf = KeyManagerFactory.getInstance( ALGORITHM );
		TrustManagerFactory tmf = TrustManagerFactory.getInstance( ALGORITHM );
		SSLContext sslContext = SSLContext.getInstance( PROTO );

		ks.load( new FileInputStream( kf ), keypass.toCharArray() );
		kmf.init( ks, keypass.toCharArray() );
		tmf.init( ks );
		sslContext.init( kmf.getKeyManagers(), tmf.getTrustManagers(), null );

		// to use java's default key and trust store which is sufficient unless using self-signed certificates
		// sslContext.init( null, null, null );

        cec.getUserProperties().put( UNDERTOW_SSL_CONTEXT, sslContext );
        session = container.connectToServer( this, cec, uri );
	}

	public void blockingSend( String msg ) throws InternalException {
		try {
			session.getBasicRemote().sendText( msg );
		} catch (Exception e) {
			throw new InternalException( "Failed to send msg: " + e.getMessage() );
		}
	}

	public void asyncSend( String msg ) throws InternalException {
		session.getAsyncRemote().sendText( msg );
	}

	public void close() {
		try {
			if ( session != null && session.isOpen() ) {
				session.close();
			}
		} catch (Exception e) {
			Logger.getLogger( this.getClass() ).info( "Problem closing undertow wss: " + e.getMessage() );
		}
	}

	@Override
	public void onOpen(Session session, EndpointConfig config) {
	}

	@Override
	public void onError( Session session, Throwable t ) {
		Logger.getLogger( this.getClass() ).info( t.getMessage() );
		super.onError(session, t);
	}

	@Override
	public void onClose( Session session, CloseReason reason ) {
		super.onClose(session, reason);
	}

	public static void main( String[] args ) throws Exception {
		UndertowWssClient c = new UndertowWssClient( "C:/appservers/WACII/wildfly-9.0.1.Final/standalone/configuration/server.keystore",
				"tifu7us", "tifu7us",
					new URI( "wss://localhost:9443/wac-ws/message?target="
	    				+ AppUtil.getAppId( "gisannoapp", "*" )
	    				+ "&jws=eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJMLVJMRVVUSE5FUi00Iiwic3ViIjoid2VzbGV5IiwiaWF0IjoxNDU0OTU5OTIzLCJNQ1RfREFUQSI6eyJ1c2VySWQiOiJ3ZXNsZXkiLCJyb2xlcyI6WyJST0xFX0FETUlOIiwiUk9MRV9VU0VSIiwiTUNUX1NVUEVSIl0sIm1pcElkIjotMX19.Kf3oc1EmjMuVs0uw6LE_20sbuJ3yxHhyX08lxuhYRSw" ) );

		try {
			c.blockingSend( "string message suitable for your service" );
		} finally {
			c.close();
		}
	}

}