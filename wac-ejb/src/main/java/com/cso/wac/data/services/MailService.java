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

package com.cso.wac.data.services;

import javax.annotation.Resource;
import javax.ejb.Asynchronous;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.mail.Address;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMessage.RecipientType;
import javax.ws.rs.core.MediaType;

import com.cso.wac.data.domain.Email;

/**
 * Session Bean implementation class MailService
 * @see wac-parent/snippets/configure-mail.cli
 */
@Stateless
public class MailService {
	
//	@Resource(mappedName = "java:/mail/gmail")
//	private Session session;
//	
//	@Asynchronous
//	public void send(@Observes Email email) {
//		try {
//			MimeMessage msg = new MimeMessage(session);
//
//			msg.setHeader("Content-Type", "text/html;charset=UTF-8");
//			msg.setSubject(email.getSubject(), "UTF-8");
//			msg.setContent(email.getBody(), MediaType.TEXT_HTML);
//
//			if (email.getAddress() != null) {
//                Address[] address = new Address[email.getAddress().size()];
//
//				for (int i = 0; i < email.getAddress().size(); i++) {
//					address[i] = new InternetAddress(email.getAddress().get(i));
//				}
//
//				msg.setRecipients(RecipientType.TO, address);
//			}
//
//			Transport.send(msg);
//		} catch (MessagingException e) {
//			System.out.println(e);
//		}
//	}

}
