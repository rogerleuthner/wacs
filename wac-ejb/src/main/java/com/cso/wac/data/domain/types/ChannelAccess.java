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
 * Define text roles as expected in web.xml configs and JEE security configs; e.g.
 * <param-value>WAC_CONTROLLER, WAC_PLAYER</param-value>
 * or
 * @RolesAllowed( {"WAC_CONTROLER", "ROLE_ADMIN"} )
 * 
 * @author rleuthner
 *
 */

public enum ChannelAccess {
	
	// arranged in order, whereby farther down implies inclusion of all above (might want to reverse that)
	
	WAC_PLAYER("WAC_PLAYER" ),  // channel participant, not an WAC user
	ROLE_USER( "ROLE_USER" ),  // OWF login, required by all (spring artifact) login users, not channel specific
	WAC_OBSERVER( "WAC_OBSERVER" ),  // channel read-only user, perchannels channel level
	WAC_USER ("WAC_USER" ),  // regular channel user, perchannels channel level
	WAC_CONTROLLER( "WAC_CONTROLLER" ),  // add/delete users from channel, configure channel, perchannel channel level
	WAC_SUPER( "WAC_SUPER" ),  // channel administrator; create channels, assign users, not channel specific
	ROLE_ADMIN( "ROLE_ADMIN" );  // OWF admin, console setupers (spring artifact), not channel specific; implies WAC_ADMIN??
	
	private String role;
	
	ChannelAccess( String grantedRole ) {
		this.role = grantedRole;
	}
	
	public String getRole() { 
		return role; 
	}
}
