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

package com.cso.wac.web;

import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import javax.annotation.PostConstruct;
import javax.ejb.ConcurrencyManagement;
import javax.ejb.ConcurrencyManagementType;
import javax.ejb.EJB;
import javax.ejb.Singleton;
import javax.ejb.Startup;
import javax.websocket.Session;

import org.apache.log4j.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.domain.Snapshot;
import com.cso.wac.data.domain.TextMessage;
import com.cso.wac.data.domain.AppState;
import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.data.domain.types.Events;
import com.cso.wac.data.services.ChannelService;
import com.cso.wac.data.services.SnapshotService;
import com.cso.wac.data.services.AppService;
import com.cso.wac.data.services.misc.EventNoticeService;
import com.cso.wac.exc.BadInitializationException;
import com.cso.wac.exc.FailedConvertException;
import com.cso.wac.exc.InternalException;

/**
 * Singleton implementation class WACSession.
 * <p/>
 *  Maintains a map of "Channels" that are being worked on, keyed with chId ('browser/jsessionid set/1...n")
 * <p/>
 * Each Channel contains a disconnected 'snapshot' which represents the set of collaborative apps in a channel,
 * each keyed with the generated app id with the description being the 'instance-specific' data (for example a file that
 * viewer is annotating).  The 'class' version of those collab apps is keyed with the app name while the description
 * has the '*' special string indicating it is representing the 'class' as opposed to an instance.  Each AppState may
 * contain a string 'state', and also a list of messages that are exchanged during the app collaboration/synchronization.
 * <p/>
 * Each Channel also maintains a set of USess (user sessions) keyed with the username.  Each USess contains a list of Session
 * (WSS) endpoints, one for each app connected to a WSS (which will be all users' apps, since all apps connect to the
 * Eventing WSS service).
 * <p/>
 *  Each Channel thus has 1..n users, which each have 1..n sessions - each of which are persistent.
 * <p/>
 *  Extreme care must be taken in this class to 1) ensure adequate performance, as there may be many users each with many sessions
 *  and 2) that deadlock situations are avoided, particularly with respect to things like logging, as this is a singleton
 *  A two-tiered strategy is used whereby container-managed locking manages the set of concurrent Channel's, while within the
 *  Channel sessions are managed by 'synchronized' on only the Channel being manipulated.
 * <p/>
 *  Synchronized methods are used on operations that must be atomic and that may span (individually synchronized)
 *  data structures.  ConcurrentHashMap is used on structures that only require atomic operations on a single data structure.
 * <p/>
 *  There is a 'special' Channel (id defined as DEFAULT_CH_ID) that means 'no ch selected', but it's treated
 *  exactly the same as a 'real' channel; it's just a default place to put a logged-in user that hasn't
 *  hooked up to a channel yet.
 * <p/>
 * Servlet lookup example:
 * <pre>
 * @Override
 * protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
 *     response.setContentType("text/event-stream");
 *     response.setCharacterEncoding("UTF-8");
 *
 *     WACSession session = (WACSession)request.getSession().getAttribute("WACSession");
 *     if ( session == null ) {
 *         InitialContext ctx;
 *         try {
 *             ctx = new InitialContext();
 *             session = (WACSession)ctx.lookup( "java:global/wac-ear/wac-ejb-0.0.1-SNAPSHOT/WACSession" );
 *             request.getSession().setAttribute( "WACSession", session );
 *         } catch (NamingException e) {
 *             e.printStackTrace();
 *         }
 *      }
 * }
 * </pre>
 *
 * TODO make sure user sessions catch the ConcurrentAccessTimeoutException that may be thrown by the @AccessTimeout
 *
 * example of scheduled message (removed with obsolete async contexts)
 * @Schedule(second="0,10,20,30,40,50", minute="*", hour="*", persistent=false)
 * public void heartbeat() {
 *	reapChIDs();
 * }
 *
 * @author rleuthner
 *
 */

/*
 * Other implementation notes
 *
 * The state string will be different from the collab state as it is the 'starting point' for mutation,
 * probably being slightly behind, as the collab state is a real-time evolution of the
 * state through the a set of messages, while this state string is a distillation of the
 * app state that is produced at intervals (might be automatic or manual).
 *
 * The long-term persisted entity is the state string.  In the persisted state, a state
 * string is associated with a snapshot (AppState).
 *
 * Some apps may not have a message/command list, e.g. those are not real-time
 * synchronized collaborative apps.  They still may have a state, the state is just not
 * built by a series of mutations (messages/commands).
 *
 * All apps that have a message/command/mutation language will have a message list.  If a snap
 * shot has been taken, those apps will also have a state string (at the instant the snapshot
 * is taken, the command list is cleared as it is assumed that the app state is entirely contained
 * by the state string).  At that point the non-collab app would be equivalent to a collab app
 * (e.g. entirely described by the state string).
 *
 * The effect is that the message/command list is distilled into a discrete state by the app
 * itself, and the backend/server does not have to know how that app produces or is instantiated
 * by the state string (that knowledge is solely encoded in the app itself).
 *
 * The distillation of a command/message list into a discrete state is for efficiency in
 * storing/restoring and also database persistence of the state.
 *
 * During the "distillation" process, the app message que is logically locked so that the
 * message/command state does not change while the state distillation is in progress; thus, even
 * if a client is still producing state mutating messages, those messages while not being included
 * in the distillation are not lost (e.g. the message list is only cleared to the point at which
 * the snapshot was initiated).
 *
 * Restoring the app state (e.g. late joiners, refreshers, etc.) need to:
 * 0) start holding incoming messages
 * 1) get messages list
 * 2) getState and apply that state locally
 * 3) if any messages recieved from step (0), apply them
 * 4) stop holding incoming messages
 * There is the possibility that commands are received during this process; it is incumbent upon
 * the app to 'hold' those messages until these three steps are completed, which will minimize (not eliminate) the
 * possibility of corruption.
 *
 * Assumptions:
 * Events which initiate state save/restore are not part of the message queu (e.g. they are OOB messages)
 * (this assumption is fulfilled by use of the eventing facility for the save/restore messaging).
 * Client corruption is not a catastrophic event (e.g. refresh will reset).
 *
 * @author rleuthner
 *
 */
@Startup
@Singleton
@ConcurrencyManagement( ConcurrencyManagementType.BEAN )
public class WACSession {
	public static final String EVENTS = "events";
	private static ObjectMapper mapper = new ObjectMapper();
	private final Map<Long, Channel>channels = new ConcurrentHashMap<Long,Channel>();

	@EJB
	private SnapshotService snapshotService;

	@EJB
	private AppService appService;

	@EJB
	private ChannelService channelService;

	@EJB
	private EventNoticeService eventService;

	@PostConstruct
	void init() {
	}

	/**
	 * Add a new app context (EventEndpoint) to the indicated user/channel.  If none of
	 * those exist, they are all created.
	 *
	 * Emit event that a user has logged in.
	 *
	 * @param chId
	 * @param userId
	 * @param actx
	 */
	public void addSession( Long chId, String userId, Session s ) {

		// these two concurrent hashmaps are synchronized so that they don't get duplicate entries;
		// the data structures themselves don't need it, but between the check for content and the
		// insert of content there otherwise would be the possibility for multiple threads doing the
		// same insert/put at the same time

		synchronized( channels ) {
			if ( ! channels.containsKey( chId ) ) {
				channels.put( chId, new Channel( chId ) );
			}
		}

		Channel m = channels.get( chId );

		synchronized( m.users ) {
			if ( ! m.users.containsKey( userId ) ) {
				m.addUser( userId );
				eventService.createNoticeAsync( "User login", Events.USER_LOGIN.getEvent(), EventSeverity.NORMAL, chId, userId );
			}
		}

		m.getUser( userId ).apps.add( s );
	}

	/**
	 * Remove user who is no longer participating in a channel.  Will remove the executing channel from the 'live' set if
	 * this is the last session being removed.
	 * Send async event notice signalling the logout.
	 *
	 * @param chId
	 * @param userId
	 * @param s
	 * @param reason
	 */
	public void removeSession( Long chId, String userId, Session s, String reason ) {
		Channel m = channels.get( chId );
		Map<String,USess> uss = m.users;
		if ( uss != null ) {
			for( Map.Entry<String,USess>us : uss.entrySet() ) {
				if ( us.getValue().apps.contains( s ) ) {
					us.getValue().apps.remove( s );
					// if no more async contexts, user has completely logged out
					if ( us.getValue().apps.size() == 0 ) {
						eventService.createNoticeAsync( reason, Events.USER_LOGOUT.getEvent(), EventSeverity.NORMAL, chId, us.getKey() );
						if ( uss.remove( us.getKey() ) != null ) {
							Logger.getLogger( WACSession.class ).info( "REMOVE USER: " + reason );
						}

						if (m.users.isEmpty() ) {
							if ( channels.remove( chId ) != null ) {
								Logger.getLogger( WACSession.class ).info( "Delete unused channel: " + chId );
								// merely returns null if this is already gone
							}
						}
					}
					return; // removing only a single matching one
				}
			}
		}
		Logger.getLogger( WACSession.class ).info( "REMOVE SESSION: " + userId );
	}

	/**
	 * List all users currently logged in to a given channel.  Note that if using standalone
	 * you must ensure there are channels running or there will be an NPE
	 *
	 * @param chId
	 * @return
	 */
	public List<String>listUsers( Long chId ) {
		try {
			ArrayList<String>al = new ArrayList<String>();
			Map<String,USess>uss = channels.get( chId ).users;

			for( String userId : uss.keySet() ) {
				al.add( userId );
			}
			return al;
		} catch( NullPointerException e ) {
			throw new InternalException( "No channel found" );
		}
	}

	/**
	 * List currently executing (has users logged in) channel.
	 *
	 * @return
	 */
	public List<Long>listChannels() {
		ArrayList<Long>al = new ArrayList<Long>();
		for( Long chan : channels.keySet() ) {
			al.add( chan );
		}
		return al;
	}

	/**
	 * Get the channel state (head snapshot)
	 *
	 * @param chId
	 * @return
	 */
	public Snapshot getChannelHead( Long chId ) {
		return channels.get( chId ).head;
	}

	/**
	 * Set the head snapshot to that given.
	 * Remove all users except for that passed in.
	 *
	 * @param snapId
	 * @param user
	 * @return
	 */
	public Snapshot setChannelHead( Long snapId, String user ) {
		Snapshot snapshot = snapshotService.getSnapshot( snapId );
		Channel m = channels.get( snapshot.getChID().getId() );
		m.setHead( snapshot, user );
		return snapshot;
	}

	/**
	 * Async send named event to all session/apps that have subscribed to this event type.
	 *
	 * This is the usual entry point to sending events to subscribers.
	 *
	 * Code is external to USess object as it is shared from another module (wac-ws/../EventEndpoint.java),
	 * as the code to emit events needs to be available to internal components (e.g. for sending events
	 * from server code), yet also available from the front end javascript (through the WSApi events
	 * mechanism).
	 *
	 * @param String event
	 * @param String data
	 * @param Session s
	 * @return Future object
	 *
	 * TODO could check validity of the event as part of the Events.java enum ...
	 * TODO can return list of Future<Void> if we need to keep track of that
	 */
	public final void sendToSubscribers( String event, String data, List<Session>sessions ) {
    	for( Session s : sessions ) {
			@SuppressWarnings("unchecked")
			final List<String> subscribedEvents = (List<String>)s.getUserProperties().get( EVENTS );
// TODO event is contained within the data, so passing as a parameter is redundant
			if ( subscribedEvents != null && subscribedEvents.contains( event ) && s.isOpen() ) {
				send( data, s );
			}
    	}
    	return;
	}

	/**
	 * Convert map into a JSON string and send to all channel apps owned by user - subscription is not required, it is sent
	 * to all that users' apps.  This is the mandatory STATESAVE event
	 *
	 * @param String user
	 * @param Long chId
	 * @param message (JSON?)
	 */
	public void sendToUsersApps( String user, Long chId, String message ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			for( Map.Entry<String, USess>e : m.users.entrySet() ) {
				if ( e.getKey().equals( user ) ) {
					send( message, e.getValue().apps );
				}
			}
		}
	}

	/**
	 * Convert map into a JSON string and send to all channel apps.
	 *
	 * @param Long chId
	 * @param message (JSON?)
	 */
	public void sendToAllApps( Long chId, String message ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			for( Map.Entry<String, USess>e : m.users.entrySet() ) {
				send( message, e.getValue().apps );
			}
		}
	}

	/**
	 * Convert map into a JSON string and send to all channel apps subscribed to event
	 *
	 * @param event
	 * @param map
	 * @param chId
	 */
	public void sendToSubscribers( String event, Map<String,Object>map, Long chId ) {
		map.put( "event", event ); // jam in event for those who need to discriminate between different events
		sendToSubscribers( event, toJson( map ), chId );
	}

	/*
	 * Send a message to a set of sessions
	 */
	private final void send( String data, Set<Session>sessions ) {
		for( Session s : sessions ) {
			send( data, s );
		}
	}

	/*
	 * Asynchronous send of message data to session
	 */
	private final void send( String data, Session s ) {
		if ( s.isOpen() ) {
			try {
				s.getAsyncRemote().sendText( data );
			} catch ( Exception e ) {
				// catch so we don't fail on the remaining list entries if the session
				// disappears/gets fubared between getting the list and doing the actual write
				Logger.getLogger( WACSession.class ).info( "Exception writing to async socket: " + e.getMessage() );
			}
		}
	}

	/*
	 * Send string data to all subscribed apps in the given channel
	 */
	private final void sendToSubscribers( String event, String data, Long chId ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			Map<String,USess>uss = m.users;
			if ( uss != null && ! uss.isEmpty() ) {
				for( Map.Entry<String, USess> entry : uss.entrySet() ) {
					sendToSubscribers( event, data, new ArrayList<Session>( entry.getValue().apps ) );
				}
			}
		}
	}

	/**
	 * Add app message for this collab app instance.
	 *
	 * @param chId
	 * @param wuid
	 * @param message
	 */
	public void addAppMessage( Long chId, String wuid, String message ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			m.addMessage( wuid, message );
		} else {
			Logger.getLogger( WACSession.class ).info( "Channel: " + chId + " not active, ignoring message: " + message + " for app: " + wuid );
		}
	}

	/**
	 * Clear all collab messages from a app
	 *
	 * @param chId
	 * @param wuid
	 */
	public void clearAppMessages( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			m.clearMessages( wuid );
		} else {
			Logger.getLogger( WACSession.class ).info( "Channel: " + chId + " not active, ignoring clear messages for app: " + wuid );
		}
	}

	/**
	 * Get all a apps collab messages at a point in time.  Possibly an inconsistent list.
	 *
	 * @param chId
	 * @param wuid
	 * @return
	 */
	public List<String>getAppMessages( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.getMessages( wuid );
		} else {
			return new ArrayList<String>();
		}
	}

	/**
	 * Get last known collab message for a app at a point in time.
	 *
	 * @param chId
	 * @param wuid
	 * @return
	 */
	public String getLatestMessage( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.getLatestMessage( wuid );
		} else {
			return "";
		}
	}

	/**
	 * Get list of running instances of a particular app class.  List might be inconsistent.
	 *
	 * @param chId
	 * @param name
	 * @return
	 */
	public String[] getInstances( Long chId, String name ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.listInstances( name );
		} else {
			return new String[] {};
		}
	}

	/**
	 * Add app, return the wuid; builds data structs as necessary
	 *
	 * @param name
	 * @param desc
	 * @return
	 */
	public String addApp( Long chId, String name, String desc ) throws BadInitializationException {
		if ( ! channels.containsKey( chId ) ) {
			throw new BadInitializationException( "Channel not initialized: Can't add apps until channel is initialized" );
		}
		return channels.get( chId ).addApp( name, desc );
	}

//	 /**
//	  * Push string state onto the state cache, ignoring and clearing mutation/messages as they are assumed to already be
//	  * incorporated into the app state string being pushed.
//	  *
//	  * @param chId
//	  * @param wuid
//	  * @param state
//	  * @throws PersistenceException
//	  */
//	public void pushAppState( Long chId, String wuid, String state ) throws PersistenceException {
//		Channel m = channels.get( chId );
//		if ( m != null ) {
//			m.pushState( wuid, state );
//			m.clearMessages( wuid );
//		} else {
//			Logger.getLogger( WACSession.class ).info( "Channel: " + chId + " not active, can't persist app: " + wuid );
//			return;
//		}
//	}

	/**
	 * Get app instances static state
	 *
	 * @param chId
	 * @param wuid
	 * @return
	 */
	public String getAppStaticState( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		String state = null;
		if ( m != null ) {
			state = m.getState( wuid );
		}

		return state;
	}

	private String toJson( Map<String, Object>map ) throws FailedConvertException {
		try {
			StringWriter s = new StringWriter();
			mapper.writeValue( s, map );
			return s.toString();
		} catch ( Exception e ) {
			throw new FailedConvertException( e.getMessage() );
		}
	}

	/**
	 * Get the channel current snapshot.
	 *
	 * @param chId
	 * @return
	 */
	public Snapshot getHead( Long chId ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.getHead();
		}
		return null;
	}


	/*
	 * Model of an executing channel, it's apps with their collab state and the users logged in to the channel.
	 */
	final class Channel {
		/*
		 * This entity is treated in a completely detached fashion, except for read-in upon startup and save of a copy (snapshot).
		 * All of the operations on this data structure need to be conducted ouside of a service (transaction).
		 * It should not be updated except for the addition of app instances and messages to contained apps.
		 * To save changes, a 'new' snapshot should be created from it.
		 */
		private Snapshot head;

		/*
		 * Set of executing user contexts keyed by user name.  Contains a set of EventEndpoints,
		 * one for each app originating from that user.
		 */
		private final ConcurrentHashMap<String, USess>users;

		Channel( Long chId ) {
			// get most current shared state as the snapshot, or start with new, blank one
			head = snapshotService.getLatestSnapshot( chId );
			if ( head == null ) {
				head = snapshotService.createSnapshot( chId );
			}
			users = new ConcurrentHashMap<String, USess>();
		}

		public Snapshot getHead() {
			return head;
		}

		void setHead( Snapshot snapshot, String user ) {
			// remove all but ourselves
			for( Iterator<String> it = users.keySet().iterator(); it.hasNext(); ) {
				String u = it.next();
				if ( ! u.equals( user ) ) {
					users.remove( u );
				}
			}

			head = snapshot;
		}

//		boolean pushState( String wuid, String state ) throws PersistenceException {
//			AppState ws = head.getAppState( wuid );
//
//			if ( ws != null ) {
//				ws.setState( state );
//				return true;
//			}
//
//			return false;
//		}

		USess addUser( String userId ) {
			return users.put( userId, new USess() );
		}

		USess getUser( String userId ) {
			return users.get( userId );
		}

		String addApp( String name, String desc ) {
			AppState ws = head.getAppState( AppUtil.getAppId( name, desc ) );
			if ( ws == null ) {
				ws = head.addApp( name, desc );
			}

			return AppUtil.getAppId( name, desc );
		}

		// NOTE this is not really threadsafe, but this list is never deleted from, and read rarely where
		// errors reading are not catastrophic
		void addMessage( String wuid, String message ) {
			AppState ws = head.getAppState( wuid );
			if ( ws != null ) {
				ws.addMessage( message );
			} else {
				Logger.getLogger( WACSession.class ).info( "App: " + wuid + " not in 'head' to add message: " + message );
			}
		}

		void clearMessages( String wuid ) {
			AppState ws = head.getAppState( wuid );
			if ( ws != null ) {
				ws.getMessages().clear();
			}
		}

		List<String>getMessages( String wuid ) {
			List<String>ms = new ArrayList<String>();

			AppState ws = head.getAppState( wuid );
			if ( ws != null ) {
				for( TextMessage tm : ws.getMessages() ) {
					ms.add( tm.getText() );
				}
			}
			return ms;
		}

		String getLatestMessage( String wuid ) {
			List<String>ms = getMessages( wuid );
			if ( ms.size() > 0 ) {
				return ms.get( ms.size() );
			}
			return "";
		}

		String getState( String wuid ) {

			AppState ws = head.getAppState( wuid );
			if ( ws != null ) {
				return ws.getState();
			}
			return null;
		}

		/**
		 * Get full instance ID list of all running app class 'name' instances
		 *
		 * @param name
		 * @return
		 */
		String[] listInstances( String name ) {
			List<String>instances = new ArrayList<String>();
			for( AppState ws : head.getAppStates() ) {
				// 'class' app entries are identified by the 'WILD' character in description
				if ( ! ws.getDescription().equals( String.valueOf( AppUtil.WILD ) ) && AppUtil.getAppName( ws.getName() ).equals( name ) ) {
					instances.add( ws.getDescription() );
				}
			}
			return instances.toArray( new String[ instances.size() ]);
		}
	}

	/*
	 * Model a user context, including a list of their app set.
	 *
	 * This set may span devices, browsers and/or portals (e.g. it does no necessarily correspond to an OWF session).
	 */
	private final class USess {
		final Set<Session>apps;

		USess() {
			// get a fast robust synchronized map in a convoluted fashion
			apps = Collections.newSetFromMap( new ConcurrentHashMap<Session,Boolean>() );
		}
	}
}
