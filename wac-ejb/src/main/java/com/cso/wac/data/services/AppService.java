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

import java.util.List;

import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.NoResultException;
import javax.persistence.Query;

import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.UpdateObjectMapper;
import com.cso.wac.data.domain.Channel;
import com.cso.wac.data.domain.Snapshot;
import com.cso.wac.data.domain.AppState;
import com.cso.wac.data.services.misc.UserService;
import com.cso.wac.exc.PersistenceException;
import com.cso.wac.web.WACSession;

/**
 * Service specific to runtime app states as maintained in the WACSession
 * ("live") channel state.  It is a cached state that may end up different
 * from the database-stored snapshot (which might then be stored into the
 * database into a distinct snapshot by the snapshotservice).
 *
 * Apps will access this service upon startup in order to get set into
 * their 'initial' state.
 *
 * Apps will access this service in order to push their current state into
 * the shared channel state.
 *
 * Keep in mind that this service accesses the singleton shared data
 * structure.
 *
 * @author rleuthner
 *
 */

@Stateless
public class AppService {
	@EJB
	private DataRepositoryProducer producer;

	@EJB
	private UpdateObjectMapper updateObjectMapper;

	@EJB
	private SnapshotService snapshotService;

	@EJB
	private UserService userService;

	@EJB
	private WACSession wacSession;

	@PostConstruct
	private void init() {
	}

	public AppService() {}

	/**
	 * Given an existing snapshot, add the given app to it.  App is assumed to not already exist in the snapshot.
	 *
	 * @param chId
	 * @param userName
	 * @param snapshotId
	 * @param desc
	 * @param wuid
	 * @param state
	 * @return
	 * @throws PersistenceException
	 */
	private AppState addAppStateToSnapshot( Long chId, String userName, Long snapshotId, String desc, String wuid, String state ) throws PersistenceException {
		AppState ws = new AppState();
		ws.setName( wuid );
		ws.setUser( userService.getUserByUserName( userName ) );
		ws.setDescription( desc );
		ws.setState( state );
		Channel mm = new Channel();
		mm.setId( chId );
		// end run around selecting the snapshot
		Snapshot ss = new Snapshot();
		ss.setId( snapshotId );
		ws.setSnapshot( ss );

		producer.getEntityManager().persist( ws );

		return ws;
	}

	/**
	 * Add or update the given snapshot/app with the string state.
	 * Since this state is expected to encompass the entirety (current) of the app state, the
	 * database message queue for the app is also cleared IFF there is a string state.
	 * If there is no string state, the messages are left alone (since they were originally copied
	 * over when the snapshot copy was created).
	 *
	 * The database will then contain the condensed representation for those apps in the snapshot
	 * who are currently instantiated by the originating user, while those not currently instantiated
	 * by that user will remain uncondensed.
	 *
	 * @see AppApi.updateState()
	 *
	 * @param chId
	 * @param userName
	 * @param snapshotId
	 * @param desc
	 * @param wuid
	 * @param state
	 * @return
	 * @throws PersistenceException
	 */
	public AppState updateAppState( Long chId, String userName, Long snapshotId, String wuid, String desc, String state ) throws PersistenceException {

		Query q = producer.getEntityManager().createQuery(
				"FROM AppState WHERE snapshot.id = :id AND name = :wuid" ).setParameter( "id", snapshotId ).setParameter( "wuid", wuid );

		AppState ws;
		try {
			ws = (AppState)q.getSingleResult();

			ws.setState( state );
			ws.getMessages().clear();

			// now also need to get rid of the collab messages for this guy
			// since the state string is assumed to encode the entirety of the
			// app state at snapshot
			wacSession.clearAppMessages( chId, wuid );

		} catch ( NoResultException e ) {
			ws = addAppStateToSnapshot( chId, userName, snapshotId, desc, wuid, state );

		} catch ( Exception e ) { // can be NonUniqueResultException or others
			throw new PersistenceException( e.getMessage() );
		}

		return ws;
	}

	/**
	 * Retrieve all of the states contained in a snapshot ordered by most recent first
	 *
	 * @param Long snapshot id
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public List<AppState>getTimeOrderedStates( Long snapshotId ) {
		return producer.getEntityManager().createQuery(
					"SELECT ws from AppStates w WHERE w.snapshot.id = :snapshotId AND ws.active = true ORDER BY created DESC"
				).setParameter( "snapshotId", snapshotId )
				.getResultList();
	}
}