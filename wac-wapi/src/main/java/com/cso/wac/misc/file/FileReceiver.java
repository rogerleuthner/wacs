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

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import javax.ejb.EJB;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import com.cso.wac.data.domain.FileEntry;
import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.data.domain.types.Events;
import com.cso.wac.data.services.misc.AggregateService;
import com.cso.wac.web.WACSession;

/**
 * Crude service for receiving file uploads from the Assets Manager
 *
 * @author rleuthner
 *
 */

@WebServlet(
	name="FileReceiver",
	urlPatterns={"/FileReceiver"} )
@MultipartConfig
public class FileReceiver extends FileServiceBase {

	private static final long serialVersionUID = 2443733652416461345L;

	@EJB
	private AggregateService service;

	@EJB
	private WACSession sessions;

	public FileReceiver() {
		super();
	}

	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
		super.service(request, response);
		final EventParms eventParms = new EventParms( request );

		response.setContentType( "text/html" );

		final Part filePart = request.getPart( "Filedata" );
		final String fileName = getFileName( filePart );
		final String fileType = getFileType( filePart );

		OutputStream out = null;
		InputStream filecontent = null;
		final PrintWriter writer = response.getWriter();
		boolean success = false;
// TODO the non-web portion of this needs to be moved into the FileEntryService
		try {
			//first, make sure the directory exists
			Paths.get( filePath, eventParms.getChId().toString() ).toFile().mkdirs();
			out = new FileOutputStream( Paths.get( filePath, eventParms.getChId().toString(), fileName ).toFile() ) ;

			filecontent = filePart.getInputStream();

			int read = 0;
			final byte[] bytes = new byte[1024];

			while (( read = filecontent.read(bytes) ) != -1) {
				out.write( bytes, 0, read );
			}
//			writer.println( "New file created at " + filePath );
			success = true;

		} catch (FileNotFoundException fne) {
			response.setStatus( HttpServletResponse.SC_NOT_FOUND );
			writer.println("You either did not specify a file to upload or are "
					+ "trying to upload a file to a protected or nonexistent "
					+ "location.");
			writer.println("  ERROR: " + fne.getMessage());

		} finally {
			FileEntry file;
			if (out != null) {
				out.close();
			}
			if (filecontent != null) {
				filecontent.close();
			}
			if ( success ) {

				file = service.fileUploaded( fileName, filePath, "Uploaded file", EventSeverity.NORMAL, eventParms.getChId(), eventParms.getUserId() );
				if (writer != null) {
					String json_string = file.getJSON();
			        writer.println(json_string);
					writer.close();
				}

				try {
					Map<String,Object>map = new HashMap<String,Object>();
		    		map.put( "data", file.getJSON() );
					sessions.sendToSubscribers( Events.FILE_ADD.getEvent(), map, eventParms.getChId() );
				} catch (Exception e) {
					throw new ServletException( e.getMessage() );
				}
			} else {
				// TODO
				// some error condition, table flag, etc.
			}
		}

	}

	@Override
	protected void checkParms( EventParms eventParms ) throws ServletException {
		// noop - this is for GET
	}

	private String getFileName(final Part part) {
		for ( String content : part.getHeader( "content-disposition" ).split( ";" ) ) {
			if ( content.trim().startsWith( "filename" )) {
				return content.substring( content.indexOf( '=' ) + 1 ).trim().replace( "\"", "" );
			}
		}
		return null;
	}

	private String getFileType(final Part part) {
		for ( String content : part.getHeader( "content-type" ).split( ";" ) ) {
			return content;
		}
		return null;
	}

}