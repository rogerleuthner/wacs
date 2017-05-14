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
import javax.persistence.MappedSuperclass;
import javax.validation.constraints.NotNull;

/**
 * Named with description Entity base
 * 
 * @author rleuthner
 *
 */
@SuppressWarnings("serial")
@MappedSuperclass
public abstract class NamedEntity extends BaseEntity implements Comparable<NamedEntity> {
	
	// if hibernate needs to be surfaced for other reasons, also change this constraint (name) to NaturalId
	// here, then remove as a literal constraint in extenders!
	@NotNull
	@Column( length=64 )
	private String name;
	
	@Column( length=8092 )
	private String description;

	public String getName() {
		return this.name;
	}
	public void setName(String name) {
		this.name = name;
	}
	
	public String getDescription() {
		return this.description;
	}
	public void setDescription(String desc) {
		this.description = desc;
	}
	
	@Override
	public int compareTo(NamedEntity namedEntity) {
	    return name.compareTo(namedEntity.getName());
	}	
}
