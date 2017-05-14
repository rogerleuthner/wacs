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

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;

import com.cso.wac.data.domain.types.EventSeverity;

/**
 * Notice of a system event.  Displayed in the activity monitor
 * 
 * @author rleuthner
 *
 */

@Entity
@Table( name = "wac_event_notice" )
public class EventNotice extends ChannelSpecificEntity {

	private static final long serialVersionUID = 1L;

	/**
	 * These notices are never deleted, so don't worry about cascade.
	 */
	@ManyToOne
	@NotNull
	@JoinColumn( name="user_id" )
	private User user;
	
	/**
	 * Has this message been sent on the public channel yet
	 */
	@NotNull
	@Column
	private Boolean published = false;
	
	/**
	 * Message severity - support display messages with different background colors
	 */
	@Enumerated
	private EventSeverity severity = EventSeverity.NORMAL;
	
	public EventNotice() { super(); }
	
	public EventSeverity getSeverity() {
		return severity;
	}
	
	public void setSeverity( EventSeverity severity ) {
		this.severity = severity;
	}
	
	public Boolean getPublished() {
		return published;
	}
	
	public void setPublished( Boolean in ) {
		this.published = in;
	}
	
	public void published() {
		setPublished( true );
	}
	
	public Boolean isPublished() { 
		return getPublished();
	}
	
	public User getUser() {
		return user;
	}
	
	public void setUser( User user ) {
		this.user = user;
	}
	
	// use named entity name field for the event notice text; no need for extra fields
	public String getText() { return this.getName(); }
	public void setText( String text ) { this.setName( text ); }
}