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

package com.tf.wac.web;

import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
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
import com.tf.wac.data.domain.Snapshot;
import com.tf.wac.data.domain.AppState;
import com.tf.wac.data.domain.types.EventSeverity;
import com.tf.wac.data.domain.types.Events;
import com.tf.wac.data.services.ChannelService;
import com.tf.wac.data.services.SnapshotService;
import com.tf.wac.data.services.misc.EventNoticeService;
import com.tf.wac.exc.BadInitializationException;
import com.tf.wac.exc.FailedConvertException;
import com.tf.wac.exc.InternalException;
import com.tf.wac.exc.PersistenceException;

/**
 * Singleton implementation class XWACSession.
 * <p/>
 *  Maintains a map of "Channels" that are being worked on, keyed with chId ('browser/jsessionid set/1...n")
 * <p/>
 * Each Channel maintains a WACApp (which is the 'shared state' of the channel widgets).
 * <p/>
 * Each Channel maintains a set of USess (user sessions) keyed with the username.
 * <p/>
 * Each USess contains a list of Session (WSS) endpoints, one for each widget connected to a WSS (which will be all users' widgets, since
 * all widgets connect to the Eventing WSS service).
 *
 * <p/>
 *  Each Channel thus has 1..n users, which each have 1..n sessions - each of which are persistent.
 * <p/>
 *  Extreme care must be taken in this class to 1) ensure adequate performance, as there may be many users each with many sessions
 *  and 2) that deadlock situations are avoided, particularly with respect to things like logging, as this is a singleton
 *  A two-tiered strategy is used whereby container-managed locking manages the set of concurrent ChID's, while within the
 *  ChID sessions are managed by 'synchronized' on only the ChID being manipulated.
 * <p/>
 *  EJB LOCK methods are used on operations that must be atomic and that may span (individually synchronized)
 *  data structures.  ConcurrentHashMap is used on structures that only require atomic operations on a single data structure.
 * <p/>
 *  There is a 'special' ChID (id defined as DEFAULT_CHAN_ID) that means 'no ch selected', but it's treated
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
 *     XWACSession session = (XWACSession)request.getSession().getAttribute("XWACSession");
 *     if ( session == null ) {
 *         InitialContext ctx;
 *         try {
 *             ctx = new InitialContext();
 *             session = (XWACSession)ctx.lookup( "java:global/wac-ear/wac-ejb-0.0.1-SNAPSHOT/XWACSession" );
 *             request.getSession().setAttribute( "XWACSession", session );
 *         } catch (NamingException e) {
 *             e.printStackTrace();
 *         }
 *      }
 * }
 * </pre>
 *
 * TODO add more user info here; e.g. detached User object in USess ?
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

@Startup
@Singleton
@ConcurrencyManagement( ConcurrencyManagementType.BEAN )
public class XWACSession {
	public static final String EVENTS = "events";
	private static ObjectMapper mapper = new ObjectMapper();
	private final Map<Long, Channel>channels = new ConcurrentHashMap<Long,Channel>();

	@EJB
	private SnapshotService snapshotService;

	@EJB
	private ChannelService channelService;

	@EJB
	private EventNoticeService eventService;

	@PostConstruct
	void init() {
	}

	/**
	 * Add a new widget context (EventEndpoint) to the indicated user/channel.  If none of
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

		m.getUser( userId ).widgets.add( s );
	}

	public void removeSession( Long chId, String userId, Session s, String reason ) {
		Channel m = channels.get( chId );
		Map<String,USess> uss = m.users;
		if ( uss != null ) {
			for( Map.Entry<String,USess>us : uss.entrySet() ) {
				if ( us.getValue().widgets.contains( s ) ) {
					us.getValue().widgets.remove( s );
					// if no more async contexts, user has completely logged out
					if ( us.getValue().widgets.size() == 0 ) {
						eventService.createNoticeAsync( reason, Events.USER_LOGOUT.getEvent(), EventSeverity.NORMAL, chId, us.getKey() );
						if ( uss.remove( us.getKey() ) != null ) {
							Logger.getLogger( XWACSession.class ).info( "REMOVE USER: " + reason );
						}

						if (m.users.isEmpty() ) {
// what I really want here is
// to create a new head and then add the collabstate widget contents to that

		//					snapshotService.saveHead( chId/* chId, userId, "Autosave", "Channel autosave at all participants logout" */);

							if ( channels.remove( chId ) != null ) {
								Logger.getLogger( XWACSession.class ).info( "Delete unused channel: " + chId );
								// merely returns null if this is already gone
							}
						}
					}

					return; // removing only a single matching one
				}
			}
		}
		Logger.getLogger( XWACSession.class ).info( "REMOVE SESSION: " + userId );
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

	public Snapshot getChannelHead( Long chId ) {
		return channels.get( chId ).snapshot;
	}

	/**
	 * Logs out every user except for originating user.
	 * Set the head snapshot to that given.
	 *
	 * @param snapId
	 * @param user
	 * @return
	 */
	public Snapshot setChannelHead( Long snapId, String user ) {
		Snapshot s = snapshotService.getSnapshot( snapId );
		Channel m = channels.get( s.getChID().getId() );
		m.setSnap( s, user );
		return s;
	}

	/**
	 * Async send named event to all session/widgets that have subscribed to this event type.
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
	 * Convert map into a JSON string and send to all channel widgets owned by user - subscription is not required, it is sent
	 * to all that users' widgets.  This is the mandatory STATESAVE event
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
					send( message, e.getValue().widgets );
				}
			}
		}
	}

	/**
	 * Convert map into a JSON string and send to all channel widgets.
	 *
	 * @param Long chId
	 * @param message (JSON?)
	 */
	public void sendToAllApps( Long chId, String message ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			for( Map.Entry<String, USess>e : m.users.entrySet() ) {
				send( message, e.getValue().widgets );
			}
		}
	}

	/**
	 * Convert map into a JSON string and send to all channel widgets subscribed to event
	 *
	 * @param event
	 * @param map
	 * @param chId
	 */
	public void sendToSubscribers( String event, Map<String,Object>map, Long chId ) {
		sendToSubscribers( event, toJson( map ), chId );
	}

	private final void send( String data, Set<Session>sessions ) {
		for( Session s : sessions ) {
			send( data, s );
		}
	}

	private final void send( String data, Session s ) {
		if ( s.isOpen() ) {
			try {
				s.getAsyncRemote().sendText( data );
			} catch ( Exception e ) {
				// catch so we don't fail on the remaining list entries if the session
				// disappears/gets fubared between getting the list and doing the actual write
				Logger.getLogger( XWACSession.class ).info( "Exception writing to async socket: " + e.getMessage() );
			}
		}
	}

	/*
	 * Send string data to all subscribed widgets in the given channel
	 */
	private final void sendToSubscribers( String event, String data, Long chId ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			Map<String,USess>uss = m.users;
			if ( uss != null && ! uss.isEmpty() ) {
				for( Map.Entry<String, USess> entry : uss.entrySet() ) {
					sendToSubscribers( event, data, new ArrayList<Session>( entry.getValue().widgets ) );
				}
			}
		}
	}

	/**
	 * Add widget message for this collab widget instance.
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
			Logger.getLogger( XWACSession.class ).info( "Channel: " + chId + " not active, ignoring message: " + message + " for widget: " + wuid );
		}
	}

	public void clearAppMessages( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			m.clearMessages( wuid );
		} else {
			Logger.getLogger( XWACSession.class ).info( "Channel: " + chId + " not active, ignoring clear messages for widget: " + wuid );
		}
	}

	// this could possibly retrieve an inconsistent list, so don't use it for critical operations
	public List<String>getAppMessages( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.getMessages( wuid );
		} else {
			return new ArrayList<String>();
		}
	}

	public String getLatestMessage( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.getLatestMessage( wuid );
		} else {
			return "";
		}
	}

	// this could possibly retrieve an inconsistent list, so don't use it for critical operations
	// TODO doc these methods!
	public Map<String,String>getInstances( Long chId, String name ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.listInstances( name );
		} else {
			return new HashMap<String,String>();
		}
	}

	public String addApp( Long chId, String widgetName, String desc ) throws BadInitializationException {
		if ( ! channels.containsKey( chId ) ) {
			throw new BadInitializationException( "Channel not initialized: Can't add widgets until channel is initialized" );
		}
		return channels.get( chId ).addApp( widgetName, desc );
	}

	/**
	 * Take a widget state string and replace the message list and state string with this new state.
	 * As part of that process, as soon as the state is saved into the state string the message list is
	 * cleared (as it is assumed that the state string at the instant encompasses all of the widget state
	 * mutation messages/commands).
	 *
	 * @param chId
	 * @param wuid
	 * @param state
	 * @throws PersistenceException
	 */
	public void pushAppState( Long chId, String wuid, String state ) throws PersistenceException {
		Channel m = channels.get( chId );
		if ( m != null ) {
			m.pushState( wuid, state );
		} else {
			Logger.getLogger( XWACSession.class ).info( "Channel: " + chId + " not active, can't persist widget: " + wuid );
			return;
		}
	}

	public String getAppCollabState( Long chId, String wuid ) {
		Channel m = channels.get( chId );
		String state = null;
		if ( m != null ) {
			state = m.getState( wuid );
		}

		return state;
	}

	public Map<String,List<String>>getCollabAppMessages( Long chId ) {
		Channel m = channels.get( chId );

		if ( m != null ) {
			return m.getCollabAppsMessages();
		}

		return null;
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
	 * At channel init, find the lastest state from the database and init into the 'current snapshot'.
	 * Users who log in to the channel will get a copy of it to initialize themselves with (they may or
	 * may not have widgets showing who will receive any of the state).
	 *
	 * As collaboration widgets are added to the channel, they are added to the list of current
	 * collaboration widgets (collabApps).  This is transient collaboration state containing a list
	 * of the messages exchanged during the collaboration session.
	 *
	 * Save of the snapshot will cause the 'collabApps' to be integrated into the Snapshot, and
	 * a new snapshot generated.
	 *
	 * @author rleuthner
	 *
	 */

	public Snapshot getHead( Long chId ) {
		Channel m = channels.get( chId );
		if ( m != null ) {
			return m.getHead();
		}
		return null;
	}

	public void refreshHead( Long chId ) {
		Channel m = channels.get( chId );
		m.refreshHead( chId );
	}

	final class Channel {
		/**
		 * Current 'snapshot'; at startup contains widgetstate instances from the most recent snapshot of
		 * the channel.
		 */
		private Snapshot snapshot;
		/**
		 * Executing collaborative widget instances.
		 * May contain list of messages exchanged during the collaboration session.
		 *
		 * Note that the same base widget may have multiple entries that have different
		 * id's (e.g. checklist widget with different checklist content).  In this case
		 * the widget 'name' part is shared, while the 'id' part is derived from the content
		 * thus allowing the multiple checklist collaboration sessions to proceed independently
		 * from each other.
		 *
		 * Keyed with the generated id:
		 * @see AppUtil.java
		 */
		private final ConcurrentHashMap<String,CollabApp>collabApps;
		/**
		 * Set of executing user contexts keyed by user name.  Contains a set of EventEndpoints,
		 * one for each widget originating from that user.
		 */
		private final ConcurrentHashMap<String, USess>users;

		Channel( Long chId ) {
			// get most current shared state as the snapshot
			snapshot = snapshotService.getLatestSnapshot( chId );
			users = new ConcurrentHashMap<String, USess>();
			// 'live' collaboration state
			collabApps = new ConcurrentHashMap<String,CollabApp>();
		}

		public Snapshot getHead() {
			return snapshot;
		}
		void refreshHead( Long chId ) {
			snapshot = snapshotService.getLatestSnapshot( chId );
		}
		void setSnap( Snapshot s, String user ) {
			// remove all but ourselves
			for( Iterator<String> it = users.keySet().iterator(); it.hasNext(); ) {
				String u = it.next();
				if ( ! u.equals( user ) ) {
					users.remove( u );
				}
			}

			snapshot = s;

			// each widget then should clear itself, then retrieve and set it's own state.

			// at login, then, widgets should:
			// 1) get any state at snapshot head
			// 2) overwrite that with any state in the collabwidget
		}

		Map<String, List<String>> getCollabAppsMessages() {
			Map<String, List<String>>map = new HashMap<String, List<String>>();
			for( Entry<String, CollabApp> w : collabApps.entrySet() ) {
				map.put( w.getKey(), w.getValue().getMessages() );
			}
			return map;
		}

		/**
		 * Push string state onto the state cache
		 *
		 * @param wuid
		 */
		boolean pushState( String wuid, String state ) throws PersistenceException {
			AppState ws = snapshot.getAppState( wuid );

			if ( ws != null ) {
				ws.setState( state );
				return true;
			}

			return false;

			// THIS PUSHES TO STRING STATE
//			CollabApp live = collabApps.get( wuid );
//			if ( live != null ) {
//				live.pushState( state );
//				return true;
//			}
//			// else, there is no live state to save so do nothing
//			return false;
		}

		USess addUser( String userId ) {
			return users.put( userId, new USess() );
		}

		USess getUser( String userId ) {
			return users.get( userId );
		}

		// add widget, return the generated id; builds data structs as necessary
		String addApp( String widgetName, String desc ) {
			CollabApp w = collabApps.get( AppUtil.getAppId( widgetName, desc ) );

			// not currently running, add it
			if ( w == null ) {
				w = new CollabApp( widgetName, desc );
				collabApps.put( w.getId(), w );
			}

			return w.getId();
		}

		// NOTE that this ID is the _generated_ id, unique within the set of same widgets
		// NOTE that this ASSUMES the structure is already built
		// NOTE this is not really threadsafe, but this list is never deleted from, and read rarely where
		// errors reading are not catastrophic
		void addMessage( String wuid, String message ) {
			if ( ! wuid.equals( "*" ) ) {
				CollabApp w = collabApps.get( wuid );
				if ( w != null ) {
					w.addMessage( message );
				} else {
					Logger.getLogger( XWACSession.class ).info( "App: " + wuid + " not found, ignoring message: " + message );
				}
			}
		}

		void clearMessages( String wuid ) {
			CollabApp w = collabApps.get( wuid );
			if ( w != null ) {
				w.clearMessages();
			} else {
				Logger.getLogger( XWACSession.class ).info( "App: " + wuid + " not found, ignoring clearMessages" );
			}
		}

		List<String>getMessages( String wuid ) {
			CollabApp w = collabApps.get( wuid );
			if ( w != null ) {
				return w.getMessages();
			} else {
				return new ArrayList<String>();
			}
		}

		String getLatestMessage( String wuid ) {
			CollabApp w = collabApps.get( wuid );
			if ( w != null ) {
				return w.getLatestMessage();
			} else {
				return "";
			}
		}

//		void setState( String wuid, String state ) {
//			CollabApp w = collabApps.get( wuid );
//			if ( w != null ) {
//				w.pushState( state );
//			} else {
//				Logger.getLogger( XWACSession.class ).info( "App: " + wuid + " not found, not setting state." );
//			}
//		}

		String getState( String wuid ) {

			AppState ws = snapshot.getAppState( wuid );
			if ( ws != null ) {
				return ws.getState();
			}
			return null;


			// THIS GETS FROM STATIC STRING STATE
//			CollabApp w = collabApps.get( wuid );
//			if ( w != null ) {
//				return w.getState();
//			} else {
//				return null;
//			}

		}

		/**
		 * Get full instance ID list of all running widget class 'name' instances
		 *
		 * @param name
		 * @return
		 */
		Map<String,String>listInstances( String name ) {
			Map<String,String>instances = new HashMap<String,String>();

			for ( Map.Entry<String, CollabApp> w : collabApps.entrySet() ) {
				if ( AppUtil.getAppName( w.getKey() ).equals( name ) ) {
					instances.put( w.getValue().getId(), w.getValue().getDesc() );
				}
			}

			return instances;
		}

		/**
		 * Describes an executing collaborative widget.
		 *
		 * There are two state structures here.
		 * One is the messages list, which is an ordered list of all of the collab
		 * messages that have been passed between widgets.  The current widget state should
		 * be able to be derived from the starting snapshot state with the set of messages
		 * applied.
		 *
		 * Second is the state string.  This usually will be different from the collab state,
		 * probably being slightly behind, as the collab state is a real-time evolution of the
		 * state through the a set of messages, while this state string is a distillation of the
		 * widget state that is produced at intervals (might be automatic or manual).
		 *
		 * The long-term persisted entity is the state string.  In the persisted state, a state
		 * string is associated with a snapshot (AppState).
		 *
		 * Some widgets may not have a message/command list, e.g. those are not real-time
		 * synchronized collaborative widgets.  They still may have a state, the state is just not
		 * built by a series of mutations (messages/commands).
		 *
		 * All widgets that have a message/command/mutation language will have a message list.  If a snap
		 * shot has been taken, those widgets will also have a state string (at the instant the snapshot
		 * is taken, the command list is cleared as it is assumed that the widget state is entirely contained
		 * by the state string).  At that point the non-collab widget would be equivalent to a collab widget
		 * (e.g. entirely described by the state string).
		 *
		 * The effect is that the message/command list is distilled into a discrete state by the widget
		 * itself, and the backend/server does not have to know how that widget produces or is instantiated
		 * by the state string (that knowledge is solely encoded in the widget itself).
		 *
		 * The distillation of a command/message list into a discrete state is for efficiency in
		 * storing/restoring and also database persistence of the state.
		 *
		 * During the "distillation" process, the widget message que is logically locked so that the
		 * message/command state does not change while the state distillation is in progress; thus, even
		 * if a client is still producing state mutating messages, those messages while not being included
		 * in the distillation are not lost (e.g. the message list is only cleared to the point at which
		 * the snapshot was initiated).
		 *
		 * Restoring the widget state (e.g. late joiners, refreshers, etc.) need to:
		 * 0) start holding incoming messages
		 * 1) get messages list
		 * 2) getState and apply that state locally
		 * 3) if any messages recieved from step (0), apply them
		 * 4) stop holding incoming messages
		 * There is the possibility that commands are received during this process; it is incumbent upon
		 * the widget to 'hold' those messages until these three steps are completed, which will minimize (not eliminate) the
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
		// TODO rename messages to commands
		private final class CollabApp {
			// this is the ID of the collabwidget in the map of running widgets
			private final String id;
			// save the desc part as it may be useful for some clients, and it
			// can't be reverse engineered from the UUID
			private final String desc;
			// sequential messages processed by the widget
			// since we're slamming them in there and rarely reading and never removing (until kill widget),
			// concurrency is not an issue
			private final List<String>messages;
//			// json state to allow restore of widget to known state w/o replay
//			private String state;

			CollabApp( String widgetName, String desc ) {
				this.id = AppUtil.getAppId( widgetName, desc );
				this.desc = desc;
				// not necessarily used, but don't want to check each time
				messages = new ArrayList<String>();
			}

			final String getId() {
				return id;
			}

			final String getDesc() {
				return desc;
			}

			final void addMessage( String message ) {
				messages.add( message );
			}

			final void clearMessages() {
				messages.clear();
			}

			final List<String>getMessages() {
				return messages;
			}

			final String getLatestMessage() {
				if ( messages.size() > 0 ) {
					return messages.get( messages.size() - 1 );
				} else {
					return null;
				}
			}

//			/*
//			 * Return the messages list as a JSON array.
//			 * Assumes that each command is a JSON object in string format.
//			 */
//			final String messagesToJSON() {
//				// estimate individual command length as 32
//				StringBuilder sb = new StringBuilder( messages.size() * 32 );
//				sb.append( "[" );
//				for ( String s : messages ) {
//					sb.append( s ).append( "," );
//				}
//				// rather than check for first/last on each iteration to place comma/end bracket, merely fix at end:
//				// [{o},{o},  to  [{o},{o}]
//				sb.replace( sb.length() - 1, sb.length(), "]" );
//				return sb.toString();
//			}

			// better not have push state messages appearing in the message list!!
			/*
			 * Push the state string as the 'current state' of the widgets, remove the
			 * messages up to that point, blocking additional messages until this is done
			 * so that messages occuring on/around a state push are held until we're done
			 * here.  Note that pushing client must be cognizant that as soon as the push is
			 * done there may be messages appearing that should be processed and added to
			 * that pushing clients state (e.g. a push might be immediately mutated if other
			 * commands/messages are sent in close temporal proximity to the push).
			 */

			/*
			 * This means that client reset first needs to apply the state found here, and
			 * then the message list (if non-empty) needs to be applied as a series of commands
			 * to the widget.
			 */
			/*
			 * The caller must ensure that the state string passed in reflects the state they
			 * want to save sans the command list
			 */
//			final void pushState( String state ) {
//				// while we do this, block additional messages for later processing
//				synchronized( messages ) {
//					clearMessages();
//					this.state = state;
//				}
//			}
//
//			final String getState() {
//				return state;
//			}
		}

	}

	// set of widgets owned by a user
	// this set may span devices, browsers, portals
	// TODO could just use the raw Set instead of wrapping into a class ... used to be other data in here as well,
	// but no need for the struct anymore?
	private final class USess {
		final Set<Session>widgets;

		USess() {
			// get a fast robust synchronized map in a convoluted fashion
			widgets = Collections.newSetFromMap( new ConcurrentHashMap<Session,Boolean>() );
		}
	}
}
