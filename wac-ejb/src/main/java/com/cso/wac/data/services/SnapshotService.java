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

import java.sql.Date;
import java.util.List;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
import javax.persistence.Query;

import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.domain.Channel;
import com.cso.wac.data.domain.Snapshot;
import com.cso.wac.data.domain.TextMessage;
import com.cso.wac.data.domain.AppState;
import com.cso.wac.data.services.misc.UserService;
import com.cso.wac.web.WACSession;


/**
 * Snapshot - set of app states at a point in time
 *
 * @author rleuthner
 */

@Stateless
public class SnapshotService {

	// either config or otherwise share with front end
	// TODO currently set for NO LIMIT
	private static final int CHUNK_SIZE = 0;

	@EJB
	private DataRepositoryProducer producer;

	@EJB
	private UserService userService;

	@EJB
	private ChannelService channelService;

	@EJB
	private WACSession wacSession;

	public SnapshotService() {}

	/**
	 * Get last known shared state of the channel
	 *
	 * @return Snapshot or null if no shared state found
	 */
	// TODO this _could_ return more than one row which will be an error (single result) if two times cooincide exactly
	public Snapshot getLatestSnapshot( Long chId ) {
		try {
			return (Snapshot) producer.getEntityManager().createQuery(
					"FROM Snapshot s WHERE s.ch.id = :chId AND s.created = (SELECT MAX(s1.created) FROM Snapshot s1 WHERE s1.ch.id = :chId AND s1.active = true AND s1.type = com.cso.wac.data.domain.types.SnapshotType.GENERIC)" )
					.setParameter( "chId", chId ).getSingleResult();

		} catch( NoResultException none ) {
			return null; // there is no startup snapshot
		} // other exceptions should perc up, since they indicate inconsistent or unexpected data
	}

	/**
	 *
	 * @param chId
	 * @return
	 */
	public Snapshot createSnapshot( Long chId ) {
		Channel ch = new Channel();
		ch.setId( chId );
		Snapshot snapshot = new Snapshot();
		snapshot.setChID( ch );
		return snapshot;
	}

	/**
	 * Build a new snapshot
	 *
	 * @param chId
	 * @param user
	 * @param name
	 * @param desc
	 * @return
	 */
	public Snapshot createSnapshot( Long chId, String user, String name, String desc ) {
		Date d = new Date( System.currentTimeMillis() );
		Snapshot to = createSnapshot( chId );
		to.setDescription( desc );
		to.setName( name );
		to.setUser( userService.getUserByUserName( user ) );
		to.setCreated( d );
		producer.getEntityManager().persist( to );

		return to;
	}

	/**
	 * Delete snapshot if appstates if messages are successfully deleted.  Throws unchecked exceptions or the number of snapshots deleted.
	 *
	 * @param snapId
	 * @return
	 */
	public int delete( Long snapId ) {
		producer.getEntityManager()
			.createQuery( "DELETE TextMessage tm WHERE tm.appState.id IN (SELECT id FROM AppState ws WHERE ws.snapshot.id = :snapId)" )
			.setParameter( "snapId",  snapId ).executeUpdate();

		if ( producer.getEntityManager().createQuery( "DELETE AppState ws WHERE ws.snapshot.id = :snapId" ).setParameter( "snapId", snapId ).executeUpdate() >= 0 ) {
			return producer.getEntityManager().createQuery( "DELETE Snapshot s WHERE s.id = :snapId" ).setParameter( "snapId", snapId ).executeUpdate();
		}
		return 0;
	}

	/**
	 * Copy a channel snapshot.
		// This code was intended to create deep copy of a state so that a state might be
		// 'extended' in a sense from the current state, however in practice this causes a massive flurry of
		// database insert/delete statements (one for every message, which might number in the thousands for
		// annotation activity), so this is removed for performance reasons.

		// Thus, apps that were in a snapshot that the user restores but does not have running themselves
		// won't be saved into a new snapshot that they create.

		// When apps update themselves, they will create if necessary.
	 *
	 * This snapshot should then be updated and condensed from apps that the originating user has instantiated.
	 *
	 * @unused
	 *
	 * @param chId
	 * @param userName
	 * @param name
	 * @param desc
	 * @return
	 */
	public Snapshot copySnapshot( Snapshot from, Long chId, String user, String name, String desc ) {
		Date d = new Date( System.currentTimeMillis() );
		Snapshot to = createSnapshot( chId );
		to.setDescription( desc );
		to.setName( name );
		to.setUser( userService.getUserByUserName( user ) );
		to.setCreated( d );

		for( AppState fromws : from.getAppStates() ) {
			AppState tows = new AppState();
			// crude skipping of certain apps we want to ignore for persistence purposes at this time.
			// the controlpanel messages are only valid/useful for a live session, and they need to go away
			// when a channel is quiesced.
			// otherwise, when a channel is uncleanly abandoned but user has taken control of a app, then
			// the app will initialize with the 'taken control' message last, but that user may or may not
			// still be participating.
			// the effect is that controlpanel messages are never persisted in snapshots, which may/not be
			// desirable when doing a debrief, but for now eliminating it entirely removes a set of problems.
			if ( fromws.getName().startsWith( "usercontrolpanel" ) ) {
				continue;
			}
			tows.setCreated( d );
			tows.setName( fromws.getName() );
			tows.setDescription( fromws.getDescription() );
			tows.setSnapshot( to );
			tows.setState( fromws.getState() );
			tows.setUser( to.getUser() );
			producer.getEntityManager().persist( tows );

			// copy these over in case they are not overwritten by a app updating itself (e.g. not running for the user)
			// this is required so that annotated pictures and/or forms (e.g. instance apps) that have been used in a session
			// but are not necessarily showing at the current moment don't get their annos saved unless they are showing.
			// this is a huge performance hit since the app is the only one who knows how to condense their messages list,
			// and since the app is not showing we can't rely upon it to do that ... so they are completely uncondensed
			// messages, which might be thousands of them
			for ( TextMessage tm : fromws.getMessages() ) {
				TextMessage ntm = new TextMessage();
				ntm.setCreated( d );
				ntm.setText( tm.getText() );
				ntm.setAppState( tows );
				producer.getEntityManager().persist( ntm );
			}
		}

		producer.getEntityManager().persist( to );

		return to;
	}

	/**
	 * Retrieve a set of app states in a 'snapshot'
	 * forward (+) or backwards (-) in time depending upon sign of 'fromRow'.
	 *
	 * @param Channel chan
	 * @param User user
	 * @param Integer starting row fromRow (0 starts at row 1)
	 * @return List<Snapshot> ordered asc or desc as per sign of fromRow
	 */
	@SuppressWarnings("unchecked")
	public List<AppState>getStates( Long snapshotId ) {

		Query query = producer.getEntityManager()
				.createQuery( "FROM AppState WHERE snapshot.id = :snapshotId")
				.setParameter( "snapshotId", snapshotId );

		return query.getResultList();
	}

	public String getSingleState( Long snapshotId, String wuid ) {

		Query query = producer.getEntityManager()
				.createQuery( "FROM AppState WHERE snapshot.id = :snapshotId AND name = :wuid")
				.setParameter( "snapshotId", snapshotId )
				.setParameter( "wuid", wuid );

		AppState state;
		try {
			state = (AppState) query.getSingleResult();

// TODO should this be responsepkg with NO_CONTENT?
		} catch ( NonUniqueResultException e ) {
			return null;
		} catch ( NoResultException e ) {
			return null;
		}

		return state.getState();
	}

	/**
	 * Retrieve a set snapshots
	 * forward (+) or backwards (-) in time depending upon sign of 'fromRow' if from row != 0 (0 -> start at row 1)
	 *
	 * @param Channel chan
	 * @param User user
	 * @param Integer starting row fromRow (0 starts at row 1)
	 * @return List<Snapshot> ordered asc or desc as per sign of fromRow
	 */
	@SuppressWarnings("unchecked")
	public List<Snapshot>getSnapshots( Long chId, Integer fromRow ) {
		String order;
		if ( fromRow < 0 ) {
			order = " DESC ";
		} else {
			order = " ASC ";
		}

		Query query = producer.getEntityManager()
				.createQuery( "FROM Snapshot WHERE ch.id = :chId AND active = true AND type = com.cso.wac.data.domain.types.SnapshotType.GENERIC ORDER BY created " + order )
				.setParameter( "chId", chId );;

		query.setMaxResults( CHUNK_SIZE );
		query.setFirstResult( Math.abs( fromRow ) );
		return query.getResultList();
	}

	public Snapshot getSnapshot( Long snapId ) {
		Query query = producer.getEntityManager().createQuery( "FROM Snapshot WHERE id = :id" ).setParameter( "id", snapId );
		return (Snapshot)query.getSingleResult();
	}

	/**
	 * Get snapshots containing a[ny] app with appname
	 *
	 * @param Long chId
	 * @param String appName
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public List<Snapshot>getSnapshots( Long chId, String appName ) {

		Query query = producer.getEntityManager()
				.createQuery( "SELECT DISTINCT(s) FROM Snapshot s JOIN s.appStates w WHERE s.ch.id = :chId AND w.name = :appName AND s.active = true AND w.active = true" )
				.setParameter( "chId", chId )
				.setParameter( "appName", appName );

		return query.getResultList();
	}


	public Long getRowCount( Long chId ) {
		Query q = producer.getEntityManager().createQuery( "SELECT count(*) FROM Snapshot WHERE ch.id = :chId AND active = true AND type = com.cso.wac.data.domain.types.SnapshotType.GENERIC" )
				.setParameter( "chId", chId );
		try {
			return (Long)q.getSingleResult();
		} catch ( NoResultException none ) {
			return 0L;
		}
	}

}

