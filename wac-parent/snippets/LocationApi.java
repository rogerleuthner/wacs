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

package com.tf.wac.wapi;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Resource;
import javax.ejb.EJB;
import javax.ejb.EJBContext;
import javax.ejb.Stateless;
import javax.interceptor.AroundInvoke;
import javax.interceptor.Interceptors;
import javax.interceptor.InvocationContext;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.SecurityContext;

import com.tf.wac.data.domain.Location;
import com.tf.wac.data.services.location.LocationService;
import com.tf.wac.web.WACSession;

/**
 * Not currently used; this implements manual security via EJB security context/ interceptors
 * and is kept merely as a snippet
 * 
 * @author rleuthner
 *
 */

@Stateless
@Path("/locations")
@Interceptors ({ApiErrorInterceptor.class,SecurityInterceptor.class})
//@DeclareRoles({"other"})
//@RolesAllowed({"wac-user-role"})  // wac-user-role can invoke all; can specifically limit particular methods by overriding on the method
public class LocationApi {

	public LocationApi() {}
	
	@EJB
	private LocationService service;
				
	// @Resource
	// private SessionContext ctx;
	// ctx.getCallerPrincipal();
	
	@Context HttpHeaders h;
	
	// TODO don't currently use SecurityContext; if not useful remove it
	
	@GET
	@Produces( MediaType.APPLICATION_JSON )
	@Path("/getAll")
	public LocationResponse getAll( @Context HttpHeaders hh, @Context SecurityContext ss ){						
		LocationResponse response = new LocationResponse();
		List<Location> locations = new ArrayList<Location>();
		locations = service.getAll();
		response.setPayload(locations);
		response.setStatus(LocationResponse.STATUS_SUCCESS);				
		return  response;	
	}
	
	@GET
	@Produces( MediaType.APPLICATION_JSON )
	@Path("/findByName/{name}")	
	public Location findByName( @PathParam( "name" ) String name ) {
		return service.findByName( name );
	}
	
	/* sample for manual authentication */
	@GET
	@Produces( MediaType.APPLICATION_JSON )
	@Path("/sample")	
	public Location sampleManualAuthenticate( @Context SecurityContext sc ) {
		if ( sc.isUserInRole( "some role" ) )
			return null; // some execution
		return null;
	}	
	
	@POST
	@Consumes( MediaType.APPLICATION_JSON )
	@Path("/save")		
	public LocationResponse save( Location location ) {
		service.save( location );
		LocationResponse response = new LocationResponse();
		response.setStatus( LocationResponse.STATUS_SUCCESS );
		response.setPayload(location);
		return response;
	}	

	@GET
	@Produces( MediaType.APPLICATION_JSON )
	@Path("/findById/{id:[0-9]{1,10}}")	
	public LocationResponse findById( @PathParam( "id" ) long id ) {
		Location l = service.findById( id ); 		
		LocationResponse response = new LocationResponse();
		response.setPayload( l );
		response.setStatus(LocationResponse.STATUS_SUCCESS);
		return response;
	}
}

/**
 * Set up for method execution.
 * Check some basic programming conditions:
 *  - required parameters
 * 
 * Handle error emission propagating to the front end.  
 *   
 * @author rleuthner
 *
 */
class ApiErrorInterceptor {
	@AroundInvoke
	public Object handleErrors( InvocationContext ctx ) throws Exception {
		try { 
			Object[] parms = ctx.getParameters();
			if ( parms == null || ! ( parms.length >= 1 ) ) {
				throw new Exception( "Programming error: all exposed REST methods must pass in the http headers as first argument" );
			}
			
			return ctx.proceed();
		} catch ( Exception e ) {
			LocationResponse response = new LocationResponse();
			response.setStatus( LocationResponse.STATUS_FAILURE );  // could get finer-grained here
			response.setCode( HttpServletResponse.SC_EXPECTATION_FAILED );
			response.setMessage( e.getMessage() );
			// the response object is interpreted by the RestangularProvider.setResponseExtractor()
			return response;
		} finally {
			// completed successfully
		}		
	}	
}

/*
 * Self contained interceptor; finds http headers from calling method's parameter list,
 * checks to see if the session is an authenticated wac session.
 */

class SecurityInterceptor {
	@EJB
	private WACSession wacSession;
	
	@Resource 
	private EJBContext ctx;
	@AroundInvoke
	protected Object audit( InvocationContext ictx ) throws Exception {
		
//		Object[] parms = ictx.getParameters();
//		HttpHeaders h = (HttpHeaders) parms[ 0 ];
//		MultivaluedMap<String, String> headerParams = h.getRequestHeaders();
//		
//		System.out.println( wacSession.toString() );
//		
//		Principal p = ctx.getCallerPrincipal();
//		System.out.println( "Invoke by: " + p.getName() );
		return ictx.proceed();
	}
}

