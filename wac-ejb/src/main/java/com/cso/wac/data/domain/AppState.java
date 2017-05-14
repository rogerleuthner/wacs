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

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.cso.wac.web.AppUtil;

/**
 * App state container
 *
 * "name" - app "class" id
 * "desc" - app "instance" discriminator
 *
 * @author rleuthner
 *
 */

@Entity
@Table( name = "wac_appstate" )
public class AppState extends NamedEntity {
	private static final long serialVersionUID = 564852482634837502L;

	/**
	 *  JSON string encoding transient app state;
	 *  e.g. could be a json string describing view point parms of the geo app
	 *  (share view) (layer, coords, size, etc.)
	 */
// max 10,485,760
	@Column( length = 9000000 )
	private String state;

	@JsonIgnore
	@ManyToOne( targetEntity = Snapshot.class )
	private Snapshot snapshot;

	@ManyToOne
	@JoinColumn( name="user_id" )
	private User user;

	@JsonIgnore  // only get this when explicitly asked for, as it may be large
	@OneToMany( cascade = CascadeType.ALL, fetch = FetchType.EAGER, mappedBy = "appState", orphanRemoval = true )  // orphanRemoval makes ws.getMessages().clear() work to delete the rows
	@Fetch(value = FetchMode.SUBSELECT)
	private Collection<TextMessage>messages = new ArrayList<TextMessage>();

	public Collection<TextMessage>getMessages() {
		return messages;
	}

	public void setMessages( Collection<TextMessage>messages ) {
		this.messages = messages;
	}

	public void addMessage( String message ) {
		// this might need to be done by the service to generate new entry
		messages.add( new TextMessage( message ) );
	}

	public void addMessage( TextMessage message ) {
		messages.add( message );
	}

	public AppState() {
	}

	public AppState( String name ) {
		setName( name );
	}

	public AppState( String name, String desc ) {
		setName( AppUtil.getAppId( name, desc ) );
		setDescription( desc );
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public void setSnapshot(Snapshot snapshot) {
		this.snapshot = snapshot;
	}

	public Snapshot getSnapshot() {
		return snapshot;
	}
}
