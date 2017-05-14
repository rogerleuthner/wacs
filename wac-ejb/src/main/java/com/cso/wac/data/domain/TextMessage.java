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
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

/**
 * Textual message; might be from an SMS broadcast ('text message'), or might be a sentence from a chat session, or might
 * be a control message for annotation layer.  Any length text message.
 *
 * Depending upon the usage, the 'message' might be a long JSON string describing a set of messages, or there might
 * be a single structure for each message.
 *
 * @author rleuthner
 *
 */

// TODO rename Message

@Entity
@Table(name="wac_message")
public class TextMessage extends BaseEntity {

	private static final long serialVersionUID = 5587478887234938748L;

	@ManyToOne( fetch = FetchType.EAGER )
	@JoinColumn( name = "appId" )
	private AppState appState;

	@Column( length = 500000 )
	private String text;

	public TextMessage() {
	}

	public TextMessage(String message) {
		this.text = message;
	}

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public void setAppState( AppState appState ) {
		this.appState = appState;
	}
}
