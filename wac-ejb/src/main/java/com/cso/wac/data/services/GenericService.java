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

import javax.ejb.EJB;
import javax.ejb.Stateless;

import com.cso.wac.data.DataRepositoryProducer;
import com.cso.wac.data.domain.BaseEntity;

/**
 * Unspecified BaseEntity service
 * 
 * TODO might be useful to have all the services extend this; put basic common functionality
 * here and share via implementation inheritance
 * 
 * @author rleuthner
 *
 */

@Stateless
public class GenericService {
	@EJB
	private DataRepositoryProducer producer;
	
	public BaseEntity get( Class<? extends BaseEntity> targetClass, Long id ) {
		return producer.getEntityManager().find( targetClass, id );
	}
	
}
