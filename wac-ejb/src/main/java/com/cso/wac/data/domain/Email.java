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

package com.cso.wac.data.domain;

import java.util.Arrays;
import java.util.List;

// TODO database annotate for storage

public class Email {

	private final String subject;
	private final String body;
	private final List<String> address;

	public Email(String subject, String body, String... addresses) {
		this.subject = subject;
		this.body = body;
		this.address = Arrays.asList(addresses);
	}

	public String getSubject() {
		return this.subject;
	}

	public List<String> getAddress() {
		return this.address;
	}

	public String getBody() {
		return this.body;
	}
}
