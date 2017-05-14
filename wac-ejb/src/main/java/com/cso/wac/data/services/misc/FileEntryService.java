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


package com.cso.wac.data.services.misc;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.UpdateObjectMapper;
import com.cso.wac.data.domain.FileEntry;
import com.cso.wac.data.domain.Channel;
import com.cso.wac.data.domain.User;
import com.cso.wac.data.domain.types.FileType;
import com.cso.wac.data.services.ConfigService;
import com.cso.wac.exc.PersistenceException;
import com.cso.wac.exc.ProgrammingException;

/**
 * This is verbosely named to differentiate between the file action servlets.
 *
 * These are files/documents that are:
 * 1) uploaded from users
 * 2) part of a channel profile/template
 * 3) app configs/templates
 * ...
 *
 * @author rleuthner
 *
 */

@Stateless
public class FileEntryService {
	@EJB
	private DataRepositoryProducer producer;

	@EJB
	private UserService userService;

	@EJB
	private UpdateObjectMapper updater;

	@EJB
	private ConfigService configService;

	private String BASEPATH;

	private static ObjectMapper mapper = new ObjectMapper();

	public FileEntryService() {

	}

	@PostConstruct
	void init() {
		BASEPATH = configService.get( ConfigService.KEY_FILESHARE_PATH );
	}

	@SuppressWarnings("unchecked")
	public List<FileEntry>getFileEntries( Long chId, String type ) {
		FileType f = null;

		if ( ! type.contains( "%" ) ) {
			try {
				f = FileType.valueOf( type );

			} catch ( IllegalArgumentException e ) {
				throw new ProgrammingException( "Unrecognized FileType or bad channel id: " + type + ", " + chId + "; " + e.getMessage() );
			}
		}

		return producer.getEntityManager().createQuery( "FROM FileEntry WHERE ch.id = :ch AND type LIKE :type ORDER BY created DESC" )
				 .setParameter( "ch", chId )
				 .setParameter( "type", f )
				 .getResultList();
	}

	@SuppressWarnings("unchecked")
	public List<FileEntry>getFileEntries( Long chId ) {
		return producer.getEntityManager().createQuery( "FROM FileEntry WHERE ch.id = :ch ORDER BY created DESC" )
				 .setParameter( "ch", chId )
				 .getResultList();
	}

	/**
	 * Add file to assets
	 *
	 * @param file
	 * @return
	 */
	public FileEntry addFileEntry( FileEntry file ) {
		producer.getEntityManager().persist( file );
		return file;
	}

	/**
	 * Add file to assets
	 *
	 * @param name
	 * @param path
	 * @param chId
	 * @param userName
	 * @return
	 */
	public FileEntry addFileEntry( String name, String path, Long chId, String userName ) {
		return addFileEntry( name, path, "(uploaded)", chId, userName );
	}

	/**
	 * Add file to assets
	 *
	 * @param name
	 * @param path
	 * @param fromUrl
	 * @param chId
	 * @param userName
	 * @return
	 */
	public FileEntry addFileEntry( String name, String path, String fromUrl, Long chId, String userName ) {
		User user = userService.getUserByUserName( userName );
		return addFileEntry( "Retrieved from: " + fromUrl, name, path, chId, user, FileType.MISSION_SHARE );
	}

	/**
	 * Add file to assets
	 *
	 * @param desc
	 * @param name
	 * @param path
	 * @param chId
	 * @param user
	 * @param type
	 * @return
	 */
	public FileEntry addFileEntry( String desc, String name, String path, Long chId, User user, FileType type ) {
		FileEntry file = new FileEntry();
		file.setActive( true );
		Channel ch = new Channel();
		ch.setId( chId );
		file.setChID( ch );
		file.setName( name );
		file.setDescription( desc );
		file.setPath( path );
		file.setUser( user );
		file.setType( type );
		return addFileEntry( file );
	}

	/**
	 * Add file to assets
	 *
	 * @param json
	 * @param chId
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public FileEntry addFileEntry(String json, Long chId) {
		Map<String, Object> m;

		try {
			m = mapper.readValue(json, Map.class);
		} catch (Exception e) {
			throw new PersistenceException( "Can't parse json into useable map: " + e.getMessage() );
		}
		String name = (String)m.get( "name" );
		String path = (String)m.get("path");
		String userName = (String)m.get("user");

		return addFileEntry( name, path, chId, userName);
	}

	/**
	 * Delete a file
	 *
	 * @param json
	 * @return id of removed file or null if failed
	 * @throws PersistenceException
	 */
	@SuppressWarnings("unchecked")
	public Long remove(String json) throws PersistenceException {
		Map<String, Object> m;
		try {
			m = mapper.readValue(json, Map.class);
		} catch (Exception e) {
			throw new PersistenceException( "Can't parse json into useable map: " + e.getMessage() );
		}

		EntityManager em = producer.getEntityManager();

		Long id = new Long( (Integer)m.get( "id" ) );
		FileEntry file = em.find( FileEntry.class, id );
		if ( ! file.getType().equals( FileType.LINK ) ) {
			File fi = Paths.get( BASEPATH, file.getChID().getId().toString(), file.getName() ).toFile();
			if ( ! fi.delete() ) {
				return null;
			}
		}
	    em.remove( file );
		return file.getId();
	}

	/**
	 * Update a file attributes
	 *
	 * @param json
	 * @return
	 * @throws PersistenceException
	 */
	@SuppressWarnings("unchecked")
	public FileEntry update( String json ) throws PersistenceException {
		Map<String, Object> m;
		FileEntry file;

		try {
			m = mapper.readValue(json, Map.class);
		} catch (Exception e) {
			throw new PersistenceException( "Can't parse json into useable map: " + e.getMessage() );
		}

		//if the new value is for the "name" attribute, then need to rename file
		String name = (String)m.get("name");
		Long id = new Long( (Integer)m.get( "id" ) );

		// rename the file if the file name was changed
		if ( name != null ) {
			EntityManager em = producer.getEntityManager();
			file = em.find( FileEntry.class, id );
			Path p = Paths.get( BASEPATH, file.getChID().getId().toString(), file.getName() );

			try {
				Files.move( p, p.resolveSibling( name ), StandardCopyOption.REPLACE_EXISTING );
			} catch (IOException e) {
				throw new PersistenceException( e.getMessage() );
			}

			file.setName( name );

		} else {
			file = (FileEntry) updater.mapAndUpdate( FileEntry.class, json );
		}

		return file;
	}

	/**
	 * Write the given stream into assets, makes and returns a new FileEntry
	 *
	 * SIDE EFFECT: closes the input stream
	 *
	 * @param in
	 * @param fileName
	 * @param url
	 * @param chId
	 * @param user
	 * @return
	 * @throws PersistenceException
	 */
	public FileEntry writeNewAsset( InputStream in, String fileName, String url, Long chId, String user ) throws PersistenceException {
		Path path = Paths.get( configService.get( ConfigService.KEY_FILESHARE_PATH ), chId.toString(), fileName );
    	String fullp = writeNewAsset( path, in, fileName, chId );
    	return addFileEntry( fileName, fullp.substring( 0, fullp.length() - path.getFileName().toString().length() ), url, chId, user );
	}

	/**
	 * Write the given stream into assets, makes and returns a new FileEntry
	 *
	 * SIDE EFFECT: closes the input stream
	 *
	 * @param in
	 * @param fileName
	 * @param chId
	 * @param user
	 * @return
	 * @throws PersistenceException
	 */
	public FileEntry writeNewAsset( InputStream in, String fileName, Long chId, String user ) throws PersistenceException {
		Path path = Paths.get( configService.get( ConfigService.KEY_FILESHARE_PATH ), chId.toString(), fileName );
    	String fullp = writeNewAsset( path, in, fileName, chId );
    	return addFileEntry( fileName, fullp.substring( 0, fullp.length() - path.getFileName().toString().length() ), chId, user );
	}

	/**
	 * Write the given stream into assets, makes and returns a new FileEntry
	 *
	 * SIDE EFFECT: closes the input stream
	 *
	 * @param path
	 * @param in
	 * @param fileName
	 * @param chId
	 * @return
	 */
	public String writeNewAsset( Path path, InputStream in, String fileName, Long chId ) {
		BufferedInputStream bin = null;
    	BufferedOutputStream out = null;
    	try {
    		bin = new BufferedInputStream( in );
	    	out = new BufferedOutputStream( new FileOutputStream( path.toFile() ) );

			int read = 0;
			final byte[] bytes = new byte[1024];

			while (( read = bin.read(bytes) ) != -1) {
				out.write( bytes, 0, read );
			}

    	} catch ( Exception e ) {
    		throw new PersistenceException( "Failed to write file: " + fileName + "; reason: " + e.getMessage() );
    	} finally {
    		try {
	    		if ( bin != null ) {
	    			bin.close();
	    		}
	    		if ( in != null ) {
	    			in.close();
	    		}
	    		if ( out != null ) {
	    			out.close();
	    		}
    		} catch( Exception e ) {};
    	}
    	// remove file name since the link/path field is now just the path into the assets for the channel
    	return path.toString();
	}
}