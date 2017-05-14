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


package com.cso.wac.data.services.misc;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.domain.FileEntry;
import com.cso.wac.data.domain.User;
import com.cso.wac.data.domain.types.EventSeverity;
import com.cso.wac.data.domain.types.FileType;

/**
 * Service that aggregates actions from two or more services into atomic transactions.
 * 
 * Implement misc methods here until/unless size/number indicate breaking up
 * 
 * @author rleuthner
 *
 */

@Stateless
public class AggregateService {
	@EJB
	private DataRepositoryProducer producer;
	@EJB
	private EventNoticeService eventNotice;
	@EJB
	private FileEntryService fileEntry;	
	@EJB
	private UserService userService;
	
	public AggregateService() {}
	
	// TODO userid ??
	public FileEntry fileUploaded( String fileName, String filePath, String desc, EventSeverity severity, Long chId, String userName ) {
		User user = userService.getUserByUserName( userName );
		eventNotice.createNotice( fileName, desc, severity, chId,  user );
		return fileEntry.addFileEntry( desc, fileName, filePath, chId, user, FileType.MISSION_SHARE );
	}
	
}