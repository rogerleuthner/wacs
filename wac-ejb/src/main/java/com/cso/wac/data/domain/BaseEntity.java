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

import java.io.Serializable;
import java.util.Date;

import javax.persistence.Column;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.MappedSuperclass;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Version;
import javax.validation.constraints.NotNull;

/**
 * All persisted entities should extend this base entity class
 *
 * @author rleuthner
 *
 */

@SuppressWarnings("serial")
@MappedSuperclass
//@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class BaseEntity implements Serializable {

	@Id
//	// generate the id upon 'persist', not on 'commit'
//	@GeneratedValue(strategy=GenerationType.SEQUENCE )
	@GeneratedValue(strategy=GenerationType.AUTO)
	private Long id;

	@NotNull
	@Column
	private Boolean active = true;

	@NotNull
	@Column
	@Temporal( TemporalType.TIMESTAMP )
	private Date created = new Date();

	// for optimistic locking strategy
	// user code should not touch this
	@Version
	@Column( columnDefinition="integer default 0", nullable=false )
	private int lock;

	public BaseEntity() {
		setCreated( new Date( System.currentTimeMillis() ) );
	}

	public Date getCreated() {
		return created;
	}

	public void setCreated( Date in ) {
		this.created = in;
	}

	public Long getId() {
		return id;
	}
	public void setId( Long id ) {
		this.id = id;
	}

	public Boolean getActive() {
		return active;
	}
	public void setActive( Boolean active ) {
		this.active = active;
	}
	public void delete() {
		this.active = false;
	}

	public int getLock() {
		return lock;
	}
	public void setLock(int lock) {
		this.lock = lock;
	}


}

