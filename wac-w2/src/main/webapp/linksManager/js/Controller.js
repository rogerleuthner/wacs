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

/*
 * Links Manager controller.
 *
 * Drag link - fetch document from web directly to server, upload into uploads, signal front end it is ready
 * Drag doc from desktop - push document to uploads
 *
 * The table itself is updated upon receipt of the EVENT and not from direct success of operation.
 *
 * @author ggershanok wrote a really shitty first version; had to be rewritten almost entirely
 */

linksManagerApp.controller( 'LinksManagerController', [ '$scope', 'LinksManagerService',
    function ( $scope, LinksManagerService ) {

		var uploads=[];

		$scope.gridOptions = {
				enableRowSelection : true,
				enableFiltering : true,
				multiSelect : false,
				modifierKeysToMultiSelect : false,
				noUnselect : true,
				enableRowHeaderSelection: false,
				rowHeight: 20,
				rowTemplate: rowTemplate(),
				data: []
		};

		function rowTemplate() {
			return '<div ng-repeat="col in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ui-grid-cell ui-grid-resize-columns draggable data-transfer-data="{{row.entity}}"></div>';
		}

		$scope.msg = {};

		$scope.gridOptions.columnDefs =
        [
         	// note that 'name' attribute must be resolvable as javabean field for target type
         	// if database updates are to work!!!!

         	{ name: 'id', displayName: 'Id', enableCellEdit: false, visible: false },
         	{ name: 'active', displayName: 'Active', type: 'boolean', visible: false },
         	{ name: 'lock', visible: false },

         	{ name: 'name', displayName: 'Name', enableCellEdit: true, width: '20%', enableColumnResizing: true },
         	{ name: 'description', displayName: 'Description', enableCellEdit: true, width: '30%', enableColumnResizing: true  },
         	{ name: 'created', displayName: 'Date', width: '10%', type: 'date', enableCellEdit: false, cellFilter: 'date:"yyyy-MM-dd"', enableColumnResizing: true  },
         	{ name: 'user', displayName: 'User', enableCellEdit: false, width: '10%', enableColumnResizing: true  },
         	{ name: 'path', displayName: 'Link', enableCellEdit: true, width: '20%', enableColumnResizing: true  },
         	{ name: 'type', displayName: 'Type', enableCellEdit: false, width: '5%', enableColumnResizing: true  },
         	{ name: 'Del', enableCellEdit: false,  enableFiltering : false,
             cellTemplate: '<div><button class="btn btn-primary" ng-click="grid.appScope.deleteRow(row)">Del</button></div>',
             width: '5%'
         	}
        ];

		$scope.deleteRow = function(row) {
// TODO error checking!
			if(row.entity.id !== "")
			{
			    var index = $scope.gridOptions.data.indexOf(row.entity);
			    LinksManagerService.removeAsset( row.entity );
			    $scope.gridOptions.data.splice(index, 1);
			}
		};


		// TODO probably would be best just to have a 'Save Changes' button, and not do the actual
		// database update upon cell change.  Could 'mark dirty' or something in here, check for
		// dirty rows in the 'save'.
		// in the following it is hard to intercept any error and handle gracefully, + might be best
		// UI design to only save at explicit action.

		$scope.gridOptions.onRegisterApi = function( gridApi ) {

			$scope.gridApi = gridApi;

			gridApi.edit.on.afterCellEdit( $scope, function( rowEntity, colDef, newValue, oldValue ) {
				if ( newValue !== oldValue ) {
					LinksManagerService.updateAsset( rowEntity.id, rowEntity.lock, colDef.name, newValue ).then(
							function( result ) {
								$scope.msg.lastCellEdited = 'Change column \"' + colDef.name + '\": \"'+ oldValue + '\" -> \"' + newValue + '\"';
								// must manually increment the lock since there won't be an intervening reselect and we want to be able to edit
								// this row again
								rowEntity.lock++;
							}, function error( result ) {
								// TODO
								// back out the grid edit on failed change!!
								$scope.msg.lastCellEdited = 'Error, no update: ' + result;
							}
						);
				}
			});
		};

		function doFail( m ) {
			showMess( 'Failed to upload: ' + m );
			WAC.sys.stopSpinner();
		}

		$scope.wacOnDrop = function(data)
		{
			uploads = [];

			if ( typeof data === 'object' ) {
				// should be a file (or linkfile) dropped from desktop, as links and items dragged from other web frames are string
				// this determination is a little indirect and probably should be improved/definitive
				// {name: "11UndirectedGraphs.pdf", lastModified: 1421039971472, lastModifiedDate: Sun Jan 11 2015 22:19:31 GMT-0700 (Mountain Standard Time), webkitRelativePath: "", size: 2903243…}
				// data is an html5 'FileList' of 'File', which isn't really an array but we can deal with it as an array

				for( var i = 0, f; f = data[ i ]; i++ ) {
					if ( f.type === "" ) {
						showMess( "Can't handle (" + f.name + "), please drag from browser address bar or bookmarks or a file" ); // link from desktop
						continue;
					}
					WAC.sys.startSpinner();
					uploads[ i ] = f.name;
					WAC.sys.uploadFile( f, null, doFail );
				}

			} else {
				WAC.sys.startSpinner();

				// this should be a string link from address bar or bookmarks
				var objectData = {};

				try {

					// object dragged in from an ngdragdrop.js setup element:   string "{"name":"GuardianAngel.html","value":"GuardianAngel.html"}"
					// this means we already have the file somewhere?? so this should really never happen, as they can either drag a file into the channel
					// from the file system
					objectData = JSON.parse(data);

					if ( typeof objectData.id !== 'undefined' ) {
						// DO NOTHING, IGNORE DROP ON OURSELVES
						WAC.sys.stopSpinner();
					} else {
						alert("TODO: dragged item in from a DND element ...");
					}

				} catch ( failed ) {
					// link from browser address bar, bookmark or link on desktop:   string 'http://this.is.a.url'
					objectData = buildColsObj();
					objectData.name = data.length > 64 ? data.substring( data.lastIndexOf( '/' ) ) : data;  // needs shortening // TODO need general way to force length into available fields
					objectData.description = data;
					objectData.path = data;
					objectData.type = "LINK";

					LinksManagerService.createWebLink( objectData ).then(
							function( result ) {
							}, function error( result ) {
								$scope.msg.lastCellEdited = 'Failed to create link: ' + result;
							}
						);
					// assuming one link dropped at a time
					uploads[ 0 ] = objectData.name;
				}
			}

			return;
		};

		function showMess( mess ) {
			document.getElementById( 'message' ).innerHTML = mess;
			document.getElementById( 'errModal' ).style.display = 'block';
		}

		$scope.dismissMess = function() {
			document.getElementById( 'errModal' ).style.display = 'none';
		}

		function addRow( file ) {
			file.description = (typeof file.description === 'undefined' ? '(uploaded)' : file.description);
			file.created = (typeof file.created === 'undefined' ? new Date() : file.created);
			file.user = WAC.sys.getUser();
			$scope.gridOptions.data.splice( 0, 0, buildColsObj( file ) );
			$scope.$apply();
		}

		function startup() {
			$scope.gridOptions.data=[];

	    	LinksManagerService.getFilesList( ).then(
	    			function( object ) {
			    		var count = $scope.gridOptions.data.length;

			    		angular.forEach( object, function( fileObject ) {
			    			// note labels must match "name" field in original grid data column defs above
			    			fileObject.user = fileObject.user.userName;
			    			$scope.gridOptions.data[ count++ ] = buildColsObj( fileObject );
			    		});
			    	}
			    );
		}

		function buildColsObj( inv ) {
			if ( typeof inv === 'undefined' ) {
				inv = {};
			}

			return {
				"id": typeof inv.id === 'undefined' ? "" : inv.id,
				"name": typeof inv.name === 'undefined' ? "" : inv.name,
				"description": typeof inv.description === 'undefined' ? "" : inv.description,
				"active": typeof inv.active === 'undefined' ? "" : inv.active,
				"created": typeof inv.created === 'undefined' ? "" : inv.created,
				"lock": typeof inv.lock === 'undefined' ? "" : inv.lock,
				"user": typeof inv.user === 'undefined' ? "" : inv.user,
				"path" : inv.path,
				"type" : inv.type };
		}

		// we get our own 'upload' events
		// so, use this to track upload completion
		function processEvent( data ) {
			var a = JSON.parse( data );
			var event = a.event;
			data = JSON.parse( a.data );

			switch( event ) {
				case WAC.sys.FILEADD:
					addRow( data );
					// if we uploaded the file, stop spinner
					for( var i = 0; i < uploads.length; i++ ) {
						if ( uploads[ i ] === data.name ) {
							uploads.splice( i, 1 );
							// last upload done, stop spinning
							if ( uploads.length <= 0 ) {
								WAC.sys.stopSpinner();
							}
						}
					}
					break;

				case WAC.sys.FILECHANGE:
					// find the row and copy fields into it
					// note that the originator also gets this, so copy is redundant for them
					var i = 0;
		    		angular.forEach( $scope.gridOptions.data,
							function( fileObject ) {
				    			if ( Number( fileObject.id ) === Number( data.id ) ) {
				    				// only one field can be edited due to UI design
				    				if ( typeof data.name !== 'undefined' ) {
				    					$scope.gridOptions.data[i].name = data.name;
				    				} else if ( typeof data.description !== 'undefined' ) {
					    				$scope.gridOptions.data[i].description = data.description;
				    				} else if ( typeof data.path !== 'undefined' ) {
					    				$scope.gridOptions.data[i].path = data.path;
				    				}
				    			    $scope.$apply();
				    			    return;
				    			}
				    			i++;
			    			}
		    			);
		    		break;

				case WAC.sys.FILEFETCH:  // link fetched by somebody, remove link add file
					// delete fetched file from table
					deleteRowById( data.oldId );
		    		// add new one
					addRow( data );
					break;

				case WAC.sys.FILEREMOVE:
					deleteRowById( data.id );
					break;
				default:
					break;
			}
		}

		function deleteRowById( id ) {
			var i = 0;
    		angular.forEach( $scope.gridOptions.data,
					function( fileObject ) {
		    			if ( Number( fileObject.id ) === Number( id ) ) { // need cast as id might be string or number
		    			    $scope.gridOptions.data.splice(i, 1);
		    			    $scope.$apply();
		    			    return;
		    			}
		    			i++;
	    			}
    			);
		}

// TODO also need to send an event upon edit of name or description
		WAC.sys.WACInit( function() {
				WAC.sys.initApp( 'linkManager', '*', startup );
			},
			[WAC.sys.FILEADD, WAC.sys.FILECHANGE, WAC.sys.FILEREMOVE, WAC.sys.FILEFETCH], processEvent );

		}]
);


// $scope.gridApi.grid.modifyRows($scope.gridOptions.data); //required for the next line to work
// $scope.gridApi.selection.selectRow($scope.gridOptions.data[len-1]);