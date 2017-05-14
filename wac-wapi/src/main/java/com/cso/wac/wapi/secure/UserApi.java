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

package com.cso.wac.wapi.secure;

import java.util.List;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import com.cso.wac.data.domain.User;
import com.cso.wac.data.services.ConfigService;
import com.cso.wac.data.services.ChannelService;
import com.cso.wac.data.services.misc.UserService;
import com.cso.wac.exc.PersistenceException;
import com.cso.wac.wapi.InternalException;

/**
 * Services useful for authenticating, managing etc. of users
 *
 * @author rleuthner
 *
 */

@Path("/user")
public class UserApi {

	@EJB
	private UserService userService;

	@EJB
	private ChannelService channelService;

	@EJB
	private ConfigService configService;

	@Inject
	private HttpServletRequest request;

	public UserApi() {
	}

	/**
	 * Return user details including generated JWT or null.
	 *
	 * Generally accessible; note that the user and chid must be explicitly passed in since
	 * the executing user is not currently logged in.
	 *
	 * This is called by the portal (OWF), or may be called manually to initialize a session group.
	 *
	 * TODO might be good to whilelist this, could press 'denyall' into service to do so.
	 * TODO password string should be hashed before coming here
	 *
	 * @param {String} user
	 * @param {String} password
	 * @param {String} channel
	 * @return
	 */
    @GET
    @Path( "/init/{username}/{password}/{chid}" )
    @Produces( MediaType.APPLICATION_JSON )
    @PermitAll
    public User initUser( @PathParam( "username" ) String username, @PathParam( "password" ) String password, @PathParam( "chid" ) Long chId ) { // no throws, exceptions are all handled
    	return userService.initUser( username, password, chId );
    }

    /**
     * Return a list of all users and user details
     */
    @GET
    @Path("/listusers")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public List<User> getUsers() {
    	return userService.getUsers();
    }

    /**
     * Return a list of all users belonging to a particular channel
     */
    @GET
    @Path("/getuser/{chId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public List<User> getUserInChannel( @PathParam("chId") Long chId) {
    	List<User> userlist = userService.getByChannel(chId);
    	return userlist;
    }

    /**
     * Submit a new user object for storage in the database
     */
    @POST
    @Path("/saveuser")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public Response saveUser( User user ) throws InternalException {

    	try {
    		userService.addUser(user);
    	} catch(PersistenceException e) {
    		throw new InternalException( e.getMessage() );
    	}

    	return Response.status(Response.Status.OK).entity(null).build();
    }

    /**
     * Submit an edited user object for updating in the database
     */
    @POST
    @Path("/updateuser")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public Response updateUser( String json ) throws InternalException {

    	try {
    		userService.updateUser(json);
    	} catch(PersistenceException e) {
    		throw new InternalException(e.getMessage());
    	}

    	return Response.status(Response.Status.OK).entity(json).build();
    }

	/**
	 * Return logged in user and ch (jwt is still in a cookie on the front end); this data is
	 * extracted from the JWT.
	 *
	 * @return
	 */
    @GET
    @Path( "/me" )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
    public Response getMe() throws InternalException { // TODO this could have more suitable exception processing
    	final String userName = SecurityInterceptor.getUserName( request );
    	final String channelName = channelService.getChannel( SecurityInterceptor.getChanId( request ) ).getName();
    	final String version = configService.get( ConfigService.KEY_WAC_VERSION );
    	return Response.status( Status.OK ).entity(
    			new Object() {
    				@SuppressWarnings("unused")
					public String getChannelName() {
    					return channelName;
    				}
    				@SuppressWarnings("unused")
					public String getUserName() {
    					return userName;
    				}
    				@SuppressWarnings("unused")
    				public String getVersion() {
    					return version;
    				}
    			}).build();
    }

    /**
     * Submit a user to add to a channel
     */
    @POST
    @Path("/adduserandroles")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public User addUserRoles(User user) throws InternalException {
    	User u;
    	try {
    		u = userService.addUserAndRoles(user);
    	} catch (PersistenceException e) {
    		throw new InternalException(e.getMessage());
    	}

    	return u;
    }

    /**
     * Submit a user object that already exists in a channel for update
     */
    @POST
    @Path("/updateuserandroles")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("ROLE_ADMIN")
    public User updateUserRoles(User user) throws InternalException {
    	User u;
    	try {
    		u = userService.updateUserAndRoles(user);
    	} catch (PersistenceException e) {
    		throw new InternalException(e.getMessage());
    	}

    	return u;
    }

}