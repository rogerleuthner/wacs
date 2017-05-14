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

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import org.apache.log4j.Logger;

import com.cso.wac.JWTService;
import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.UpdateObjectMapper;
import com.cso.wac.data.domain.Channel;
import com.cso.wac.data.domain.Role;
import com.cso.wac.data.domain.User;
import com.cso.wac.data.domain.types.ChannelAccess;
import com.cso.wac.data.services.ChannelService;
import com.cso.wac.exc.PersistenceException;

@Stateless
public class UserService {
	@EJB
	private DataRepositoryProducer producer;

	@EJB
	private JWTService jwtService;

	@EJB
	private ChannelService channelService;

	@EJB
	private UpdateObjectMapper updater;

	private final static String ALGORITHM = "SHA-256";
	private final static String ENCODING = "UTF-8";
	private final static byte[] SALT = "9374768421923658".getBytes(); // TODO this should be different for each password
																		// see https://www.owasp.org/index.php/Hashing_Java
	public UserService() {}

	public static String generatePasswordHash( String password ) throws BadPasswordException, NoSuchAlgorithmException, UnsupportedEncodingException {

		// TODO enforce password strength
		if ( password == null || password.isEmpty() /* || is not good password */) {
			throw new BadPasswordException( "Password is null, empty or insufficiently secure" );
		}

		return getHash( password );
	}

	private static String getHash( String password ) throws NoSuchAlgorithmException, UnsupportedEncodingException {
		MessageDigest digest = MessageDigest.getInstance( ALGORITHM );
		digest.update( SALT );
		byte[] input = digest.digest( password.getBytes( ENCODING ) );
		StringBuilder sb = new StringBuilder();

		for( int i = 0; i < input.length; i++ ) {
			sb.append(Integer.toString((input[i] & 0xff) + 0x100, 16).substring(1));
		}
		return sb.toString();
	}

	public User getById( Long id ) {
		 return (User)producer.getEntityManager().createQuery( "FROM User WHERE id = :id" )
				 .setParameter( "id", id ).getSingleResult();
	}

	public User getUser( Long id ) {
		return getById( id );
	}

	@SuppressWarnings("unchecked")
	public List<User>getUsers() {
		return producer.getEntityManager().createQuery( "FROM User" ).getResultList();
	}

	public User getUserByUserName( String userName ) {
		 User user = (User)producer.getEntityManager().createQuery( "FROM User u JOIN FETCH u.roles WHERE userName = :userName" )
				 .setParameter( "userName", userName ).getSingleResult();

		 return user;
	}

	@SuppressWarnings("unchecked")
	public List<User>getByChannel(Long chId) {
		// get all the users then filter manually
		// there is probably a much cleaner way to do this using database queries.
		List<User> ulist = producer.getEntityManager().createQuery("SELECT DISTINCT u FROM User u JOIN FETCH u.roles r WHERE r.chan.id = :chId").setParameter("chId", chId).getResultList();

		return ulist;
	}

	/**
	 * Select user details and generate and add JWT if user/password valid.
	 * Caller should verify that user/password both have values.
	 *
	 * @param {String} username
	 * @param {String} password
	 * @param {Long} chid
	 * @return User with JWT or null if user does not exist or encountered error
	 */
	public User initUser( String username, String password, Long chid ) {

		assert( username != null && ! username.isEmpty() );
		assert( password != null && ! password.isEmpty() );
		assert( chid != null );
		User user;

		try {
			user = getUserByUserName( username );

			if ( user != null && getHash( password ).equals( user.getHashword() ) ) {

				if ( user.getRoles() != null && user.getRoles().size() > 0 ) {

					user.setJWT( jwtService.buildJwsJwt( user.getUserName(), user.getRoles( chid ), chid ) );

				} else {
					throw new Exception( "User has no roles, can't log in" );
				}

			} else {
				throw new Exception( "Unknown user login attempt or password fail: " + username );
			}

		} catch (Exception e) {
			// no info to the user about why this failed (security)
			Logger.getLogger( UserService.class ).info( "Login/JWT failure: " + e.getMessage() );
			user = null;
		}

		// user does not exist (null) or user with JWT
		return user;
	}

	public User addUser(User input) throws PersistenceException {

		// create a new user to add to the database and copy all input information to that user
		User u = new User();
		u.setFirst(input.getFirst());
		u.setMiddle(input.getMiddle());
		u.setLast(input.getLast());
		u.setEmail(input.getEmail());
		u.setPhone(input.getPhone());
		u.setUserName(input.getUserName());
		u.setHashword(input.getHashword());

		// save new user to the database
		producer.getEntityManager().persist(u);
		// that should force Hibernate to keep track of it as a database entry

		// dummy up basic role until role editing is added to UI
		Role r = new Role();
		r.setChID( channelService.getChannel( new Long( Channel.DEFAULT_CHANNEL ) ) );
		r.setAccess( ChannelAccess.ROLE_USER );
		r.setActive( true );
		r.setUser( u );
		u.addRole( r );
		producer.getEntityManager().persist(r);

		// update the user one last time before exiting
		producer.getEntityManager().persist(u);

		return u;
	}

	public User updateUser(String data) throws PersistenceException {

		User u;
		try {
			// This call breaks on several of the User fields that require or contain data that
			// is different from a string or long (Date, Null, etc.)
			// Currently the front end pulls out only the fields it is allowed to change
			// and returns these in a JSON object, plus the ID and LOCK to ensure the update works
			u = (User) updater.mapAndUpdate(User.class, data);
		} catch (PersistenceException e) {
			throw new PersistenceException("Some nasty error occurred: " + e.getMessage());
		}
		return u;
	}

	// TODO: Each role has an "active" field as well, which appears to be set to "true" by default.
	//		So far, no app appears to be able to edit these fields, but we may want to make the Channel Editor
	//		capable of doing so. (This could be tricky since the UI is solely drag-and-drop)

	public User addUserAndRoles(User user) throws PersistenceException {

		User u = getUser(user.getId());
		u.setActive(user.getActive());
		for (Role tmp : user.getRoles()) {
			Role r = new Role();
			r.setAccess(tmp.getAccess());
			r.setChID(tmp.getChID());
			r.setUser(u);
			producer.getEntityManager().persist(r);
		}

		producer.getEntityManager().persist(u);

		return u;
	}

	public User updateUserAndRoles(User user) throws PersistenceException {

		Long chId = user.getRoles().iterator().next().getChID().getId();
		User u = getUser(user.getId());
		u.setActive(user.getActive());
		// delete all roles for the current channel and current user
		for (Role r : u.getRoles()) {
			if (r.getChID().getId().equals(chId))
				// we need to delete the roles from the database directly
				producer.getEntityManager().remove(r);
		}
		// now add the roles resulting from any role changes
		for (Role tmp : user.getRoles()) {
			Role r = new Role();
			r.setAccess(tmp.getAccess());
			r.setChID(tmp.getChID());
			r.setUser(u);
			producer.getEntityManager().persist(r);
		}

		return u;
	}
}

class BadPasswordException extends Exception {
	private static final long serialVersionUID = 3867664741746186090L;

	public BadPasswordException( String mess ) {
		super( mess );
	}
}