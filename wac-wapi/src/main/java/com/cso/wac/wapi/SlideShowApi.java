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

package com.cso.wac.wapi;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response.Status;

import com.cso.wac.data.services.ConfigService;
import com.cso.wac.data.services.misc.FileConvertService;
import com.cso.wac.data.services.misc.FileEntryService;
import com.cso.wac.exc.FailedConvertException;
import com.cso.wac.wapi.secure.SecurityInterceptor;

/**
 * Slide show API.
 *
 * Convert slide show, extract and deliver frames
 *
 * @author rleuthner
 *
 */

@Path("/ss")
public class SlideShowApi {

	@EJB
	private FileEntryService fileService;

	@EJB
	private ConfigService configService;

	@EJB
	private FileConvertService fileConverter;

	@Inject
	private HttpServletRequest request;

	public SlideShowApi() {
	}

    @GET
    @Path( "/convert/{file}" )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_ADMIN" )
    public ResponsePkg convert( @PathParam( "file" ) String file ) throws FailedConvertException {
    	SlideShowDescriptor descriptor = new SlideShowDescriptor( file );
		ResponsePkg rp = new ResponsePkg();
		rp.setData( descriptor );
		descriptor.setFrames( fileConverter.convert( file, SecurityInterceptor.getChanId( request ) ) );
		descriptor.setMess( "Converted" );
		rp.setStatus( Status.OK );

    	return rp;
    }

    @GET
    @Path( "/slide/{origFile}/{page}" )
    @Produces( "image/jpeg" )
    @RolesAllowed( "ROLE_USER" )
    public byte[] getSlide( @PathParam( "origFile" ) String origFile, @PathParam( "page" ) String page ) throws InternalException {
    	try {
			return fileConverter.getSlide( origFile, SecurityInterceptor.getChanId( request ), Integer.parseInt( page ) );
		} catch ( Exception e) {
			throw new InternalException( e.getMessage() );
		}
    }
}

/**
 * Result of a conversion operation.
 * inputFile - original input file name to convert.  Findable within the channel assets.
 * mess - message, mostely to indicate problem in an error return.
 * frames - number of frames to expect in the converted slideshow.
 *
 * @author rleuthner
 *
 */
class SlideShowDescriptor {
	private String inputFile;
	private String mess;
	private int frames;

	public SlideShowDescriptor( String file ) {
		inputFile = file;
		frames = 0;
	}

	public int getFrames() {
		return frames;
	}

	public void setFrames(int frames) {
		this.frames = frames;
	}

	public String getMess() {
		return mess;
	}

	public void setMess(String mess) {
		this.mess = mess;
	}

	public String getInputFile() {
		return inputFile;
	}
}