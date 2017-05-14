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
 * Defines for SSE, EventSource event names which must be shared by front and backend code.
 * TODO whatever means to keep this set/names in sync with those contained in WAC.js
 *
 * @author rleuthner
 *
 */

public enum Events {

	// string values must match those in WAC.js constants
	FILE_ADD( "fileAdd" ),
	DOC_LOCKED( "lockDocument" ),
	DOC_UNLOCKED( "unlockDocument" ),
	USER_LOGIN( "login" ),
	USER_LOGOUT( "logout" ),
	FORM_SHARE( "formShare" ),
	SLIDESHOW_PUBLISH( "slidePublish" ),
	PICTURE_SHARE( "pictureShare" ),
	FILE_FETCH( "fileFetch" ),
	FILE_REMOVE( "fileRemove" ),
	FILE_CHANGE( "fileChange" );

	private final String event;

	private Events( String e ) {
		this.event = e;
	}

	public String getEvent() {
		return event;
	}
}