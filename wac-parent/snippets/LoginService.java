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

package com.tf.wac.web;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Enumeration;

import javax.ejb.EJB;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.tf.wac.JWTService;


@WebServlet( urlPatterns={"/j_security_check"} )
public class LoginService extends HttpServlet {

	private static final long serialVersionUID = 1L;
	
	@EJB
	private JWTService jwt;
	
	public LoginService() {
		super();
		System.out.println("FOOKME");
	}
	
	@Override
	public void init() throws ServletException {
		System.out.println("FOKKKK");
	}

	@Override
	public void destroy() {
		super.destroy();
	}

	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
		response.setContentType("text/html");
		PrintWriter out = response.getWriter();

//		if ( jwt == null ) {
//			System.out.println( "EJB injection in sibling projects DOES NOT work" );
//		} else {
//			try {
//				System.out.println( "EJB injection in sibling projects WORKS: " + jwt.buildJwsJwt( "a fokker", "wac" ) );
//			} catch (NoSuchAlgorithmException e) {
//				// TODO Auto-generated catch block
//				e.printStackTrace();
//			} catch (JOSEException e) {
//				// TODO Auto-generated catch block
//				e.printStackTrace();
//			}
//		}
				
		
		
//		out.println("This is the Crap Test Servlet");
String cookie = null;

System.out.println( request.getRemoteUser() );
System.out.println( request.getUserPrincipal() );
System.out.println( request.getAuthType() );

		Enumeration headerNames = request.getHeaderNames();
		while (headerNames.hasMoreElements()) {
			String headerName = (String) headerNames.nextElement();
			out.print("<br/>Header Name: <em>" + headerName);
			if ( headerName.equals( "Cookie" ) ) {
				String t = request.getHeader(headerName);
				if ( t.startsWith( "JSESSIONID" ) ) {
					cookie=t;
				}
			}
			System.out.println("Header Name: " + headerName);
			String headerValue = request.getHeader(headerName);
			out.print("</em>, Header Value: <em>" + headerValue);
			System.out.println("Header Value: " + headerValue);
			out.println("</em>");
		}
		
		Cookie c = new Cookie( "OZONELOGIN", "true");
		c.setPath( "/owf" );
		response.addCookie(c);
		
		RequestDispatcher d = getServletContext().getRequestDispatcher( "/index.html" );
		d.forward(request, response);
				

	}
//	@Override
//    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
//	    response.setContentType("text/html");
//	    PrintWriter out = response.getWriter();
//
//	    out.println("<HTML>");
//	    out.println("<HEAD><TITLE>Hello World</TITLE></HEAD>");
//	    out.println("<BODY>");
//	    out.println("<BIG>Hello World</BIG>");
//	    out.println("</BODY></HTML>");
//    }
//	@Override
//    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
//	    response.setContentType("text/html");
//	    PrintWriter out = response.getWriter();
//
//	    out.println("<HTML>");
//	    out.println("<HEAD><TITLE>Hello World</TITLE></HEAD>");
//	    out.println("<BODY>");
//	    out.println("<BIG>Hello World</BIG>");
//	    out.println("</BODY></HTML>");
//    }


}

