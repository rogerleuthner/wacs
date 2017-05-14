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

	$scope.dropCallback = function(data) {
		$scope.data.droppeditems.push(JSON.parse(data));
		$scope.$apply();
	};

}]);