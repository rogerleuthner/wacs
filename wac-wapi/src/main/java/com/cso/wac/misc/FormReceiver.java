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

package com.cso.wac.misc;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

import javax.ejb.EJB;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.services.misc.AggregateService;
import com.cso.wac.web.WACSession;

/**
 * Servlet responsible for receiving and processing form submissions.
 *
 * @author rleuthner
 *
 */

@WebServlet(
	name="FormReceiver",
	urlPatterns={"/FormReceiver"} )
@MultipartConfig
public class FormReceiver  extends HttpServlet {

	private static final long serialVersionUID = 1L;
	private static ObjectMapper mapper;

	@EJB
	private AggregateService service;

	@EJB
	private WACSession sessions;

	public FormReceiver() {
		super();
	}

	@Override
	public void init() {
		mapper = new ObjectMapper();
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		resp.setContentType("application/json");
		resp.setCharacterEncoding("UTF-8");
		PrintWriter writer = resp.getWriter();
		writer.write("You must use POST to the form receiver");
		writer.flush();
		resp.flushBuffer();
	}

	@Override
	protected void doPost( HttpServletRequest request, HttpServletResponse response ) throws ServletException, IOException {
		response.setContentType( "text/html;charset=UTF-8" );

		boolean success = false;

		Map<String,String>formValues = null;
		try {

			Object o = request.getParameter( "form_data" );
			if ( o != null ) {
				success = true;
				formValues = mapper.readValue( (String)o,
								mapper.getTypeFactory().constructMapType( Map.class, String.class, String.class ) );

				System.out.println( formValues.toString() );
			}

		} finally {
			if ( success ) {
//				service.formUploaded( fileName, filePath, "File uploaded", EventSeverity.NORMAL, 1001L, 1000L );

				Map<String,Object>map = new HashMap<String,Object>();
				map.put( "channel_number", formValues != null ? formValues.get( "channel_number" )  : "Not provided" );
				map.put( "FORM SUBMITTED", "Guardian Angel Consolidated Channel Report" );
//				sessions.sendEventMessage("formUpload", map, 1001L );
				response.setStatus( HttpServletResponse.SC_OK);
			} else {
				// TODO
				// some error condition, table flag, etc.
			}
		}
	}
}