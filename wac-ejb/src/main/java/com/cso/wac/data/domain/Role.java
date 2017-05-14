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

import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.cso.wac.data.domain.types.ChannelAccess;
import com.cso.wac.data.domain.types.ChannelAccessConverter;

@Entity
@Table(name="wac_role")
public class Role extends BaseEntity {

	private static final long serialVersionUID = 9073814954657209868L;

//	@JsonIgnore    this ignore prevents easy de-jsonization for the role editor ... do we really need it?
	@OneToOne( fetch = FetchType.EAGER )
	private Channel chan;

	@Convert( converter = ChannelAccessConverter.class )
	private ChannelAccess access;

	@JsonIgnore
	@ManyToOne( targetEntity = User.class )
	private User user;

	public Channel getChID() {
		return chan;
	}

	public void setChID(Channel chan) {
		this.chan = chan;
	}

	public ChannelAccess getAccess() {
		return access;
	}

	public void setAccess(ChannelAccess access) {
		this.access = access;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}
}
