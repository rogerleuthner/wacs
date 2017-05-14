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

'use strict';

linksManagerApp.factory('LinksManagerService',['Restangular', function (Restangular) {

	return {

		updateWebLink: function( id, lock, col, value ) {
			var json = {};
			json[ 'id' ] = id;
			json[ 'lock' ] = lock;
			json[ col ] = value;
			return Restangular.all( 'weblink/update' ).post( json );
		},

		removeWebLink: function( rowData)
		{
			var json = {};
			json[ 'id' ] = rowData.id;
			return Restangular.all( 'weblink/removeweblink' ).post( json );
		},

		createWebLink: function( rowData) {
			var json = {};
			json[ 'name' ] = rowData.name;
			json[ 'description' ] = rowData.description;
			json[ 'user' ] = WAC.sys.getUser();
			json[ 'chId' ] = WAC.sys.getChID();
			json[ 'type' ] = "LINK";
			json[ 'path' ] = rowData.path;
			return Restangular.all( 'weblink/createweblink' ).post( json );
		},

		getFilesList: function() {
			return Restangular.one( 'asset/list' ).getList();
		},
		updateAsset: function( id, lock, col, value ) {
			var json = {};
			json[ 'id' ] = id;
			json[ 'lock' ] = lock;
			// add changed column value
			json[ col ] = value;

			return Restangular.all( 'asset/update' ).post( json );
		},

		removeAsset: function( rowData)
		{
			var json = {};
			json[ 'id' ] = rowData.id;
			return Restangular.all( 'asset/remove' ).post( json );
		}
	};
}]);