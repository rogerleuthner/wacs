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

package com.cso.wac.data.domain;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotEmpty;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


/**
 * A "User"
 * A user can login to the system and do things like execute checklists, edit
 * checklists, view status, etc. (depending upon roles).
 *
 * @author rleuthner
 *
 */

@Entity
@Table(name="wac_user", uniqueConstraints = {@UniqueConstraint(columnNames = "email"),
											@UniqueConstraint(columnNames = "userName")})
@JsonIgnoreProperties( { "formattedName", "channelRoles" } )
public class User extends BaseEntity {
	private static final long serialVersionUID = -6475459131244956867L;

	@NotNull
	@Size(min = 1, max = 25)
	@Pattern(regexp = "[A-Za-z]*", message = "must contain only letters")
	@Column
	private String first;

	@Size(min = 1, max = 25)
	@Pattern(regexp = "[A-Za-z]*", message = "must contain only letters")
	@Column
	private String middle;

	@NotNull
	@Size(min = 1, max = 25)
	@Pattern(regexp = "[A-Za-z]*", message = "must contain only letters")
	@Column
	private String last;

	@NotNull
	@Size(min = 1, max = 25)
	@Pattern(regexp = "[A-Za-z1-10]*", message = "must contain only letters and/or digits")
	@Column
	private String userName;

	@NotNull
	@NotEmpty
	@Email
	private String email;

	@Column
	private String hashword;  // hashed password

	@NotNull
	@Size(min = 10, max = 12)
	@Pattern(regexp = "[0-9-.]*", message = "bad phone number format") // a basic pattern, but can probably be improved with a better regex
	//@Digits(fraction = 0, integer = 12)  // this seems to require a 12-digit sequence of numbers, which means ###-###-#### will always fail validation...
	@Column
	private String phone;

	// must be eager fetched, we don't want queries executing
	// when we're examining role set of a detached user entity
	@OneToMany( mappedBy="user", fetch = FetchType.EAGER )
	@Fetch(value = FetchMode.SUBSELECT)	
	private Collection<Role>roles = new HashSet<Role>();

	// this is only for transferring a JWT to the OWF/authentication, it's never stored
	@Transient
	private String JWT;

	public String getJWT() { return JWT; }
	public void setJWT( String jwt ) { this.JWT = jwt; }

	public String getHashword() {
		return hashword;
	}

	public void setHashword( String in ) {
		this.hashword = in;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getFirst() {
		return first;
	}

	public void setFirst(String first) {
		this.first = first;
	}

	public String getMiddle() {
		return middle;
	}

	public void setMiddle(String middle) {
		this.middle = middle;
	}

	public String getLast() {
		return last;
	}

	public void setLast(String last) {
		this.last = last;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}

	public String getFormattedName() {
	    return (this.first + " " + this.last);
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}
	public Collection<Role> getRoles() {
		return roles;
	}
	public void setRoles(Collection<Role> roles) {
		this.roles = roles;
	}
	public void addRole( Role role ) {
		this.roles.add( role );
	}
	/**
	 * Return roles in a specific channel
	 *
	 * @param chId
	 * @return {String[]} roles
	 */
	public String[] getRoles( Long chId ) {
		ArrayList<String>al = new ArrayList<String>();
		for( Role r : roles ) {
			if ( r.getChID().getId().equals( chId ) ) {
				al.add( r.getAccess().getRole() );
			}
		}
		return al.toArray( new String[ al.size() ] );
	}

	/**
	 * Return all channel/role sets
	 *
	 * @return {String[][]} channel roles
	 */
	public String[][] getChannelRoles() {
		String[][] mr = new String[ roles.size() ][ 2 ];
		int i = 0;
		for( Role r : roles ) {
			mr[ i ][ 0 ] = r.getChID().toString();
			mr[ i ][ 1 ] = r.getAccess().getRole();
		}
		return mr;
	}
}