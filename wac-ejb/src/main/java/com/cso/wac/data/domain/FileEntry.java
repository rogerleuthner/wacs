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

import java.util.Map;

import javax.json.Json;
import javax.json.JsonBuilderFactory;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;

import com.cso.wac.data.domain.types.FileType;
import com.cso.wac.data.domain.types.FileTypeConverter;

/**
 * File stored on a server path.
 *
 * This may reflect a user-uploaded file or a channel-specific document, e.g.
 * form, slide(show?), reference document, protocol list, checklist source
 *
 * @author rleuthner
 *
 */

@Entity
@Table( name = "wac_file" )
public class FileEntry extends ChannelSpecificEntity {
	private static final long serialVersionUID = -5177458786012565533L;

	// filepath in local (server-specific) vernacular.  if the system is ported from one env
	// to another, the filepaths existing in channels may have to be updated UNLESS
	// relative pathnames are used
	// this might also be the "URL" path if it's a web resource
	@NotNull
	@Column( length=8192 )
	private String path;

	@NotNull
	@Convert( converter = FileTypeConverter.class )
	private FileType type;

	/**
	 * These notices are never deleted, so don't worry about cascade.
	 */
	@ManyToOne
	@NotNull
	@JoinColumn( name="user_id" )
	private User user;

	public User getUser() {
		return user;
	}

	public void setUser( User user ) {
		this.user = user;
	}

	public String getPath() {
		return path;
	}

	public void setPath( String in ) {
		path = in;
	}

	public void setType( FileType type ) {
		this.type = type;
	}

	public FileType getType() {
		return type;
	}
	public String getJSON( Map<String,String>toAdd ) {
		JsonBuilderFactory factory = Json.createBuilderFactory(null);
		JsonObjectBuilder job =factory.createObjectBuilder();
        job.add("name", this.getName());
        job.add("id", this.getId());
        job.add("description", this.getDescription());
        job.add("chid", this.getChID().getId());
        job.add("userName",  this.getUser().getUserName());
        job.add("lock",  this.getLock());
        job.add("active",  this.getActive());
        job.add("created",  this.getCreated().toString());
        job.add("type", getType().toString() );
        job.add("path", getPath() == null ? "" : getPath() );
        if ( toAdd != null ) {
	        	for( String key : toAdd.keySet() ) {
	        	job.add( key, toAdd.get( key ) );
	        }
        }
        JsonObject jobj = job.build();
		return jobj.toString();
	}
	// move into base?
	public String getJSON( ) {
		return getJSON( null );
	}
}