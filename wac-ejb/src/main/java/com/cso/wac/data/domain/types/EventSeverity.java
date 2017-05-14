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

import java.awt.Color;

/**
* Message severity - mapped to the threat levels
* 
* 0 (default) normal  (green)
* 1 elevated (yellow)
* 2 severe (red)
*/

public enum EventSeverity {

	NORMAL( "Normal - default level", Color.WHITE ),
	ELEVATED( "Elevated - some urgency", Color.YELLOW ),
	SEVERE( "Most urgent", Color.RED );
	
	private String description;
	private Color color;
	
	private EventSeverity( String description, Color color ) {
		this.description = description;
		this.color = color;
	}
	
	public String getDescription() { return description; }
	public Color getColor() { return color; }	
}
