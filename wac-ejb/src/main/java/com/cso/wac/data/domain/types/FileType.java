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

package com.cso.wac.data.domain.types;

/**
 * Types of files.
 *
 * @author rleuthner
 *
 */

public enum FileType {
	MISSION_REFERENCE( "Reference" ),  // channel profile
	MISSION_SHARE( "Shared" ),  // channel participant has shared the file, could be anything
	UNKNOWN_UPLOAD( "For Vetting" ),  // needs to be vetting for inclusion and assignment into another type

	// following types are app-specific format and content
	LINK( "Link" ),
	FORM_SOURCE( "Form" ),
	CHECKLIST_SOURCE( "Checklist" ),
	SLIDE_SOURCE( "Slide" );

	private String description;

	FileType( String description ) {
		this.description = description;
	}

	public String getDescription() {
		return description;
	}
}
