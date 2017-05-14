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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.Query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.UpdateObjectMapper;
import com.cso.wac.data.domain.Channel;
import com.cso.wac.exc.PersistenceException;

/**
 * Channel (Channel) management
 *
 * @author rleuthner
 *
 */

@Stateless
public class ChannelService {
	@EJB
	private DataRepositoryProducer producer;
	@EJB
	private UpdateObjectMapper updater;

	private static ObjectMapper mapper = new ObjectMapper();

	public ChannelService() {}

	@SuppressWarnings("unchecked")
	public List<Channel>getChannels() {
		return producer.getEntityManager().createQuery( "FROM Channel WHERE active = true" ).getResultList();
	}

	public Channel getChannel( Long chId ) {
		Query q = producer.getEntityManager().createQuery( "FROM Channel WHERE active = true AND id = :id" );
		q.setParameter( "id", chId );
		return (Channel)q.getSingleResult();
	}

	@SuppressWarnings("unchecked")
	public List<Object[]>getChannelNames() {
		return producer.getEntityManager().createQuery( "SELECT id, name FROM Channel WHERE active = true" ).getResultList();
	}

	public List<Map<String, String>>getChannelSummary() {
		List<Object[]> ml = getChannelNames();
		List<Map<String, String>> returnlist = new ArrayList<Map<String, String>>();

		for(Object[] o : ml)
		{
			Map<String,String> m = new HashMap<String,String>();
			m.put("id", o[0].toString());
			m.put("name", o[1].toString());

			returnlist.add(m);
		}

		return returnlist;
	}

	// TODO services should extend a base service that implements
	// corresponding ChannelApi method: public Response updateChannel( Channel chan ) {
	// would ask the resteasy to auto-decomp the object into our target type
	// TODO to use this and respect the optimistic locking, need to work with
	// fully attached entities as it is here now
	public Channel update( Channel chan ) throws PersistenceException {
		if ( chan.getId() == null ) {
			throw new PersistenceException( "Attempted to update Channel, but no Channel found with id: " + chan.getId() );
		}

		// TODO should this be merged??
		chan = producer.getEntityManager().merge( chan );

		return chan;
	}

	@SuppressWarnings("rawtypes")
	public Long create(String json) throws PersistenceException {
		Long chId;
		Channel channel = new Channel();
		Map m;

		try {
			m = mapper.readValue(json, Map.class);
		} catch (Exception e) {
			throw new PersistenceException( "Can't parse json into useable map: " + e.getMessage() );
		}

		channel.setName((String)m.get("name"));
		channel.setDescription((String)m.get("description"));

		producer.getEntityManager().persist(channel);

		chId = channel.getId();

		return chId;
	}



	/**
	 * Accept a map of the changed fields to update in the database.  Must include
	 * the ID and the lock (version) that the object started with.
	 *
	 * @param String json
	 * @return
	 * @throws PersistenceException
	 */
	public Channel update( String json ) throws PersistenceException {
		return (Channel) updater.mapAndUpdate( Channel.class, json );
	}
}
