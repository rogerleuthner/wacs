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

/**
 * ProcessingTimer.java
 *
 * @author rleuthner
 * Apr 5, 2012
 */
package com.cso.wac;

import javax.ejb.Schedule;
import javax.ejb.Singleton;
/**
 * @author rleuthner
 *
 */

@Singleton
public class ProcessingTimer {
	
	@Schedule(second="*/10", minute="5", hour="*", persistent=false)
	public void process() {
		//System.out.println( "5 min, 10 second processing interval!!" );
	}

//	@Schedule( second = "*/15", minute = "*", hour = "*", persistent = false )
//	public void process2() {
//		System.out.println( "15 second processing interval!!" );
//	}
}
