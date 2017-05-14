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

package com.cso.wac.bridge;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.security.RolesAllowed;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.apache.commons.codec.binary.Base64InputStream;
import org.apache.log4j.Logger;
import org.jboss.resteasy.plugins.providers.multipart.InputPart;
import org.jboss.resteasy.plugins.providers.multipart.MultipartFormDataInput;

import com.drew.imaging.ImageMetadataReader;
import com.drew.lang.GeoLocation;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.drew.metadata.exif.GpsDirectory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.data.domain.types.Events;
import com.cso.wac.data.services.ConfigService;
import com.cso.wac.data.services.misc.EventNoticeService;
import com.cso.wac.wapi.InternalException;
import com.cso.wac.wapi.secure.SecurityInterceptor;
import com.cso.wac.web.AppUtil;

/**
 * Expose GIS to external systems.
 * To do so we have to connect directly to the GIS WSS.
 *
 * @author rleuthner
 *
 */

@Path("/gis")
public class GISApi {

	@EJB
	private ConfigService configService;

	@EJB
	private EventNoticeService eventNoticeService;

	@Inject
	private HttpServletRequest request;

	private final ObjectMapper mapper;

	public GISApi() throws URISyntaxException {
		mapper = new ObjectMapper();
	}

	private UndertowWssClient getMessageEndpoint( String jws ) throws InternalException {
		String keystore = configService.get( ConfigService.KEY_SSL_KEYSTORE_FILE );
		String keystorePass = configService.get( ConfigService.KEY_SSL_KEYSTORE_PASS );
		String messageService = configService.get( ConfigService.KEY_WSS_MESSAGE_SERVICE );
		URI uri = null;

		try {
			uri = new URI(  messageService + "?target=" + AppUtil.getAppId( "gisannoapp", "*" ) + "&jws=" + jws );
			return new UndertowWssClient( keystore, keystorePass, keystorePass, uri );
		} catch ( Exception e ) {
			throw new InternalException( e.getMessage() + "Attempting undertow connection: " + keystore + "; " + keystorePass + "; " + messageService + "; " + uri.toString() );
		}
	}

	/**
	 * Three possible clients to this:
	 * Simple .html5 form file upload (multipart)
	 * Java API multipart file upload
	 * Simple .html5 Base64 string upload (using HTML5 video element with canvas to take snapshot)
	 *
	 * @param input
	 * @param fileSize
	 * @param fileType
	 * @return
	 * @throws InternalException
	 */

    @POST
    @Path( "/newimage" )
    @RolesAllowed( "ROLE_USER" )
    @Consumes( MediaType.MULTIPART_FORM_DATA )
    @Produces( MediaType.APPLICATION_JSON )
    public Response uploadImage( MultipartFormDataInput input, @HeaderParam("Content-Length") long fileSize, @HeaderParam("Content-Type") String fileType ) throws InternalException {

    	String fileName = null;
    	InputStream istream = null;
    	GpsFileMeta fileMeta = null;
    	String jwt = null;

    	try {
            if ( fileSize > Integer.parseInt( configService.get( ConfigService.KEY_BRIDGE_MAX_UPLOAD_BYTES ) ) ) {
                throw new InternalException( "Image is larger than " + configService.get( ConfigService.KEY_BRIDGE_MAX_UPLOAD_BYTES ) );
            }

	    	Map<String, List<InputPart>>parts = input.getFormDataMap();
	    	List<InputPart>part = parts.get( "targetfile" );  // this must match the form input tag name, e.g. <input type="file" name="targetfile" />
	    	List<InputPart>jwts = parts.get( "jwt" );
	    	List<InputPart>maybefile = parts.get( "filename" );

	    	if ( jwts == null ) {
	    		throw new InternalException( "JWT not found in input field named 'jwt'." );
	    	}

	    	jwt = jwts.get( 0 ).getBodyAsString();
	    	// if the filename is passed as a part, use it (it was manually supplied by java api)
	    	// otherwise, the web form automatically includes it as part of the Content-Disposition header
	    	if ( maybefile != null ) {
	    		fileName = maybefile.get( 0 ).getBodyAsString();
	    	}

	    	for( InputPart ip : part ) {
	    		MultivaluedMap<String,String>headers = ip.getHeaders();

	    		// if filename is not passed in the multipart file post, then try to get it from the headers
	    		if ( fileName == null ) {
	    			fileName = parseFileName( headers );
	    		}
	    		// not in the headers either then we are uploading as a Base64 encoded file, and we don't have a filename at all
	    		// in which case the filename will be gin'ed up in writefile
	    		if ( fileName == null ) {
	    			Logger.getLogger( this.getClass() ).info( "Filename not provided at all, expecting Base64 encoding" );
	    		}

	    		// can't check the type as the java client would have to manually insert it while the form automatically does it for us
//	    		String type = headers.getFirst( "Content-Type" );
//				if ( ! type.equals( "image/jpeg" ) && ! type.equals( "image/png" ) && ! type.equals( "image/gif" ) ) {
//					throw new InternalException( "Image must be jpeg, png or gif" );
//				}
	    		istream = ip.getBody( InputStream.class, null );
	    	}

	    	// if there's a problem with metadata, try to plow ahead and just add the file to assets
	    	try {
	    		fileMeta = getGpsFileMeta( writeFile( istream, fileName ) );
	    	} catch( Exception e ) {
	    		Logger.getLogger( this.getClass() ).info( "Problem getting file meta data: " + e.getMessage() );
	    	}

	    	sendGISUploadMessages( fileMeta, jwt );

	    } catch ( Exception e ) {
	    	// is this right?
	    	throw new InternalException( e.getMessage() );
	    }

        // Return a 201 Created response with the appropriate Location header.
    	return Response.status( Status.CREATED ).entity( fileMeta ).build();
        //return Response.status( Status.CREATED ).location( URI.create( "/" + fileName ) ).build();
    }


    // build and inject GIS-anno compatible messages into the ws endpoint
    private void sendGISUploadMessages( GpsFileMeta meta, String jwt ) throws InternalException {
    	UndertowWssClient wss = null;

    	try {
			sendNewAssetEvent( meta.getFileName() );

			// if there's geo data, place the picture at it's taken location
			if ( meta.getLat() != 0 && meta.getLon() != 0 ) {
				wss = getMessageEndpoint( jwt );
				wss.asyncSend( buildNewPicCmd( meta ) );
			}

		} catch ( JsonProcessingException e ) {
			throw new InternalException( "Bad JSON: " + e.getMessage() );
		} catch ( Exception e ) {
			throw new InternalException( "Endpoint/connection problem: " + e.getMessage() );
		} finally {
			if ( wss != null ) {
				wss.close();
			}
		}
    }

    private void sendNewAssetEvent( String fileName ) {
    	eventNoticeService.createNotice( fileName, Events.FILE_ADD.getEvent(), EventSeverity.NORMAL,
    			SecurityInterceptor.getChanId( request ), SecurityInterceptor.getUserName( request ) );
    }

    // TODO how to share code on constructing this between frontend and backend?????
    private String buildNewPicCmd( GpsFileMeta meta ) throws JsonProcessingException {
    	Map<String,Object>cmd = new HashMap<String,Object>();

    	cmd.put( "cmdType", "wacCmd_NewPic" );
    	cmd.put( "objID", 0 );
    	cmd.put( "imgUrl", configService.getPath( ConfigService.KEY_WAPI_IMAGE_URL, meta.getFileName() ) );
    	cmd.put( "xc", meta.getX() );
    	cmd.put( "yc", meta.getY() );
    	cmd.put( "zc", meta.getZ() );
    	return mapper.writeValueAsString( cmd );
    }

    private GpsFileMeta getGpsFileMeta( File f ) throws Exception {
    	GpsFileMeta gps = null;
    	double alt = 0;
    	GeoLocation l = null;
    	Metadata md = null;
    	try {
	    	md = ImageMetadataReader.readMetadata( f );

	    	GpsDirectory gd = md.getFirstDirectoryOfType( GpsDirectory.class );
	    	if ( gd != null ) {
	    		l = gd.getGeoLocation();
				for( Tag t : gd.getTags() ) {
					if ( t.getTagType() == GpsDirectory.TAG_ALTITUDE ) {
						String s = t.getDescription();
						// it may contain text of units (e.g. metres)
						if ( s.contains( " " ) ) {
							alt = Double.parseDouble( s.substring( 0, s.indexOf( " " ) ) );
						}
					}
				}
	    	}

	    	// if camera isn't sending altitude, dummy a value as it's not essential;
	    	// if lat/lon weren't obtained, "0" values mean don't place on globe
	    	final double DEFAULT_ALTITUDE = 1;
			gps = new GpsFileMeta( l != null ? l.getLatitude() : 0, l != null ? l.getLongitude() : 0, alt == 0 ? DEFAULT_ALTITUDE : alt );
	    	gps.setFileName( f.getName() );

    	} catch( Exception e ) {
    		gps = new GpsFileMeta( 0, 0, 0 );
    	}
    	gps.setFileName( f.getName() );

		return gps;
    }

    private File writeFile( InputStream is, String fileName ) throws Exception {
    	String rootPath = configService.getPath( ConfigService.KEY_FILESHARE_PATH, SecurityInterceptor.getChanId( request ) + File.separator );
    	File file = null;

    	if ( fileName == null ) {
    		// TODO this expects front end HTML5 video to be capturing with "image/jpeg"
    		file = new File( rootPath + new String( "tmp-" + System.currentTimeMillis() ) + ".jpg" );
    		is = new Base64InputStream( is );
    	} else {
    		file = new File( rootPath + fileName );
    	}

        FileOutputStream out = new FileOutputStream( file );
        int read = 0;
        byte[] bytes = new byte[1024];
        while ( ( read = is.read(bytes) ) != -1 ) {
            out.write( bytes, 0, read );
        }
        out.flush();
        out.close();
        return file;
    }

    private String parseFileName( MultivaluedMap<String,String>headers ) {
    	String[] cd = headers.getFirst( "Content-Disposition" ).split( ";" );
    	for( String name : cd ) {
    		if ( name.trim().startsWith( "filename" ) ) {
    			String[] t = name.split( "=" );
    			return t[1].trim().replaceAll( "\"", "" );
    		}
    	}
    	return null;
    }
}

class GpsFileMeta {
	// cartographic
	private double lat;
	private double lon;
	private double alt;

	// cartesian
	private double x;
	private double y;
	private double z;
	private String fileName;

	public GpsFileMeta( double lat, double lon, double alt ) {
		setLat( lat );
		setLon( lon );
		setAlt( alt );
		if ( lat != 0 && lon != 0 ) {
			buildGeo2Cartesian( this, lat, lon, alt );
		} else {
			x = 0;
			y = 0;
			z = 0;
		}
	}

	@Override
	public String toString() {
		return "file: " + fileName + "; lat: " + lat + "; lon: " + lon + "; alt: " + alt;
	}

	/**
	 * Barely accurate version of converting lat/lon/alt into WGS84 cartesian
	 *
	 * TODO replace me!
	 *
	 * @param lat
	 * @param lon
	 * @param alt
	 * @return
	 */
    private void buildGeo2Cartesian( GpsFileMeta me, double lat, double lon, double alt ) {
    	// TODO
    	// this is MSL, while we would really like to subtract the GPS altitude from the
    	// photo altitude to determine how far AGL the photo should be, we don't know
    	// the actual terrain elevation at the photo spot, so kludge it a bit until we can
    	// figure out how to account for the terrain elevation at the photo spot
    	alt = Math.toRadians( alt );

    	double Re = 6378137;
    	double Rp = 6356752.3142451793;
    	double latrad = lat/180.0*Math.PI;
    	double lonrad = lon/180.0*Math.PI;
    	double coslat = Math.cos(latrad);
    	double sinlat = Math.sin(latrad);
    	double coslon = Math.cos(lonrad);
    	double sinlon = Math.sin(lonrad);
    	double term1 = (Re*Re*coslat)/Math.sqrt(Re*Re*coslat*coslat + Rp*Rp*sinlat*sinlat);
    	double term2 = alt*coslat + term1;
    	double x=coslon*term2;
    	double y=sinlon*term2;
    	double z = alt*sinlat + (Rp*Rp*sinlat)/Math.sqrt(Re*Re*coslat*coslat + Rp*Rp*sinlat*sinlat);

    	me.setX(x);
    	me.setY(y);
    	me.setZ(z);
    }

	public double getLat() {
		return lat;
	}

	public void setLat(double lat) {
		this.lat = lat;
	}

	public double getLon() {
		return lon;
	}

	public void setLon(double lon) {
		this.lon = lon;
	}

	public double getAlt() {
		return alt;
	}

	public void setAlt(double alt) {
		this.alt = alt;
	}

	public String getFileName() {
		return fileName;
	}

	public void setFileName(String fileName) {
		this.fileName = fileName;
	}

	public double getX() {
		return x;
	}

	public void setX(double x) {
		this.x = x;
	}

	public double getY() {
		return y;
	}

	public void setY(double y) {
		this.y = y;
	}

	public double getZ() {
		return z;
	}

	public void setZ(double z) {
		this.z = z;
	}

}