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

userEditorApp.controller('UserModalController', ['$scope', '$modalInstance', 'items', 'userEditorService',
                                                 function ($scope, $modalInstance, items, userEditorService) {

	$scope.userlist = null;

	function init() {
		userEditorService.getUserList().get().then(
				function(result) { $scope.userlist = result; $scope.selectedUser = $scope.userlist[0]; },
				function(e) { userEditorService.showMess(e.data); }
		);
	}

	$scope.ok = function() {
		$modalInstance.close($scope.selectedUser);
	};

	$scope.cancel = function() {
		$modalInstance.dismiss(null);
	};

	WAC.sys.WACInit( init, null, null );
}]);

userEditorApp.controller('PwdModalController', ['$scope', '$modalInstance', 'items', 'userEditorService',
                                                function($scope, $modalInstance, items, userEditorService) {

	$scope.status = {
			message1: {text: "", style: "text-default" },
			message2: {text: "", style: "text-default" },
			pwdOK: false
	};

	$scope.data = {
			initialPwd: null,
			repeatPwd: null
	};

	$scope.$watch('data.initialPwd', function() {
		var score = checkPassword($scope.data.initialPwd);
		switch (score) {
		case 0:
			$scope.status.message1.text = "";
			$scope.status.message1.style = "text-default";
			break;
		case 1:
			$scope.status.message1.text = "";
			$scope.status.message1.style = "text-default";
			break;
		case 2:
			$scope.status.message1.text = "Password must contain 8 characters or more";
			$scope.status.message1.style = "text-danger";
			break;
		case 3:
			$scope.status.message1.text = "Password OK";
			$scope.status.message1.style = "text-default";
			break;
		default:
			$scope.status.message1.text = "Something happened";
			$scope.status.message.style = "text-warning";
			break;
		}
		$scope.status.pwdOK = false;
		$scope.data.repeatPwd = null;
		},
	true);

	$scope.$watch('data.repeatPwd', function () {
		if ($scope.data.initialPwd !== null && $scope.data.initialPwd.length > 0) {
			if(comparePasswords($scope.data.initialPwd, $scope.data.repeatPwd) === false) {
				$scope.status.message2.text = "Passwords do not match";
				$scope.status.message2.style = "text-danger";
				$scope.status.pwdOK = false;
				}
			else {
				$scope.status.message2.text = "";
				$scope.status.message2.style = "text-default";
				$scope.status.pwdOK = true;
				}
			}
		},
	true);

	$scope.ok = function() {
		// if we click OK, hash the password and return the hash
		userEditorService.getPassHash($scope.data.initialPwd).get().then(
				function(object) { $modalInstance.close(object.hashed);	},
				function(e) { userEditorService.showMess(e); }
		);
	};

	$scope.cancel = function() {
		// if we click cancel, just dump the window and return null
		$modalInstance.dismiss(null);
	}

	// This is a basic template and placeholder for a real password security check
	// It simply checks the length of the entered password and requires that it
	// be greater than or equal to 8 characters.
	// Returns a score based on the "strength" of the password: in this case
	// 0 for null
	// 1 for length 0 chars
	// 2 for length between 1 and 8 chars
	// 3 for length >= 8 chars (acceptable)
	function checkPassword(pwd) {

		if (pwd === null) {
			return 0;
		} else if(pwd.length === 0) {
			return 1;
		} else if(pwd.length > 0 && pwd.length < 8) {
			return 2;
		} else if (pwd.length >= 8) {
			return 3;
		}
	}

	// This function ensures that the user has entered the same password
	// twice as confirmation.
	// Returns "true" or "false" according to whether the passwords match
	// char for char or not.
	function comparePasswords(pwd1, pwd2) {
		if(pwd1 === pwd2)
			return true;
		else
			return false;
	}

}]);