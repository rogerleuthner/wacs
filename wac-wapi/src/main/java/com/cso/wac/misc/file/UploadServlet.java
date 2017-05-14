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

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import javax.ejb.EJB;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.data.domain.types.Events;
import com.cso.wac.data.services.misc.EventNoticeService;
import com.cso.wac.data.services.misc.FileEntryService;

/**
 * File Upload interface to 'ng-flow'
 *
 * TODO get rid of funky singleton tracking of file parts!!
 */

@WebServlet(
		name="UploadServlet",
		urlPatterns={"/UploadServlet"} )
@MultipartConfig
public class UploadServlet extends FileServiceBase {
	private static final long serialVersionUID = 4411010086027303555L;
	// the name of the multipart that contains the file inputstream
	private static String MULTIPART_FILE = "TARGET_FILE";
	private static int FILE_BUFFER_SIZE = 8092;

	@EJB
	private EventNoticeService eventNoticeService;

	@EJB
	private FileEntryService fileService;

	@Override
	protected void checkParms(EventParms ep) throws ServletException {
		return;
	}

    @Override
//	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException {
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
		final EventParms eventParms = new EventParms( request );
        int resumableChunkNumber = getResumableChunkNumber(request);
        ResumableInfo info = getResumableInfo(request, eventParms);
        RandomAccessFile output = null;
        InputStream input = null;

        try {
        	Paths.get( filePath, eventParms.getChId().toString() ).toFile().mkdirs();
            output = new RandomAccessFile(info.resumableFilePath, "rw");

            // go to current chunk position
            output.seek((resumableChunkNumber - 1) * info.resumableChunkSize);

            input = request.getPart( MULTIPART_FILE ).getInputStream();
	        long read = 0;
	        int content_length = request.getContentLength();
	        byte[] bytes = new byte[FILE_BUFFER_SIZE];
	        while(read < content_length) {
	            int r = input.read(bytes);
	            if (r < 0)  {
	                break;
	            }
	            output.write(bytes, 0, r);
	            read += r;
	        }
        } catch ( IOException i ) {
			handleError( i.getMessage(), response );

        } finally {
        	closeUp( output, input );
        }

        //Mark as uploaded.
        info.uploadedChunks.add(new ResumableInfo.ResumableChunkNumber(resumableChunkNumber));
        if (info.checkIfUploadFinished()) {
            ResumableInfoStorage.getInstance().remove(info);
            continueOrFinish( response, "All finished." );

			Map<String,Object>map = new HashMap<String,Object>();
			// prefix the chid so the files are grouped a bit
			map.put( "filepath", Paths.get( filePath, eventParms.getChId().toString() ).toString() );
			map.put( "filename", info.resumableFilename );
			map.put( "filesize", info.resumableTotalSize );
			// added a name to make it easier to distinguish events
			map.put("name", "fileupload");
			// added user as a step towared unification of event data
			map.put("user",  eventParms.getUserId());

			try {
		    	eventNoticeService.createNotice(map.get("filename").toString(), Events.FILE_ADD.getEvent(), EventSeverity.NORMAL,
		    			eventParms.getChId(), eventParms.getUserId() );

				fileService.addFileEntry( map.get("filename").toString(), map.get("filepath").toString(), eventParms.getChId(), eventParms.getUserId() );
			} catch ( Exception e ) {
				handleError( e.getMessage(), response );
			}
        } else {
        	continueOrFinish( response, "Upload" );
        }
    }

//    @Override
//	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
//        int resumableChunkNumber        = getResumableChunkNumber(request);
//
//        ResumableInfo info = getResumableInfo(request);
//
//        if (info.uploadedChunks.contains(new ResumableInfo.ResumableChunkNumber(resumableChunkNumber))) {
//            response.getWriter().print("Uploaded."); //This Chunk has been Uploaded.
//        } else {
//            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
//        }
//    }

    private int getResumableChunkNumber(HttpServletRequest request) {
        return toInt(request.getParameter("flowChunkNumber"), 1);
    }

    private ResumableInfo getResumableInfo(HttpServletRequest request, EventParms eventParms ) throws ServletException {

        int resumableChunkSize          = toInt(request.getParameter("flowChunkSize"), -1);
        long resumableTotalSize         = toLong(request.getParameter("flowTotalSize"), -1);
        String resumableIdentifier      = request.getParameter("flowIdentifier");
        String resumableFilename        = request.getParameter("flowFilename");
        String resumableRelativePath    = request.getParameter("flowRelativePath");
        //Here we add a ".temp" to every upload file to indicate NON-FINISHED
        String resumableFilePath        = Paths.get( filePath, eventParms.getChId().toString(), resumableFilename, ".temp" ).toAbsolutePath().toString();

        ResumableInfoStorage storage = ResumableInfoStorage.getInstance();

        ResumableInfo info = storage.get(resumableChunkSize, resumableTotalSize,
                resumableIdentifier, resumableFilename, resumableRelativePath, resumableFilePath);
        if (!info.valid())         {
            storage.remove(info);
            throw new ServletException("Invalid request params.");
        }
        return info;
    }

    private void continueOrFinish( HttpServletResponse response, String what ) {
        try {
			response.getWriter().print( what );
		} catch (IOException e) {
			handleError( e.getMessage(), response );
		}
    }

    private void closeUp( RandomAccessFile output, InputStream input ) {
    	if ( output != null ) {
    		try {
				output.close();
			} catch (IOException e) { /*TODO logme */}
    	}
        if ( input != null ) {
        	try {
				input.close();
			} catch (IOException e) { /*TODO logme */}
        }
    }

    private void handleError( String m, HttpServletResponse response ) {
        try {
			response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, m );
		} catch (IOException e) { /* TODO logme */}
    }

    private int toInt( String in, int def ) {
        if (testEmpty(in)) {
            return def;
        }
        try {
            return Integer.valueOf(in);
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return def;
        }
    }

    private boolean testEmpty( String in ) {
    	return in == null || "".equals(in);
    }

    private long toLong( String value, long def ) {

	    if (testEmpty(value)) {
	        return def;
	    }

	    try {
	        return Long.valueOf(value);
	    } catch (NumberFormatException e) {
	        e.printStackTrace();
	        return def;
	    }
    }
}

// TODO rewrite to eliminate this singleton crap !!!!

class ResumableInfoStorage {

    //Single instance
    private ResumableInfoStorage() {
    }
    private static ResumableInfoStorage sInstance;

    public static synchronized ResumableInfoStorage getInstance() {
        if (sInstance == null) {
            sInstance = new ResumableInfoStorage();
        }
        return sInstance;
    }

    //resumableIdentifier --  ResumableInfo
    private HashMap<String, ResumableInfo> mMap = new HashMap<String, ResumableInfo>();

    /**
     * Get ResumableInfo from mMap or Create a new one.
     * @param resumableChunkSize
     * @param resumableTotalSize
     * @param resumableIdentifier
     * @param resumableFilename
     * @param resumableRelativePath
     * @param resumableFilePath
     * @return
     */
    public synchronized ResumableInfo get(int resumableChunkSize, long resumableTotalSize,
                             String resumableIdentifier, String resumableFilename,
                             String resumableRelativePath, String resumableFilePath) {

        ResumableInfo info = mMap.get(resumableIdentifier);

        if (info == null) {
            info = new ResumableInfo();

            info.resumableChunkSize     = resumableChunkSize;
            info.resumableTotalSize     = resumableTotalSize;
            info.resumableIdentifier    = resumableIdentifier;
            info.resumableFilename      = resumableFilename;
            info.resumableRelativePath  = resumableRelativePath;
            info.resumableFilePath      = resumableFilePath;

            mMap.put(resumableIdentifier, info);
        }
        return info;
    }

    public void remove(ResumableInfo info) {
       mMap.remove(info.resumableIdentifier);
    }
}
class ResumableInfo {

    public int      resumableChunkSize;
    public long     resumableTotalSize;
    public String   resumableIdentifier;
    public String   resumableFilename;
    public String   resumableRelativePath;

    public static class ResumableChunkNumber {
        public ResumableChunkNumber(int number) {
            this.number = number;
        }

        public int number;

        @Override
        public boolean equals(Object obj) {
            return obj instanceof ResumableChunkNumber
                    ? ((ResumableChunkNumber)obj).number == this.number : false;
        }

        @Override
        public int hashCode() {
            return number;
        }
    }

    //Chunks uploaded
    public HashSet<ResumableChunkNumber> uploadedChunks = new HashSet<ResumableChunkNumber>();

    public String resumableFilePath;

    public boolean valid(){
        if (resumableChunkSize < 0 || resumableTotalSize < 0
                || testEmpty(resumableIdentifier)
                || testEmpty(resumableFilename)
                || testEmpty(resumableRelativePath)) {
            return false;
        } else {
            return true;
        }
    }
    public boolean checkIfUploadFinished() {
        //check if upload finished
        int count = (int) Math.ceil(((double) resumableTotalSize) / ((double) resumableChunkSize));
        for(int i = 1; i < count; i ++) {
            if (!uploadedChunks.contains(new ResumableChunkNumber(i))) {
                return false;
            }
        }

        //Upload finished, change filename.
        File file = new File(resumableFilePath);
        String new_path = file.getAbsolutePath().substring(0, file.getAbsolutePath().length() - ".temp".length());
        file.renameTo(new File(new_path));

        return true;
    }

    private boolean testEmpty( String in ) {
    	return in == null || "".equals(in);
    }
}
