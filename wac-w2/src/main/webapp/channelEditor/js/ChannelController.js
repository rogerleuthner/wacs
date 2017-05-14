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

// TODO: Write the new/updated channel to the database. This could be tricky, due to User/Channel/Role linking, or quite straightforward
//		if the backend already is capable of taking care of sorting things out.

channelEditorApp.controller('ChannelEditorController', ['$scope', '$route', '$modal', '$log', 'uiGridConstants', 'channelEditorService',
                                                        function($scope, $route, $modal, $log, uiGridConstants, channelEditorService) {
	$scope.channeldata = {};

	$scope.status = {
			isnewchannel: true,
			datamissing: true,
			userselected: false,
			selectedrow: null,
			buttontext: "Delete User"
	};

	$scope.userGridData = {
			enableRowSelection: true,
			multiSelect: false,
			modifierKeysToMultiSelect: false,
			noUnselect: false,
			enableRowHeaderSelection: false,
			enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
			rowTemplate: rowTemplate()
	};

	function rowTemplate() {
		return '<div ng-class="{{grid.appScope.getColor(row)}}" ng-click="grid.appScope.processRowClick(row)" ng-repeat="col in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ui-grid-cell></div>';
	}

	$scope.userGridData.columnDefs =
		[
		 { field: 'id', name: 'id', enableCellEdit: false, visible: false, width: '0%' },
		 { field: 'username', name: 'Username', enableCellEdit: false, width: '40%' },
		 { field: 'roles', name: 'Roles', enableCellEdit: false, visible: false, width: '0%' },
		 { field: 'roledisp', name: 'Role', enableCellEdit: false, width: '30%' },
		 { field: 'lock', name: 'lock', enableCellEdit: false, visible: false, width: '0%' },
		 { field: 'active', name: 'Active', enableCellEdit: false, width: '30%', enableSorting: false },
		 { field: 'newuser', name: 'newuser', enableCellEdit: false, visible: false, width: '0%' }, // this field will allow mistaken adds to be removed before sending to the database
		 { field: 'dirty', name: 'dirty', enableCellEdit: false, visible: false, width: '0%' } // allows us to decide which users have been edited and thus need to be sent back to the database
		 ];


	$scope.userGridData.onRegisterApi = function(gridApi) {

		$scope.gridApi = gridApi;
		gridApi.selection.on.rowSelectionChanged($scope,function(row) {
			$scope.status.userselected = row.isSelected;
			if (row.isSelected === true)
				$scope.status.selectedrow = $scope.userGridData.data.indexOf(row.entity);
			else
				$scope.status.selectedrow = null;
			var msg = "selected row " + $scope.status.selectedrow;
			$log.log(msg);
			// update "delete" button text
			var u = $scope.userGridData.data[$scope.status.selectedrow];
			if (u.newuser === true) {
				$scope.status.buttontext = "Delete User";
			} else if (u.newuser === false && u.active === true) {
				$scope.status.buttontext = "Deactivate User";
			} else if (u.newuser === false && u.active == false) {
				$scope.status.buttontext = "Activate User";
			}
		});

	};


	$scope.selectChannel = function(size) {

		if (!isFormEmpty()) {
			channelEditorService.showConfirm( "Do you really want to discard your changes?", function() { getChannel(size); } );
		} else {
			getChannel(size);
		}

	}

	function getChannel(size) {

		var modalInstance = $modal.open({
			templateUrl: 'views/channelModal.html',
			controller: 'ChannelModalController',
			size: size,
			resolve: {
				items: function() { return $scope.items; }
			},
			scope: $scope,
			backdrop: 'true'
		});

		modalInstance.result.then(
				function (selectedChannel) {
					$scope.channeldata.id = selectedChannel.id;
					$scope.channeldata.lock = selectedChannel.lock;
					$scope.channeldata.name = selectedChannel.name;
					$scope.channeldata.description = selectedChannel.description;
					$scope.status.isnewchannel = false;
					// get the users for the selected channel
					$scope.userGridData.data = [];
					channelEditorService.getUserByChannel(selectedChannel.id).get().then(
							function (result) {
								var i;
								var r;
								for (i=0;i<result.length; i++)
								{
									var d = {};
									d.id = result[i].id;
									d.username = result[i].userName;
									d.lock = result[i].lock;
									d.active = result[i].active;
									d.newuser = false;
									d.dirty = false;
									d.role = [];
									d.roledisp = "";
									for (r=0;r<result[i].roles.length; r++) { d.roledisp = d.roledisp + result[i].roles[r].access + '\n'; d.role.push(result[i].roles[r].access ); }
									$scope.userGridData.data.push(d);
								}
							},
							function (e) {channelEditorService.showMess(e.data);}
					);
					$log.info('Selected Channel: ' + $scope.channeldata.name);
				},
				function () { $log.info('No channel selected') }

		);

	};

	$scope.addUser = function(size) {

		var modalInstance = $modal.open({
			templateUrl: 'views/addUserModal.html',
			controller: 'AddUserController',
			size: size,
			resolve: {
				currentusers: function() { return $scope.userGridData.data; }
			},
			scope: $scope,
			backdrop: 'true'
		});

		modalInstance.result.then(
			function(newUser) {
				$log.info(newUser.user);
				$log.info(newUser.roles);
				var d = {};
				var r;
				d.id = newUser.user.id;
				d.username = newUser.user.userName;
				d.lock = newUser.user.lock;
				d.active = true;
				d.newuser = true;
				d.dirty = true; // all new users are dirty
				d.role = [];
				d.roledisp = "";
				for (r=0;r<newUser.roles.length;r++) { d.roledisp = d.roledisp + newUser.roles[r].name + '\n'; d.role.push(newUser.roles[r].name); }
				$scope.userGridData.data.push(d);
			},
			function() { $log.info('add user cancelled'); }
		);
	};

	$scope.editUser = function(size) {

		var modalInstance = $modal.open({
			templateUrl: 'views/editUserModal.html',
			controller: 'EditUserController',
			size: size,
			resolve: {
				user: function() { return $scope.userGridData.data[$scope.status.selectedrow] }
			},
			scope: $scope,
			backdrop: 'true'
		});

		modalInstance.result.then(
			function(editedUser) {
				$log.info(editedUser.user);
				$log.info(editedUser.roles);
				var d = {};
				var r;
				d.id = editedUser.user.id;
				d.username = editedUser.user.username;
				d.lock = editedUser.user.lock;
				d.active = editedUser.user.active;
				d.newuser = editedUser.user.newuser;
				d.dirty = true; // if we've successfully edited, mark the user as dirty to ensure db update
				d.role = [];
				d.roledisp = "";
				for (r=0;r<editedUser.roles.length;r++) { d.roledisp = d.roledisp + editedUser.roles[r].name + '\n'; d.role.push(editedUser.roles[r].name); }
				// selectedrow should not change in the course of handling the dialog box
				$scope.userGridData.data[$scope.status.selectedrow] = d;
				// now unselect the row
				$scope.gridApi.selection.clearSelectedRows();
				$scope.status.userselected = false;
				$scope.status.selectedrow = null;

			},
			function() { $log.info('edits discarded'); }
		);
	};

	$scope.deleteUser = function(size) {
		var u = $scope.userGridData.data[$scope.status.selectedrow];
		if (u.newuser === true) {  // if we just added the user, assume it was a mistake and go ahead and delete
			$scope.userGridData.data.splice($scope.status.selectedrow, 1);
		} else if (u.newuser === false && u.active === true) {
			$scope.userGridData.data[$scope.status.selectedrow].active = false;
			$scope.userGridData.data[$scope.status.selectedrow].dirty = true; // make sure we update to the db
		} else if (u.newuser === false && u.active === false) {
			$scope.userGridData.data[$scope.status.selectedrow].active = true;
			$scope.userGridData.data[$scope.status.selectedrow].dirty = true; // make sure we update to the db
		}
		$scope.gridApi.selection.clearSelectedRows(); // just in case
		$scope.status.selectedrow = null;
		$scope.status.userselected = false;
	};

	// setting conf to true will require confirmation before clearing form
	// setting conf to false will simply clear the form with no confirmation
	$scope.clearChannel = function(conf) {
		if(conf === true && !isFormEmpty()) {
			channelEditorService.showConfirm( "Do you really want to discard your changes?",
				function() {
					$scope.channeldata = {};
					$scope.status.isnewchannel = true;
					$scope.status.datamissing = true;
					$scope.status.userselected = false;
					$scope.status.selectedrow = null;
					$scope.status.buttontext = "Delete User";
					$scope.userGridData.data = [];
					$scope.$apply(); // data was changed outside of the angular flow (by modal)
				} );

		} else {
			$scope.channeldata = {};
			$scope.status.isnewchannel = true;
			$scope.status.datamissing = true;
			$scope.status.userselected = false;
			$scope.status.selectedrow = null;
			$scope.status.buttontext = "Delete User";
			$scope.userGridData.data = [];
		}
	};

	function isEmptyString(s) {
		if (s === null || s === undefined || s === "")
			return true;
		else
			return false;
	}

	function validateForm() {
		if (isEmptyString($scope.channeldata.name)) {
			channelEditorService.showMess("Channel Name is Required");
			return false;
		} else if (isEmptyString($scope.channeldata.description)) {
			channelEditorService.showMess("Channel Description is Required");
			return false;
		}
		return true;
	}

	function isFormEmpty() {
		if (!isEmptyString($scope.channeldata.name)) {
			return false;
		} else if (!isEmptyString($scope.channeldata.description)) {
			return false;
		} else if ($scope.userGridData.data.length !== 0) {
			return false;
		} else {
			return true;
		}
	}

	function setUserRoles(chId) {
		var userlist = $scope.userGridData.data;
		for (var i = 0; i<userlist.length; i++) {
			if (userlist[i].dirty === true) {
				// we need to create a user data object for every user that has been marked "dirty"
				var userdata = {}; // create a blank object for sending to the backend
				userdata.userName = userlist[i].username;
				userdata.id = userlist[i].id;
				userdata.lock = userlist[i].lock;
				userdata.active = userlist[i].active;
				userdata.roles = [];
				for (var j=0; j<userlist[i].role.length; j++)
				{
					var tmprole = {};
					tmprole.chan = {id: chId}; // create very basic channel object
					tmprole.access = userlist[i].role[j];
					userdata.roles.push(tmprole);
				}
				$log.info(userdata);
				// now decide whether this dirty user is a new addition to the channel or
				// already existed in the channel and needs to be updated
				if (userlist[i].newuser === true) {
					channelEditorService.addUserAndRoles(userdata).then(
							function (result) { $log.info("User " + result.userName + " successfully added"); },
							function (e) { channelEditorService.showMess(e); }
					);
				}
				if (userlist[i].newuser === false) {
					channelEditorService.updateUserAndRoles(userdata).then(
							function (result) { $log.info("User " + result.userName + " successfully updated"); },
							function (e) { channelEditorService.showMess(e); }
					);
				}
			}
		}
	}

	$scope.saveChannel = function() {
		// validate data before attempting to save
		// form validation will take care of showing error messages
		// and placing cursor in the appropriate region
		if (validateForm() == true) {
			//  build the object we will be submitting to the RESTful service
			//  we will need the channel object as well as the name and description
			//  in both the new and edit cases
			var channel = {};
			channel.name = $scope.channeldata.name;
			channel.description = $scope.channeldata.description;

			if ($scope.status.isnewchannel) { // new channel, so call the channel create service
				// don't need to copy id and lock, since this is a new channel
				// those fields will be set automatically on the backend.
				channelEditorService.createNewChannel(channel).then(
						function(createdChanId) { setUserRoles(createdChanId);
							channelEditorService.showMess("Channel " + channel.name + " saved to database"); $scope.clearChannel(false); },
						function(e) { channelEditorService.showMess(e); }
				);

			} else { // not a new channel so we need to call the edit services
				// since we are editing a channel, we need the lock and id fields to
				// ensure we edit an existing channel, rather than creating an identical new one
				channel.id = $scope.channeldata.id;
				channel.lock = $scope.channeldata.lock;
				channelEditorService.updateExistingChannel(channel).then(
						function(chId) { setUserRoles(chId);
							channelEditorService.showMess("Channel " + channel.name + " saved to database"); $scope.clearChannel(false); },
						function(e) { channelEditorService.showMess(e); }
				);

			}
		}
	};

}]);