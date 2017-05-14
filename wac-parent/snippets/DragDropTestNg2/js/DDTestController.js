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

DragDropTestApp.controller('DragDropTestController', ['$scope', '$route', '$log',
                                                function($scope, $route, $log) {

	$scope.data = {};

	$scope.data.dragitems = [
	                         { name: "drop item", value: 1 },
	                         { name: "another item", value: 3 },
	                         { name: "this", value: 39 },
	                         { name: "that", value: 42 }
	                         ];

	$scope.data.droppeditems = [];

	$scope.wacOnDragEnd = function(data) {
	};

	$scope.wacOnDrop = function(data) {
		// don't allow duplicates by item name
		var obj = JSON.parse(data);
		var itemInList = false;
		for(var i = 0; i< $scope.data.droppeditems.length; i++) {
			if (obj.name === $scope.data.droppeditems[i].name)
				itemInList = true;
		}
		if (itemInList === false) {
			$scope.data.droppeditems.push(obj);
			$scope.$apply();
		}
	};

	$scope.wacOnEraseEnd = function(data) {
		var d = JSON.parse(data);
		for (var idx=0; idx<$scope.data.droppeditems.length; idx++) {
			if (d.name === $scope.data.droppeditems[idx].name) {
				$scope.data.droppeditems.splice(idx,1);
				$scope.$apply();
				break;
			}
		}
	};

}]);