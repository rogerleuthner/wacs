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

userEditorApp.controller('UserEditorController', ['$scope', '$route', '$timeout', '$modal', '$log', 'userEditorService',
                                                  function($scope, $route, $timeout, $modal, $log, userEditorService) {

	var channellist;

	// TODO: design a data structure (likely in $scope) to hold user data as it is entered
	//		Once the user hits save, this data will be validated by the JS frontend and submitted to the backend for inclusing in the database.
	//
	//		How do we tell the difference between creating a new user and editing an existing user?
	//		This has implications for storing in the database. What if there are two users with identical names?
	//		Do we need a new user vs. existing user tab interface or something?
	//
	//		How do we associate changes in channel/role association if one or the other is changed (especially
	//		if the user has been assigned different roles in multiple channels. How do we know to load the role
	//		from an existing channel vs keep the role that was placed before switching channels?
	//
	//		Do we want to allow the assigned channels to be changed from this interface? Or should we restrict
	//		that to the channel creation/edit interface? If we do the latter, then all we need is a single
	//		channel choose box/region to select the role for a given channel. We can also make roles for
	//		channels

	// use these two variables to indicate that a role
	// has been defined and hold the current role. (should be set and cleared at the same time)
	$scope.currentrole = null;
	$scope.draggedrole = null;
	$scope.roledefined = false;
	$scope.userdata = {};

	$scope.status = {
			roledefined: false,	// indicate whether we have defined a user class for this user
			isnewuser: true,	// indicate whether we are creating a new user or editing an existing user
			datamissing: true	// indicate whether all fields have been completed and/or edited
	};

	// creating a default list of possible user associations/classes
	// these can easily be pulled from the database without changing the code that processes this list
	//
	$scope.roledata = [
	                   {"name":"Civilian", "img":"img/civilian.png", "color":"blue" },
	                   {"name":"EMT", "img":"img/emt.png", "color":"red"},
	                   {"name":"Shooter", "img":"img/shooter.png", "color":"black"},
	                   {"name":"Perp", "img":"img/perp.png", "color":"black"},
	                   {"name":"Supervisor", "img":"img/supervisor.png", "color":"blue"},
	                   {"name":"Fire", "img":"img/fire.png", "color":"orange"},
	                   {"name":"Local Law", "img":"img/locallaw.png", "color":"blue"},
	                   {"name":"Federal Law", "img":"img/fedlaw.png", "color":"purple"},
	                   {"name":"National Guard", "img":"img/natguard.png", "color":"green"},
	                   {"name":"Air Force", "img":"img/airforce.png", "color":"gray"},
	                   {"name":"Army", "img":"img/army.png", "color":"green"},
	                   {"name":"Navy", "img":"img/navy.png", "color":"blue"}
];

	function initApp() {
		WAC.sys.initApp(userEditorService.getAppName(), '*', completeInit);
	}

	function completeInit() {
	}

	WAC.sys.WACInit( initApp, null, null );

	if($scope.data === undefined)
		$scope.data = [];

	// Handle role images and mouse events and mouse cursors

	resetImage($scope);

	$scope.onMouseOver = function() {
		this.imageStyle = {'opacity': '1.0', 'cursor': 'grab'};
	};

	$scope.onMouseDown = function() {
		this.imageStyle = {'cursor': 'grabbing'};
	};

	$scope.onMouseUp = function() {
		this.imageStyle = {'cursor': 'grab'};
	};

	$scope.onDoubleClick = function() {
		// the $timeout call prevents $rootScope.$apply errors when calling alert
		// $timeout(doAlert, 0, true, this.role.name);
		$scope.currentrole = this.role;
		$scope.status.roledefined = true;
		resetImage(this);
	};

	$scope.onMouseOut = function() {
		resetImage(this);
	};

	$scope.clearRole = function() {
		$scope.currentrole = null;
		$scope.status.roledefined = false;
	};

	// sets the role icons back to unhighlighted state with a normal arrow cursor
	function resetImage(im) {
		im.imageStyle = {'opacity':'0.5', 'cursor':'default'};
	}


	// choose user modal box functionality

	$scope.selectUser = function(size) {
		if (!isFormEmpty()) {
			userEditorService.showConfirm( "Do you really want to discard your changes?", function() {getUser(size);} );
		} else {
			getUser(size);
		}
	}

	function getUser(size) {

		var modalInstance = $modal.open({
			templateUrl: 'views/userModal.html',
			controller: 'UserModalController',
			size: size,
			resolve: {
				items: function() {	return $scope.items; }
			},
			scope: $scope,
			backdrop: 'true'
		});

		modalInstance.result.then(
				function (selectedUser) {
					// The user object contains several fields we cannot edit
					// these will break the updater when converted to JSON and back
					// so extract only the useful ones (form fields plus ID and LOCK for
					// correct insertion into the DB later)
					$scope.userdata.id = selectedUser.id;
					$scope.userdata.lock = selectedUser.lock;
					$scope.userdata.first = selectedUser.first;
					$scope.userdata.middle = selectedUser.middle;
					$scope.userdata.last = selectedUser.last;
					$scope.userdata.email = selectedUser.email;
					$scope.userdata.phone = selectedUser.phone;
					$scope.userdata.userName = selectedUser.userName;
					$scope.userdata.hashword = selectedUser.hashword;
					$scope.status.isnewuser = false;
					$log.info('Selected user: ' + $scope.userdata.userName)
				},
				function () { $log.info('No user selected') }
		);

	};

	$scope.changePwd = function (size) {

		var modalInstance = $modal.open({
			templateUrl: 'views/pwdModal.html',
			controller: 'PwdModalController',
			size: size,
			resolve: {
				items: function() { return $scope.items; }
			},
			scope: $scope,
			backdrop: 'true'
		});

		modalInstance.result.then(
				function (hashword) {
					$scope.userdata.hashword = hashword;
					$log.info('Password changed');
					$log.info($scope.userdata.hashword);
				},
				function () { $log.info('Password not changed') }
		);
	};

	// setting conf to true will require confirmation before clearing form
	// setting conf to false will simply clear the form with no confirmation
	$scope.clearData = function(conf) {
		if(conf === true && !isFormEmpty()) {
			userEditorService.showConfirm( "Do you really want to discard your changes?",
				function() {
					$scope.userdata = {};
					$scope.clearRole();
					$scope.status.isnewuser = true;
					$scope.$apply();
				}
			);

		} else {
			$scope.userdata = {};
			$scope.clearRole();
			$scope.status.isnewuser = true;
		}
	};


	// check whether a string is null, undefined or ""
	function isEmptyString(s) {
		if (s === null || s === undefined || s === "")
			return true;
		else
			return false;
	}

	// check whether an email address has a valid format
	function isValidEmail(s) {
		// regex taken from http://www.regular-expressions.info/email.html
		// which gives a reasonably convincing argument why this is sufficient
		// rather than something longer, stricter, more brittle, etc.
		// This will accept strange things like user@company.com.com
		// and reject things like user@organization.museum
		// but the intent here is just a basic format check for 99% of addresses
		// Sending and receiving email is the true confirmation of a valid address.
		var isemail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
		if (isemail.exec(s) !== null)
			return true;
		else
			return false;
	}

	// check whether a phone number has a valid format
	function isValidPhone(s) {
		// regex taken from example at
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters_to_Verify_Input
		// This regex accepts numbers with the following format:
		// (###)-###-####
		// ###-###-#####
		// (###).###.####
		// ###.###.####
		// It can probably be made a little more robust, but for now it's fine
		var isphone = /(?:\d{3}|\(\d{3}\))([-\/\.])\d{3}\1\d{4}/;
		if (isphone.exec(s) !== null)
			return true;
		else
			return false;
	}

	function validateForm() {
		if (isEmptyString($scope.userdata.first)) {
			userEditorService.showMess("First Name is required");
			return false;
		} else if (isEmptyString($scope.userdata.middle)) {
			userEditorService.showMess("Middle Name is required");
			return false;
		} else if (isEmptyString($scope.userdata.last)) {
			userEditorService.showMess("Last Name is required");
			return false;
		} else if (isEmptyString($scope.userdata.email)) {
			userEditorService.showMess("Email is required");
			return false;
		} else if (!isValidEmail($scope.userdata.email)) {
			userEditorService.showMess($scope.userdata.email + " is not a valid email format");
			return false;
		} else if (isEmptyString($scope.userdata.phone)) {
			userEditorService.showMess("Phone is required");
			return false;
		} else if (!isValidPhone($scope.userdata.phone)) {
			userEditorService.showMess($scope.userdata.phone + " is not a valid phone number format");
			return false;
		} else if (isEmptyString($scope.userdata.userName)) {
			userEditorService.showMess("Username is required");
			return false;
		} else if (isEmptyString($scope.userdata.hashword)) {
			userEditorService.showMess("Password is required");
		} else {
			return true;
		}
	}

	function isFormEmpty() {
		// go through all the required fields and return false if any
		// are not empty (except password--if you enter a password with no other data
		// it will be thrown away)
		if (!isEmptyString($scope.userdata.first)) {
			return false;
		} else if (!isEmptyString($scope.userdata.middle)) {
			return false;
		} else if (!isEmptyString($scope.userdata.last)) {
			return false;
		} else if (!isEmptyString($scope.userdata.email)) {
			return false;
		} else if (!isEmptyString($scope.userdata.phone)) {
			return false;
		} else if (!isEmptyString($scope.userdata.userName)) {
			return false;
		} else {
			return true;
		}
	}


	$scope.saveData = function() {

		// validate data before attempting to save
		// form validation will take care of showing error messages
		// and placing cursor in the appropriate region
		if (validateForm() == true) {

			// call appropriate RESTful service, display results, and clear form if save was successful
			if($scope.status.isnewuser) {
				userEditorService.saveNewUser($scope.userdata).then(
						function(result) { userEditorService.showMess("User " + $scope.userdata.userName + " successfully added to database."); $scope.clearData(false); },
						function(e) { userEditorService.showMess(e.getMessage() + "\nA problem occurred, Data not saved"); }
						);
			} else {
				userEditorService.updateUser($scope.userdata).then(
						function(result) { userEditorService.showMess("Changes to User " + $scope.userdata.userName + " saved."); $scope.clearData(false); },
						function(e) { userEditorService.showMess(e.getMessage() + "A problem occurred, Data not modified"); }
						);
			}
		}
	};

}]);
