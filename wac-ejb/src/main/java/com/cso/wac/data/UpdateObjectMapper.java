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

package com.cso.wac.data;

import java.beans.BeanInfo;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Method;
import java.util.Map;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.OptimisticLockException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cso.wac.data.domain.BaseEntity;
import com.cso.wac.data.services.GenericService;
import com.cso.wac.exc.PersistenceException;

/**
 * Generically get an object and set the fields indicated in the JSON map, ignoring
 * certain fields that will (probably) be in the map yet should never be updated
 * 
 * @author rleuthner
 *
 */
@Stateless
public class UpdateObjectMapper {  // TODO  just put this as a utility method in "GenericService"
	@EJB
	private GenericService genericService;
	@EJB
	private DataRepositoryProducer producer;
	
	private static ObjectMapper mapper = new ObjectMapper();	
	
	/**
	 * Xlate json string into map of fields/values to update in the target object; preserve
	 * optimistic locking to update the object in the database with the passed in values.
	 * 
	 * This technique is a bit inefficient in that it will cause update of all of the declared
	 * fields on the object, but most of the values will be unchanged.
	 * 
	 * @param Class targetClass
	 * @param String json, just contain "id" and "lock" at least
	 * @return BaseEntity updated object
	 * @throws PersistenceException
	 */
	public BaseEntity mapAndUpdate( Class<? extends BaseEntity>targetClass, String json ) throws PersistenceException {
		@SuppressWarnings("rawtypes")
		Map map;		
		
		try {
			map = mapper.readValue( json, Map.class );
			if ( ! map.containsKey( "id" ) ) {
				throw new Exception( "Map must contain object id ('id')" );
			}
			if ( ! map.containsKey( "lock" ) ) {
				throw new Exception( "Map must contain object version ('lock')" );
			}
			
		} catch (Exception e) {
			throw new PersistenceException( "Can't parse json into useable map: " + e.getMessage() );
		}
		
				// TODO not sure how/why we can get the object mapping to use longs instead of ints, so ugly conversion ...
		BaseEntity current = genericService.get( targetClass, new Long( (Integer)map.get( "id" ) ) );

		// detach from the session so we can force merge/(lock)version check later
		producer.getEntityManager().detach( current );				
		
		BeanInfo beanInf;
		try {
			beanInf = Introspector.getBeanInfo( targetClass );
			Object o;
			Method setter;
			
			// copy in newly updated fields from front end (map) EXCEPT for id (not changed)
			// but INCLUDING the old lock value
			for( PropertyDescriptor pd : beanInf.getPropertyDescriptors() ) {
				// skip certain fields; usually just omitting from the map is
				// sufficient, but some (id) will be present even though not updatable
				if ( pd.getName().equals( "id" ) ) {
					continue;
				}
							
				if ( ( o = map.get( pd.getName() ) ) != null ) {
					setter = pd.getWriteMethod();
					setter.invoke( current, o );
				}				
			}				
			
		} catch ( Exception e ) {
			throw new PersistenceException( e.getMessage() );
		}		
		
		// merge so that the version/optimistic locking works; (why we detached earlier)
		try {
			return producer.getEntityManager().merge( current );
		} catch ( OptimisticLockException e ) {
			throw new PersistenceException( "Object was changed by another user, refresh and try again: " + e.getMessage() );
		}
	}	
}
