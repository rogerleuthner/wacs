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

package com.cso.wac.web;

import java.util.Arrays;

/**
 * A app ID is generated from the app name and an id string specific to the app instance.
 * The hashed string is padded to be a specific length so the two components may be concatenated and then
 * passed around as a single unit, yet easily parse out the name and instance id.  The id part is consistently
 * generated, so non-cooperative processes may independently generate the identical key given the same starting
 * inputs.
 *
 * The end result is that we can run separate instances of the same app that are uniquely identified,
 * for example if we run two "Form" apps with different forms in each, the specific string part should
 * be derived from the form content so that multiple users of that form content end up sharing a app
 * 'state' in the backend, while form apps with different forms would not share between those 'instances'.
 *
 * @author rleuthner
 *
 */

public class AppUtil {

	private static final int UID_LENGTH = 10;
	public static final char WILD = '*';

	public static String PADDED_WILDCARD;
	// since the endpoints handle the app identifier fully padded out whether it's a wildcard or not,
	// we build a static representation of the wildcard 'id' part to compare the app id with.
	// since this is a little expensive and the endpoints needs to do this frequently, make it static
	// and also centralize here so that the knowledge is not spread out
	static {
		char t[] = new char[ UID_LENGTH ];
		Arrays.fill( t, WILD );
		PADDED_WILDCARD = new String( t );
	}

	/**
	 * Return wildcard string fully padded out.
	 *
	 * @return
	 */

	public static String pad( String target ) {
		int len = target.length();

		if ( len < UID_LENGTH ) {
			char[] pads = new char[ UID_LENGTH - len ];
			Arrays.fill( pads, WILD );
			return new String( pads ) + target;
		}

		return target.substring( 0, UID_LENGTH );
	}

	// returns fixed length (UID_LENGTH) string, either all 'padder' chars or unique string padded with padder chars
	private static String generateUID( String in ) {
		String uid;
		if ( in == null || in.length() == 0 || in.equals( String.valueOf( WILD ) ) ) {
			uid = pad( in );
		} else {
			uid = pad( Integer.toString( Math.abs( in.hashCode() ) ) );
		}

		return uid;
	}

	public static String getAppId( String name, String desc ) {
		return name + generateUID( desc );
	}

	public static String getAppName( String appId ) {
		return appId.substring(0, appId.length() - UID_LENGTH );
	}

	public static String getAppUID( String appId ) {
		return appId.substring( appId.length() - UID_LENGTH );
	}

}