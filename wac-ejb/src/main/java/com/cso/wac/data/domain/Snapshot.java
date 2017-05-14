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

import java.util.Collection;
import java.util.HashSet;

import javax.persistence.CascadeType;
import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Transient;

import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import com.cso.wac.data.domain.types.SnapshotType;
import com.cso.wac.data.domain.types.SnapshotTypeConverter;

/**
 * Console snapshot "container"
 *
 * @author rleuthner
 *
 */

@Entity
@Table( name = "wac_snapshot" )
public class Snapshot extends ChannelSpecificEntity {
	private static final long serialVersionUID = -1036883349552889505L;

	@ManyToOne
	@JoinColumn( name="user_id" )
	private User user;

	@OneToMany( mappedBy="snapshot", fetch = FetchType.EAGER, cascade = CascadeType.ALL ) // eager as these are restfully called and/or used detached in WACSession
	@Fetch(value = FetchMode.SUBSELECT)
	private Collection<AppState>appStates = new HashSet<AppState>();

	@Convert( converter = SnapshotTypeConverter.class )
	private SnapshotType type;

	public Collection<AppState>getAppStates() {
		return appStates;
	}

	public AppState addApp( String name, String desc ) {
		AppState ws = new AppState( name, desc ); //AppUtil.getAppId( name, desc ) );
		appStates.add( ws );
		ws.setSnapshot( this );
		return ws;
	}

	@Transient
	public AppState getAppState( String wuid ) {
		for( AppState ws : appStates ) {
			if ( ws.getName().equals( wuid ) ) {
				return ws;
			}
		}
		return null;
	}

	public SnapshotType getType() {
		return type;
	}

	public void setType( SnapshotType type ) {
		this.type = type;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}
}
/*
 * @Entity
@DiscriminatorValue("VEH")
public class Vehicle {
    ...

    @ManyToAny(
        metaColumn = @Column( name = "owner_type" )
    )
    @AnyMetaDef(
        idType = "integer", metaType = "string",
        metaValues = {
            @MetaValue( targetEntity = Person.class, value="PRS" ),
            @MetaValue( targetEntity = Company.class, value="CPY" )
        }
    )
    @Cascade( { org.hibernate.annotations.CascadeType.ALL } )
    @JoinTable(
        name = "vehicle_owners",
        joinColumns = @JoinColumn( name = "vehicle_id" ),
        inverseJoinColumns = @JoinColumn( name = "owner_id" )
    )
    public List<Property> getOwners() { ... }
    private void setOwners(List<VehicleOwner> owners) { ... }

    ...
}
 */


