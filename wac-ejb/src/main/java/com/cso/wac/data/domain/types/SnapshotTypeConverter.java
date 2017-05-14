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
 * Handle enum value to/from database column; this one handles null columns as SnapshotType.GENERIC
 *
 * @author rleuthner
 *
 */

@Converter
public class SnapshotTypeConverter implements AttributeConverter<SnapshotType, String> {

	@Override
	public String convertToDatabaseColumn( SnapshotType attribute ) {
		if ( attribute == null ) {
			return SnapshotType.GENERIC.toString();
		}
		return attribute.toString();
	}

	@Override
	public SnapshotType convertToEntityAttribute( String dbdata ) {
		try {
			if ( dbdata == null ) {
				return SnapshotType.GENERIC;
			}
			return SnapshotType.valueOf( dbdata );
		} catch( Exception e ) {
			// TODO configurationexception
			throw new ProgrammingException( "Bad file type: " + dbdata + ": " + e.getMessage() );
		}
	}
}
