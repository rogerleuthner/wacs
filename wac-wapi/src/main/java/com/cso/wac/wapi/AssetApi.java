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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.io.FileUtils;
import org.apache.poi.util.IOUtils;

import com.cso.wac.data.domain.FileEntry;
import com.cso.wac.data.domain.types.Events;
import com.cso.wac.data.services.ConfigService;
import com.cso.wac.data.services.WebLinkService;
import com.cso.wac.data.services.misc.FileConvertService;
import com.cso.wac.data.services.misc.FileEntryService;
import com.cso.wac.exc.PersistenceException;
import com.cso.wac.wapi.secure.SecurityInterceptor;
import com.cso.wac.web.WACSession;

/**
 * Basic 'Asset' (file) management
 *
 * @author rleuthner
 *
 */

@Path("/asset")
public class AssetApi {

	@EJB
	private FileEntryService fileService;

	@Inject
	private HttpServletRequest request;

	@EJB
	private ConfigService configService;

	@EJB
	private WACSession sessions;

	@EJB
	private WebLinkService weblinkService;

	@EJB
	private FileConvertService fileConverter;

	public AssetApi() {
	}

    @GET
    @Path( "/list" )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
    public List<FileEntry> list() throws IOException {
    	 return fileService.getFileEntries( SecurityInterceptor.getChanId( request ) );
    }

    /**
     * Produce asset as an text/html document given it's path relative to CONFIG uploads directory
     *
     * @return
     * @throws IOException
     */
    @GET
    @Path( "/textfile/{fileName}" )
    @Produces( MediaType.TEXT_HTML )
	@RolesAllowed( "ROLE_USER" )
    public String getFileText( @PathParam( "fileName" ) String fileName ) throws IOException {
    	String path = Paths.get( configService.get( ConfigService.KEY_FILESHARE_PATH ), SecurityInterceptor.getChanId( request ).toString(), fileName ).toString();
    	return FileUtils.readFileToString( new File( path ) );
    }

    /**
     * Produce asset as a jpeg given it's path relative to CONFIG uploads directory
     *
     * @return
     * @throws IOException
     */
    @GET
    @Path( "/imagefile/{fileName}" )
    @Produces( "image/jpeg" )
	@RolesAllowed( "ROLE_USER" )
    public byte[] getImageFile( @PathParam( "fileName" ) String fileName ) throws IOException {

		File f = Paths.get( configService.get( ConfigService.KEY_FILESHARE_PATH ), SecurityInterceptor.getChanId( request ).toString(), fileName ).toFile();

		//String t = Files.probeContentType(Paths.get( basePath + File.separator + SecurityInterceptor.getChId( request ).toString() + File.separator + fileName ));
		// if this isn't a file recognized as an image, try to do a conversion?

    	byte[] b =  IOUtils.toByteArray( new FileInputStream( f ) );

    	return b;
    }

    @POST
    @Path( "/remove" )
    @Consumes( MediaType.APPLICATION_JSON )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
    public Boolean removeAsset( String json ) throws IOException {
    	Long id = fileService.remove( json );
    	if ( id != null ) {
    		HashMap<String,Object>hm = new HashMap<String,Object>();
    		hm.put( "data", "{\"id\":\"" + id.toString() + "\"}" );
			sessions.sendToSubscribers( Events.FILE_REMOVE.getEvent(), hm, SecurityInterceptor.getChanId( request ) );
    		return true;
    	}
    	return false;
    }

    @POST
    @Path( "/update" )
    @Consumes( MediaType.APPLICATION_JSON )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
    public Long updateAsset( String json ) throws InternalException {
    	FileEntry file;
    	try {
    		file = fileService.update( json );
    		HashMap<String,Object>hm = new HashMap<String,Object>();
    		hm.put( "data", json );
    		sessions.sendToSubscribers( Events.FILE_CHANGE.getEvent(), hm, SecurityInterceptor.getChanId( request ) );
		} catch (PersistenceException e) {
			throw new InternalException( e.getMessage() );
		}

    	return file.getId();
    }

    /**
     * Utility to post 'smallish' text/string into a file.  The string is converted in memory, thus the size matters.
     *
     * @param fileName
     * @param str
     * @return
     * @throws InternalException
     */
    @POST
    @Path( "/strtoasset/{filename}" )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
    public ResponsePkg createAssetFrombStr( @PathParam( "filename" ) String fileName, String str ) throws InternalException {
		ResponsePkg rp = new ResponsePkg();
		FileEntry file = null;
    	try {
    		file = fileService.writeNewAsset( new ByteArrayInputStream( str.getBytes() ), fileName,
    				SecurityInterceptor.getChanId( request ), SecurityInterceptor.getUserName( request ) );

    		HashMap<String,Object>hm = new HashMap<String,Object>();
    		hm.put( "data", file.getJSON( ) );

    		sessions.sendToSubscribers( Events.FILE_ADD.getEvent(), hm, SecurityInterceptor.getChanId( request ) );
		} catch (PersistenceException e) {
			throw new InternalException( e.getMessage() );
		}

		rp.setStatus( Response.Status.OK );
		return rp;
    }

    /**
     * Fetch web resources and write it as a new asset (creating FileEntry as well).
     *
     * @param id of tofetch resource
     * @param surl
     * @return
     * @throws InternalException
     */
    @GET
    @Path( "/fetchresource/{id}/{url}" )
    @Produces( MediaType.APPLICATION_JSON )
	@RolesAllowed( "ROLE_USER" )
    public String fetchResource( @PathParam( "id" ) Long id, @PathParam( "url" ) String surl ) throws InternalException {

    	URL url;
    	HttpURLConnection c = null;
    	try {
	    	url = new URL( surl );
    		c = (HttpURLConnection)url.openConnection();
	    	c.setRequestProperty( "User-Agent", "Mozilla/5.0" );
	    	if ( c.getResponseCode() != 200 ) {
	    		throw new InternalException( "Failed to retrieve web resource: " + surl + "; reason: " + c.getResponseMessage() );
	    	}

    	} catch ( Exception e ) {
    		throw new InternalException( "Failed to retrieve web resource: " + surl + "; reason: " + e.getMessage() );
    	}

    	String fileName = surl.substring( surl.lastIndexOf( '/' ) + 1, surl.length() );

    	try {
    		FileEntry file = fileService.writeNewAsset( c.getInputStream(), fileName, surl, SecurityInterceptor.getChanId( request ), SecurityInterceptor.getUserName( request ) );
    		weblinkService.remove( id );
    		HashMap<String,Object>hm = new HashMap<String,Object>();
    		// need to add id of old row
    		HashMap<String,String>moreFields = new HashMap<String,String>();
    		moreFields.put( "oldId", id.toString() );
    		hm.put( "data", file.getJSON( moreFields ) );
			sessions.sendToSubscribers( Events.FILE_FETCH.getEvent(), hm, SecurityInterceptor.getChanId( request ) );

    	} catch ( Exception e ) {
    		throw new InternalException( e.getMessage() );

    	} finally {
	    	if ( c != null ) {
				c.disconnect();
			}
    	}

    	return fileName;
    }

    /**
     * Convert the input file and save to a new file with different suffix; add the new file to FileEntry
     *
     * TODO converter RARELY converts a .pdf file into a usable .html form with this technology
     *
     * @param json
     * @return
     * @throws InternalException
     */
    @GET
    @Path( "/convert/{filename}" )
    @Consumes( MediaType.APPLICATION_JSON )
    @Produces( MediaType.APPLICATION_JSON )
    @RolesAllowed( "ROLE_ADMIN" )
    public String updateWebLink( @PathParam( "filename" ) String fileName ) throws InternalException {
    	String newName = null;

    	try {
    		// TODO hardcoding expectation of .pdf and generating .html

    		int idx = fileName.toLowerCase().lastIndexOf( ".pdf" );
    		newName = fileName.substring( 0, idx ) + ".html";

    		String html = fileConverter.convert2Dom( fileName, SecurityInterceptor.getChanId( request ) );
    		ByteArrayInputStream bis = new ByteArrayInputStream( html.getBytes( StandardCharsets.UTF_8 ) );
    		fileService.writeNewAsset( bis, newName, "(converted " + fileName + ")",SecurityInterceptor.getChanId( request ), SecurityInterceptor.getUserName( request ) );

		} catch (PersistenceException e) {
			throw new InternalException( e.getMessage() );
		}

    	return newName;
    }

}