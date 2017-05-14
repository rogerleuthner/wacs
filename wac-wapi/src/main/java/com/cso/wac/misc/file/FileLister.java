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

package com.cso.wac.misc.file;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
/**
 * Crude file listing service
 * 
 * @author rleuthner
 * 
 * TODO don't assemble the JSON output manually
 */
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

@WebServlet(name = "FileLister", urlPatterns = { "/FileLister" })
public class FileLister extends FileServiceBase {

	private static final long serialVersionUID = 1L;

	public FileLister() {
		super();
	}
	
	@Override 
	public void init( ServletConfig config ) {
		super.init( config );
	}

	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
				
		final File file = new File(filePath);
		response.setContentType("text/event-stream");
		PrintWriter writer = null;
		int status = HttpServletResponse.SC_OK;
		
		try {
			
			writer = response.getWriter();				
			final String[] files = file.list();
			if ( files != null ) {
			
				boolean first = true;
				
				writer.write( "[" );
				
				for( String s : file.list() ) {
					if ( ! first ) {
						writer.write( "," );
					}
					writer.write( "\"" + s + "\"" );
					first = false;
				}
		
				writer.write( "]" );
			}
			
		} catch ( Exception e ) {
			status = HttpServletResponse.SC_NOT_FOUND;
			writer.write( e.getMessage() );
		} finally {
			response.setStatus( status );
			writer.flush();
			response.flushBuffer();		
		}
	}

	@Override
	protected void checkParms( EventParms ep ) throws ServletException {
		return;
	}
}