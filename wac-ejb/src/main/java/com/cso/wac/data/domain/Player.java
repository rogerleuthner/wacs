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
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import com.cso.wac.data.domain.types.PlayerRole;


/**
 * A Player; subject of WAC monitoring; no login access to WAC.
 * 
 * @author rleuthner
 *
 */

@Entity
@Table(name="wac_player", uniqueConstraints = @UniqueConstraint(columnNames = {"first","middle","last","name","role"}))
public class Player extends ChannelSpecificEntity {

	private static final long serialVersionUID = -6475459131244956867L;

	/**
	 * Message severity - support display messages with different background colors
	 */
	@Enumerated
	private PlayerRole role = PlayerRole.CIVILIAN;
	
	@NotNull
	@Size(min = 1, max = 25)
	@Pattern(regexp = "[A-Za-z]*", message = "must contain only letters")
	@Column
	private String first;

	@Size(min = 1, max = 25)
	@Pattern(regexp = "[A-Za-z]*", message = "must contain only letters")
	@Column
	private String middle;

	@Size(min = 1, max = 25)
	@Pattern(regexp = "[A-Za-z]*", message = "must contain only letters")
	@Column
	private String last;
	
	public void setPlayerRole( PlayerRole role ) {
		this.role = role;
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
	
	public String getFormattedName() {
		if ( first == null || first.isEmpty() ) {
			return getName();
		} else {
			return getName() + " (" + first + ")";
		}
	}	
	
}