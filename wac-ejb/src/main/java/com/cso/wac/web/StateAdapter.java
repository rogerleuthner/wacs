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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.domain.AppState;
import com.cso.wac.exc.JSONParseException;
import com.cso.wac.exc.ProgrammingException;

/**
 * UNUSED, intended use:
//		List<String>wsm = getAppMessages( chId, wuid );
//		if ( wsm != null ) {
//			try {
//				return StateAdapterFactory.get( AppUtil.getAppName( wuid ) ).getState( wsm );
//
//			} catch (JSONParseException e) {
//				Logger.getLogger( WACSession.class ).info( "Failed to derive state from collab messages for: " + wuid );
//			}
//		}
 *
 *
 * Derive app state from list of collaboration messages.  Since this will differ per app,
 * interface implementations correspond to (front end) app 'classes'.  Since they're written
 * in amorphous technology (e.g. javascript) creating interfaces that the front ends actually
 * adhere to is more of an exercise in convention than imposition.
 *
 * This only has to be done for apps that store persistent state into the database -
 * non-persistent collaborative app uses will usually just be able to retrieve the collab message
 * que and apply the message to their instance.
 *
 * @author rleuthner
 *
 */

/**
 * Deliver state in app-specific expected format regardless of origin (database, collab messages)
 *
 * @author rleuthner
 *
 */
public abstract class StateAdapter {
	/**
	 * Develop state string from the collab messages
	 *
	 * @param messages
	 * @return
	 * @throws JSONParseException
	 */
	abstract String getState( List<String>messages ) throws JSONParseException;
	/**
	 * Create wrapped state from the database input
	 *
	 * @param state
	 * @return
	 * @throws JsonProcessingException
	 */
	abstract String getState( String state ) throws JsonProcessingException;
}

class StateAdapterFactory {
	public static StateAdapter get( AppState ws ) {
		return get( ws.getName() );
	}
	public static StateAdapter get( String name ) {
		switch( name ) {
			case "editor":
				return new Editor();
			default:
				throw new ProgrammingException( "Don't yet know how to produce adapter for: " + name );
		}
	}
}

/**
 * Front end app-specific implementation knowledge is encoded herein.
 * e.g. 'Editor' instance knows that state is contained within the last 'unlock' message
 * that has an associated non-null 'data' node as implemented in the javascript code
 *
 * @author rleuthner
 */
class Editor extends StateAdapter {
	private static ObjectMapper mapper;

	public Editor() {
		mapper = new ObjectMapper();
	}

	@Override
	public String getState(List<String> messages) throws JSONParseException {
		// data to restore will be in the most recent 'unlock' that
		// has an associated data element (might be empty, but the 'data' will be defined).
		// this is a little brittle.
		try {
			String[] m = messages.toArray(new String[0]);

			for( int i = m.length - 1; i >= 0; i-- )  {
				Map<String, String>map = mapper.readValue( m[ i ], Map.class );
				String cmd = map.get( "op" );
				if ( cmd != null && cmd.equals( "unlock" ) ) {
					String data = map.get( "data" );
					if ( data != null && data.length() > 0 ) {
						return data;
					}
				}
			}
		} catch ( Exception e ) {
			throw new JSONParseException( e.getMessage() );
		}

		String state = null;
		return state;
	}

	@Override
	String getState(String state) throws JsonProcessingException {
		Map<String,String>map = new HashMap<String,String>();
		map.put( "data",  state );
		return mapper.writeValueAsString( map );
	}
}

class Annotation extends StateAdapter {
	@Override
	String getState(List<String> messages)throws JSONParseException {
		return null;
	}

	@Override
	String getState(String state) throws JsonProcessingException{
		// TODO Auto-generated method stub
		return null;
	}
}

class Note extends StateAdapter {
	@Override
	String getState(List<String> messages) throws JSONParseException{
		return null;
	}

	@Override
	String getState(String state) throws JsonProcessingException{
		// TODO Auto-generated method stub
		return null;
	}
}