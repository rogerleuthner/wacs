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

import java.io.IOException;

import javax.ejb.EJB;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.cso.wac.data.services.ConfigService;
import com.cso.wac.misc.er.BaseEventReceiver;

/**
 * Base class for file handling servlets
 * 
 * @author rleuthner
 *
 */

public abstract class FileServiceBase extends BaseEventReceiver {

	@EJB
	private ConfigService configService;
	
	private static final long serialVersionUID = 1L;
	protected static final int BUFSIZE = 4096;
	protected String filePath;
	
	public FileServiceBase() {
		super();
	}
	
	@Override 
	public void init( ServletConfig config ) {		
		filePath = configService.get( ConfigService.KEY_FILESHARE_PATH );
	}
	
	@Override
	protected void service( final HttpServletRequest request, final HttpServletResponse response ) throws ServletException, IOException {
		response.setCharacterEncoding("UTF-8");
	}		
}