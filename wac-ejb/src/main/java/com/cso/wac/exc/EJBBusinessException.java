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

import javax.ejb.ApplicationException;
import javax.ws.rs.WebApplicationException;

/**
 * Base class for all ejb exceptions of which we we don't want stack traces to appear in the log files.
 *
 * This prevents extending EJB exceptions from being wrapped in EJBException (which normally dumps a stack trace in the
 * log files for every occurence) for those exceptions that we want to pass directly to the web layer.
 *
 * Only subclass this for exceptions that you handle in the EJBs from invocations in the web services apis.
 *
 * @author rleuthner
 *
 */

@ApplicationException( inherited = true, rollback = true )
public abstract class EJBBusinessException extends WebApplicationException {
	private static final long serialVersionUID = 8995697130707366650L;

	public EJBBusinessException(String m) {
		super( m );
	}
}
