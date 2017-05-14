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

import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Paths;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Service for producing a file for download
 *
 * @author rleuthner
 *
 */

@WebServlet(name = "FileProducer", urlPatterns = { "/FileProducer" })
@MultipartConfig
public class FileProducer extends FileServiceBase {

	private static final long serialVersionUID = 1L;

	public FileProducer() {
		super();
	}

	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {

		final String fileName = request.getParameter( "file" );
		if ( fileName == null || fileName.isEmpty() ) {
			throw new ServletException( "Missing required 'file' parameter" );
		}

		final File file = Paths.get( filePath, fileName ).toFile();
		int length = 0;
		final ServletOutputStream outStream = response.getOutputStream();
		String mimetype = request.getServletContext().getMimeType(filePath);

		// sets response content type
		if (mimetype == null) {
			mimetype = "application/octet-stream";
		}
		response.setContentType(mimetype);
		response.setContentLength((int) file.length());

		// sets HTTP header
		response.setHeader("Content-Disposition", "attachment; filename=\""
				+ fileName + "\"");

		byte[] byteBuffer = new byte[BUFSIZE];
		DataInputStream in = new DataInputStream(new FileInputStream(file));

		// reads the file's bytes and writes them to the response stream
		while ((in != null) && ((length = in.read(byteBuffer)) != -1)) {
			outStream.write(byteBuffer, 0, length);
		}

		in.close();
		outStream.close();
	}

	@Override
	protected void checkParms( EventParms ep ) throws ServletException {
		// no parms required
	}

}