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

/**
 * Entities that should be filtered by Channel
 * 
 * @author rleuthner
 */

import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.MappedSuperclass;

@SuppressWarnings("serial")
@MappedSuperclass
public abstract class ChannelSpecificEntity extends NamedEntity {  // TODO should this implement comparable, overridding the compare of namedentity

	// a single Channel is associated with many tables/entities and rows within those
	@ManyToOne
	@JoinColumn( name="ch_id" )
	private Channel ch;	
	
	// TODO should we enforce channelid constructor??
	// similarly for NamedEntity
		
	public Channel getChID() {
		return ch;
	}
	
	public void setChID( Channel ch ) {
		this.ch = ch;
	}
	
}
