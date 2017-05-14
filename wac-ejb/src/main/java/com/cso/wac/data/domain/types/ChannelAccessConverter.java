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

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

import com.cso.wac.exc.ProgrammingException;

/**
 * Handle enum value to/from database column
 * 
 * @author rleuthner
 *
 */

@Converter
public class ChannelAccessConverter implements AttributeConverter<ChannelAccess, String> {

	@Override
	public String convertToDatabaseColumn( ChannelAccess attribute ) {
		return ( attribute ).getRole();		
	}

	@Override
	public ChannelAccess convertToEntityAttribute( String dbdata ) {
		try {
			return ChannelAccess.valueOf( dbdata );
		} catch ( Exception e ) {
			// TODO configuration exception
			throw new ProgrammingException( "Need to add type for: " + dbdata + " :" + e.getMessage() );
		}
	}
}
