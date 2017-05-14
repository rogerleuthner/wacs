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

package com.cso.wac.data.services;

import java.io.IOException;
import java.io.InputStream;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import javax.ejb.EJB;
import javax.ejb.Lock;
import javax.ejb.LockType;
import javax.ejb.SessionContext;
import javax.ejb.Singleton;
import javax.ejb.Startup;

import org.apache.log4j.Logger;

import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.domain.Config;
import com.cso.wac.exc.ProgrammingException;

/**
 * Caches config data at startup, generates/retrieves some data needed throughout system.
 *
 * Gets the properties from the database table, puts them into a properties map, and overrides
 * those with [any] properties that are defined in the wac.properties file.
 *
 * SINGLETON; GENERATES SHARED SECRET AT APPLICATION STARTUP
 *
 * TODO figure out how to exploit these symbols in the .JS
 *
 * TODO implement a 'URL/path' generator that accounts for ending slash on fixed part, and
 * builds the proper file/url path given a pathname (here) combined with input from api-end (filename)
 *
 * @author rleuthner
 *
 */

@Singleton
@Startup
@Lock( LockType.READ ) // default methods to read-only
public class ConfigService {
	@EJB
	private DataRepositoryProducer producer;
	@Resource
	SessionContext context;

	// properties required for system operation

	public final static String KEY_FILESHARE_PATH = "fileshare.files.system.path";
	public final static String KEY_APP_DENIED_REDIRECT = "app.permission.denied.page";
	public final static String KEY_APPLICATION_DENIED_REDIRECT = "application.permission.denied.page";
	public final static String KEY_BRIDGE_MAX_UPLOAD_BYTES = "bridge.max.filesize";
	public final static String KEY_SSL_KEYSTORE_FILE = "ssl.keystore.file";
	public final static String KEY_SSL_KEYSTORE_PASS = "ssl.keystore.pass";
	public final static String KEY_WSS_MESSAGE_SERVICE = "wss.message.service";
	public final static String KEY_WAPI_IMAGE_URL = "wapi.imageproducer.url";
	// "built in" parameters that require some server code execution ...
	public final static String GENERATED_IP = "ip";

	// misc unessential properties
	public final static String KEY_WAC_VERSION = "wac.version";

	private final static String RESOURCES_FILE = "wac.properties";
	private final Properties properties = new Properties();
	private final byte[] sharedSecret = new byte[ 32 ];
	private List<Config>configs;

	public ConfigService() {}

	@SuppressWarnings("unchecked")
	@PostConstruct
	private void init() throws ProgrammingException {
		configs = producer.getEntityManager().createQuery( "FROM Config" ).getResultList();

		// don't keep the list of ORM objects around, just keep a regular properties list.
		// makes merging with file configs easy, and not sure about configuring the ORM cache.
		for( Config c : configs ) {
			properties.put( c.getName(), c.getValue() );
		}
		configs = null;

		SecureRandom random = new SecureRandom();
		random.nextBytes( sharedSecret );
		overrideWithFileProperties();
		validateRequiredProperties();
	}

	public String get( String key ) {
		return (String)properties.get( key );
	}

	// combines a file input with a fixed path to produce usable full pathname
	// that accounts for string values that do/don't have a trailing slash
	public String getPath( String key, String fileName ) {
		String p = get( key );
		if ( p.endsWith( "/" ) ) {
			return p + fileName;
		} else {
			return p + "/" + fileName;
		}
	}

	public Set<Entry<Object, Object>> all() {
		return properties.entrySet();
	}

	public Map<String,String> map() {
		HashMap<String,String>m = new HashMap<String,String>();

		for( Object p : properties.keySet().toArray() ) {
			m.put((String)p, (String)properties.get( p ) );
		}

		return m;
	}

	public byte[] getSharedSecret() {
		return sharedSecret;
	}

	// TODO make sure this is additive/overriding and not replacing completely
	private void overrideWithFileProperties( ) {
		InputStream is = null;
		try {
			is = this.getClass().getClassLoader().getResourceAsStream( RESOURCES_FILE );
			properties.load( is );

		} catch ( Exception e ) {
			Logger.getLogger( ConfigService.class ).info( "Property file READ FAILURE: " + e.getMessage() );
		} finally {
			try {
				if ( is != null ) {
					is.close();
				}
			} catch (IOException e) {/*ignore*/}
		}
	}

	private void validateRequiredProperties() throws ProgrammingException {
		// if values for all required properties are not found,
		// throw Exception
		// TODO
	}
}