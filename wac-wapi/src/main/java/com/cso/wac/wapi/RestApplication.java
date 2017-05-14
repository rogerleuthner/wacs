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

package com.cso.wac.wapi;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

/**
 * Mark this module as being a RESTful data provider.
 * 
 * Note that services invoked by these methods must generally have FULLY MATERIALIZED 
 * objects (e.g. no 'lazy' fields).  Otherwise the domain objects' attributes not fulfilling
 * this promise must be annotated @Jsonignore since the RESTeasy fasterxml deserialization 
 * otherwise will cause lazy init exceptions (e.g. no session).
 * 
 * Note that the methods in here are called out of process/out of machine; e.g. there
 * may or may not be any local references to the methods so when deleting methods 
 * they must go through a formal deprecation process, as this constitutes a public
 * API.
 * 
 * @author rleuthner
 *
 */

@ApplicationPath("/")
public class RestApplication extends Application {
}
