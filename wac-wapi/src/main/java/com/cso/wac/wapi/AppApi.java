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

package com.cso.wac.wapi;

import java.util.List;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;

import com.cso.wac.data.services.AppService;
import com.cso.wac.exc.BadInitializationException;
import com.cso.wac.exc.PersistenceException;
import com.cso.wac.wapi.secure.SecurityInterceptor;
import com.cso.wac.web.WACSession;
import com.cso.wac.web.AppUtil;

/**
 * Web api into app states for history, playback and initialization;
 * this only exists for those apps not fully integrated into (or not able to)
 * extending the StatefulApp API
 *
 * How are events propagated from app changes?  Say a person inits a app,
 * then another user changes a app state.  How do we determine if this is a
 * 'publishable' event, and if so do we use the event source mechanism, or do we
 * drop everything into web sockets?
 *
 * @author rleuthner
 *
 */

@Path("/app")
public class AppApi {

	Logger logger = Logger.getLogger( AppApi.class );

	@EJB
	private AppService appService;

	@EJB
	private WACSession wacSession;

	@Inject
	private HttpServletRequest request;

	public AppApi() {
	}

	/**
	 * Clear the 'live' state from a specific app class/instance
	 *
	 * @param name
	 * @return ResponsePkg
	 * @throws InternalException
	 * @throws PersistenceException (unchecked)
	 */
	@GET
	@Path( "/clearstate/{name}" )
	@Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
	public ResponsePkg clearState( @PathParam( "name" ) String name ) throws InternalException {
		ResponsePkg rp = new ResponsePkg();
		wacSession.clearAppMessages( SecurityInterceptor.getChanId( request ), name );
		rp.setStatus( Response.Status.NO_CONTENT );
		rp.setText( "App state clear" );
		return rp;
	}


	/**
	 * Get app static state string
	 * else return NO_CONTENT
	 *
	 * @param wuid
	 * @return ResponsePkg with text string state or NO_CONTENT
	 * @throws InternalException
	 * @throws PersistenceException
	 */
	@GET
	@Path( "/getstaticstate/{wuid}" )
	@Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
	public ResponsePkg getStaticState( @PathParam( "wuid" ) String wuid ) {
		ResponsePkg rp = new ResponsePkg();
		String state = wacSession.getAppStaticState( SecurityInterceptor.getChanId( request ), wuid );

		if ( state == null ) {
			// no persisted or collab state for the app
			rp.setStatus( Response.Status.NO_CONTENT );
			rp.setText( "" ); // ??
		} else {
			rp.setStatus( Response.Status.OK );
			rp.setData( state /*.replaceAll( "\n", "" )*/ );  // this has to be done since JSON will barf on them ... TODO????
		}
		return rp;
	}

	/**
	 * Save individual app state.
	 *
	 * NOTE!! method is SYNCHRONIZED for the case where a user has more than one instance of a app open; otherwise,
	 * since the apps are in charge of updating themselves asynchronously, there could be an optimistic lock failure.
	 *
	 * That still does not take situation into account where 'last in' wins in case there is a difference; for this case
	 * we assume if these are collab apps then they are identical.
	 *
	 * @param snapId
	 * @param wuid
	 * @param (POST data) state
	 * @return
	 */
	@POST
	@Path( "/updatestate/{snapId}/{wuid}/{desc}" )
	@Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_ADMIN" )
	public synchronized ResponsePkg updateState( @PathParam( "snapId" ) Long snapId, @PathParam( "wuid" ) String wuid,
												@PathParam( "desc" ) String desc, String state ) {
		ResponsePkg rp = new ResponsePkg();

		// find the app in the database snapshot (or create it if not found) and do the same thing
		appService.updateAppState( SecurityInterceptor.getChanId( request ), SecurityInterceptor.getUserName( request ), snapId, wuid, desc, state );

		rp.setStatus( Response.Status.OK );
		return rp;
	}

	/**
	 * List active instances (full wuids) of app 'name', key wuid, value desc
	 *
	 * NOTE the unique id of a app is passed in, but the derived app class name is used to find instances.
	 *
	 * @param name of app class (e.g. 'viewer')
	 * @return
	 */
	@GET
	@Path( "/listinstances/{wuid}" )
	@Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
	public String[] listInstances( @PathParam( "wuid" ) String wuid ) {
		return wacSession.getInstances( SecurityInterceptor.getChanId( request ), AppUtil.getAppName( wuid ) );
	}


	/**
	 * Get latest state from explicitly named Wuid
	 *
	 * @param wuid
	 * @return
	 *
	 * @unused
	 */
	@GET
	@Path( "/lateststate/{wuid}" )
	@Produces( MediaType.TEXT_PLAIN )
	@RolesAllowed( "ROLE_USER" )
	public String getLatestState( @PathParam( "wuid" ) String wuid ) {
		return wacSession.getLatestMessage( SecurityInterceptor.getChanId( request ), wuid );
	}

	/**
	 * Retrieve the entire set of transient app messages.
	 *
	 * @param app identifier (includes app name and UID)
	 * @return ResponsePkg, data list of strings
	 * @throws InternalException
	 * @throws PersistenceException
	 */
	@GET
	@Path( "/getmessages/{wuid}" )
	@Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
	public List<String>getMessageList( @PathParam( "wuid") String wuid ) throws InternalException, PersistenceException {
		List<String>messages = wacSession.getAppMessages( SecurityInterceptor.getChanId( request ), wuid );
		logger.info( "Returning: " + messages.size() + " messages" );
		return messages;
	}

	/**
	 * Register as an executing, shareable app.
	 * Using the appId will allow direct messaging to all other instances of this particular
	 * app incarnation.  Using the appName will allow messaging to all class instances of
	 * the app.  The returned wuid is the same as will be generated by the /genwuid/name/desc as
	 * defined elsewhere in this file.
	 *
	 * The basic app initialization that should be performed before initiating any Ws endpoints,
	 * since the 'target' is distilled from appName/description and uniquely identifies a collaborative
	 * app performing a specific task.
	 *
	 * If an instance of this app class with this app content is already running, nothing will
	 * happen (besides returning the wuid of that running app).
	 *
	 * @param appName
	 * @param description - text that differentiates executing instances; in some cases will be user-visible differentiator
	 * @return String (appId, wuid)
	 * @throws InternalException
	 * @throws PersistenceException
	 * @throws BadInitializationException
	 */
	@GET
	@Path( "/register/{appName}/{description}" )
	@Produces( MediaType.TEXT_PLAIN )
	@RolesAllowed( "ROLE_USER" )
	public String register( @PathParam( "appName" ) String name, @PathParam( "description" ) String desc ) throws InternalException, PersistenceException, BadInitializationException {
		return wacSession.addApp( SecurityInterceptor.getChanId( request ), name, desc );
	}

	/**
	 * Generate the id as would be done by the register.  May be used by the front end to find an executing app.
	 *
	 * @param name
	 * @param desc
	 * @return
	 * @throws InternalException
	 * @throws PersistenceException
	 * @throws BadInitializationException
	 */
	@GET
	@Path( "/genwuid/{appName}/{description}" )
	@Produces( MediaType.TEXT_PLAIN )
	@RolesAllowed( "ROLE_USER" )
	public String generateId( @PathParam( "appName" ) String name, @PathParam( "description" ) String desc ) throws InternalException, PersistenceException, BadInitializationException {
		return AppUtil.getAppId( name, desc );
	}
}