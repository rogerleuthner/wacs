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

package com.cso.wac.exc;

/**
 * Simple container for programming errors that should be handled at the very top
 * so program logic is not polluted with a bunch of exception handling stuff, and
 * other cases (e.g. @PostConstruct on EJB's) where a checked exception is not proper.
 * 
 * @author rleuthner
 *
 */


public class ProgrammingException extends RuntimeException {
	private static final long serialVersionUID = -7808304093657833266L;

	public ProgrammingException( String msg ) {
		super( msg );
	}

}
