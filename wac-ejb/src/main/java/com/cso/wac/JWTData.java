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

package com.cso.wac;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.exc.JSONParseException;

/**
 * JWT main application-data payload
 * 
 * @author rleuthner
 *
 */

public class JWTData {
	private String userId;
	private String[] roles;
	private Long chId;
	private static ObjectMapper mapper = new ObjectMapper();
	public JWTData() {}
	public JWTData( String userId, String[] roles, Long chId ) {
		this.userId = userId;
		this.roles = roles;
		this.chId = chId;
	}
	public static JWTData JWTWACDataFactory( String json ) throws JSONParseException {
		try {
			return mapper.readValue( json, JWTData.class );
		} catch ( Exception e ) {
			throw new JSONParseException( e.getMessage() );
		}
	}
	public String getUserId() {
		return userId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	public String[] getRoles() {
		return roles;
	}
	public void setRoles(String[] roles) {
		this.roles = roles;
	}
	public Long getChId() {
		return chId;
	}
	public void setChId(Long chId) {
		this.chId = chId;
	}

}
