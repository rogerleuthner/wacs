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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ejb.Asynchronous;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.Query;

import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.domain.EventNotice;
import com.cso.wac.data.domain.Channel;
import com.cso.wac.data.domain.User;
import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.web.WACSession;

@Stateless
public class EventNoticeService {

	@EJB
	private DataRepositoryProducer producer;

	@EJB
	private UserService userService;

	@EJB
	private WACSession wacSession;

	public EventNoticeService() {}

	@SuppressWarnings("unchecked")
	public List<EventNotice>getEventNotices( Long chId, boolean published ) {
		 return producer.getEntityManager().createQuery( "FROM EventNotice WHERE published = :published AND ch.id = :ch ORDER BY created ASC" )
				 .setParameter( "published", published )
				 .setParameter( "ch", chId )
				 .getResultList();
	}

	// this method is identical to the above method, but does not distinguish between published and unpublished events
	// suppress cast check, since the compiler cannot know this will succeed.
	@SuppressWarnings("unchecked")
	public List<EventNotice>getAllEventNotices(long chId) {
		return producer.getEntityManager().createQuery("FROM EventNotice WHERE ch.id = :ch ORDER BY created DESC")
				.setParameter("ch",  chId).getResultList();
	}

	// this method is identical to the above method, but does not distinguish between published and unpublished events
	// suppress cast check, since the compiler cannot know this will succeed.
	@SuppressWarnings("unchecked")
	public List<EventNotice>getEventNotices( long chId, int startpage, int pagesize ) {
		Query q =  producer.getEntityManager().createQuery( "FROM EventNotice WHERE ch.id = :ch ORDER BY created DESC" )
				.setParameter( "ch",  chId );

		q.setMaxResults( pagesize );
		q.setFirstResult( (startpage-1)*pagesize );

		return q.getResultList();
	}

	// This method counts the available event notices, without actually pulling the list from the database
	public Long getNumEvents(long chId) {
		Query q = producer.getEntityManager().createQuery("SELECT COUNT(e) FROM EventNotice e WHERE ch.id = :ch").setParameter( "ch", chId);
		return (Long)q.getSingleResult();
	}

	//(id, active, description, name, published, severity, ch_id, user_id, created ) values (1002, 'true', 'Test Event 1', 'TE1', 'true', 0, 1001, 1000, LOCALTIMESTAMP);
	private  void createNotice( EventNotice notice ) {
		Map<String, Object> m = new HashMap<String,Object>();
		m.put( "op", notice.getName() ); // name contains opcode and/or name
		m.put( "name", notice.getName() );
		m.put( "desc", notice.getDescription() );
		m.put( "user", notice.getUser().getFormattedName() );
		createNotice( notice, m );
	}

	private void createNotice( EventNotice notice, Map<String, Object>m ) {
		producer.getEntityManager().persist( notice );
		wacSession.sendToSubscribers( notice.getName(), m, notice.getChID().getId() );
	}

	public void markNoticePublished( Long noticeId ) {
		EventNotice notice = new EventNotice();
		notice.setId( noticeId );
		markNoticePublished( notice );
	}

	public void markNoticePublished( EventNotice notice ) {
		notice.setPublished( true );
		producer.getEntityManager().merge( notice );
	}

	public void createNotice( String desc, String name, EventSeverity severity, Long chId, String user ) {
		User u = userService.getUserByUserName( user );
		createNotice( desc, name, severity, chId, u );
	}

	/**
	 * Created async version since this call is invoked by the singleton
	 *
	 * @param desc
	 * @param name
	 * @param severity
	 * @param chId
	 * @param user
	 */
	@Asynchronous
	public void createNoticeAsync( String desc, String name, EventSeverity severity, Long chId, String user ) {
		User u = userService.getUserByUserName( user );
		createNotice( desc, name, severity, chId, u );
	}

	public void createNotice( String desc, String name, EventSeverity severity, Long chId, User user ) {
		EventNotice notice = new EventNotice();
		notice.setActive( true );
		Channel ch = new Channel();
		ch.setId( chId );
		notice.setChID( ch );
		notice.setName( name );
		notice.setDescription( desc );
		notice.setSeverity( severity );
		notice.setUser( user );

		createNotice( notice );
	}
}