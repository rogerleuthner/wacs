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

channelEditorApp.controller('ChannelModalController', ['$scope', '$modalInstance', 'items', 'channelEditorService',
                                                       function($scope, $modalInstance, items, channelEditorService) {

	$scope.channellist = null;

	channelEditorService.getChannelList().get().then(
			function(result) {
				$scope.channellist = result;
				$scope.selectedChannel = $scope.channellist[0]; },
			function(e) { channelEditorService.showMess(e.data); }
	);

	$scope.ok = function() {
		$modalInstance.close($scope.selectedChannel);
	};

	$scope.cancel = function() {
		$modalInstance.dismiss(null);
	};

}]);

channelEditorApp.controller('AddUserController', ['$scope', '$modalInstance', 'currentusers', 'channelEditorService',
                                                  function($scope, $modalInstance, currentusers, channelEditorService) {

	$scope.userlist = null;
	$scope.message = "";

	$scope.rolelist = [
	                   { name: "ROLE_ADMIN", color: "red" },
	                   { name: "WAC_SUPER", color: "orange" },
	                   { name: "WAC_CONTROLLER", color: "yellow" },
	                   { name: "WAC_USER", color: "green" },
	                   { name: "WAC_OBSERVER", color: "blue" },
	                   { name: "ROLE_USER", color: "violet" },
	                   { name: "WAC_PLAYER", color: "black" }
	                   ];

	$scope.userroles = [ { name: "ROLE_USER", color: "violet" } ];

	channelEditorService.getUserList().get().then(
			function(result) {
				$scope.userlist = result;
				$scope.selectedUser = $scope.userlist[0];
			},
			function(e) { channelEditorService.showMess(e.data); }
	);

	$scope.updateSelection = function() {
		$scope.message = "";
	};


	$scope.onMouseOver = function() {
		this.showSel = 1.0;
	};

	$scope.onMouseOut = function () {
		this.showSel = 0.4;
	};

	function inCurrentUsers(selected) {
		for (var i=0; i<currentusers.length; i++) {
			if (selected.userName === currentusers[i].username )
				return true;
		}
		return false;
	}

	$scope.ok = function() {
		if (inCurrentUsers($scope.selectedUser)) {
			$scope.message = "Selected User already exists in this channel";
		} else {
			var result = {user: $scope.selectedUser, roles: $scope.userroles};
			$modalInstance.close(result);
		}
	};

	$scope.cancel = function() {
		$modalInstance.dismiss(null);
	};

}]);

channelEditorApp.controller('EditUserController', ['$scope', '$modalInstance', 'user', 'channelEditorService',
                                                   function($scope, $modalInstance, user, channelEditorService) {

	$scope.rolelist = [
	                   { name: "ROLE_ADMIN", color: "red" },
	                   { name: "WAC_SUPER", color: "orange" },
	                   { name: "WAC_CONTROLLER", color: "yellow" },
	                   { name: "WAC_USER", color: "green" },
	                   { name: "WAC_OBSERVER", color: "blue" },
	                   { name: "ROLE_USER", color: "violet" },
	                   { name: "WAC_PLAYER", color: "black" }
	                   ];

	$scope.user = user;
	$scope.userroles = [];

	for (var i=0; i<$scope.user.role.length; i++) {
		for (var j=0; j<$scope.rolelist.length; j++) {
			if ($scope.rolelist[j].name === $scope.user.role[i]) {
				$scope.userroles.push($scope.rolelist[j]);
				break;
			}
		}
	}

	$scope.onMouseOver = function() {
		this.showSel = 1.0;
	};

	$scope.onMouseOut = function () {
		this.showSel = 0.4;
	};

	$scope.ok = function () {
		var result = {user: $scope.user, roles: $scope.userroles};
		$modalInstance.close(result);
	};

	$scope.cancel = function() {
		$modalInstance.dismiss(null);
	};
}]);