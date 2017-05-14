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

import javax.persistence.Entity;
import javax.persistence.Table;

/**
 * Basic Channel
 *
 * @author rleuthner
 *
 */

@Entity
@Table( name = "wac_channel" )
public class Channel extends NamedEntity {
	private static final long serialVersionUID = -6434975767078754148L;
	public static int DEFAULT_CHANNEL = -1;
}