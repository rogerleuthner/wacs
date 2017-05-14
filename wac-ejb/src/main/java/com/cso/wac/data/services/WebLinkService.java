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
import java.util.Map;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.Query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.UpdateObjectMapper;
import com.cso.wac.data.domain.FileEntry;
import com.cso.wac.data.domain.Channel;
import com.cso.wac.data.domain.types.Events;
import com.cso.wac.data.domain.types.FileType;
import com.cso.wac.data.services.misc.UserService;
import com.cso.wac.exc.PersistenceException;
import com.cso.wac.web.WACSession;

/**
 * Weblink Management
 *
 * @author rleuthner
 *
 */

@Stateless
public class WebLinkService {
	@EJB
	private DataRepositoryProducer producer;

	@EJB
	private UpdateObjectMapper updater;

	@EJB
	private UserService userService;

	@EJB
	private WACSession wacSession;

	private static ObjectMapper mapper = new ObjectMapper();

	public WebLinkService() {}

	public FileEntry getWebLink( Long weblinkId ) {
		Query q = producer.getEntityManager().createQuery( "FROM WebLink WHERE id = :id AND type = :type" );
		q.setParameter( "id", weblinkId ).setParameter( "type", FileType.LINK );
		return (FileEntry)q.getSingleResult();
	}

	@SuppressWarnings("unchecked")
	public Long create(String json) throws PersistenceException {
		FileEntry weblink = new FileEntry();
		Map<String, Object> m;

		try {
			m = mapper.readValue(json, Map.class);
		} catch (Exception e) {
			throw new PersistenceException( "Can't parse json into useable map: " + e.getMessage() );
		}

		weblink.setName( (String)m.get( "name" ) );
		weblink.setDescription( (String)m.get( "description" ) );
		weblink.setPath( (String)m.get( "path" ) );
		Channel ch = new Channel();
		ch.setId( Long.parseLong( (String)m.get( "chId" ) ) );
		weblink.setChID( ch );
		weblink.setUser( userService.getUserByUserName( (String)m.get( "user" ) ) );
		weblink.setType( FileType.LINK );

		producer.getEntityManager().persist(weblink);

		m.clear();
		m.put( "data", weblink.getJSON( ) );
		wacSession.sendToSubscribers( Events.FILE_ADD.getEvent(), m, weblink.getChID().getId() );

		return weblink.getId();
	}

	@SuppressWarnings("rawtypes")
	public Boolean remove(String json) throws PersistenceException {
		Map m;

		try {
			m = mapper.readValue(json, Map.class);
		} catch (Exception e) {
			throw new PersistenceException( "Can't parse json into useable map: " + e.getMessage() );
		}

	    remove( new Long( (Integer)m.get( "id" ) ) );
		return true;
	}

	public Boolean remove( Long id ) throws PersistenceException {
		EntityManager em = producer.getEntityManager();
		FileEntry weblink = em.find( FileEntry.class, id );
	    em.remove(weblink);
		return true;
	}

	/**
	 * Accept a map of the changed fields to update in the database.  Must include
	 * the ID and the lock (version) that the object started with.
	 *
	 * @param String json
	 * @return
	 * @throws PersistenceException
	 */
	public FileEntry update( String json ) throws PersistenceException {
		return (FileEntry) updater.mapAndUpdate( FileEntry.class, json );
	}
}
