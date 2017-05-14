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

fileUploader.controller('Controller', [ '$scope', 'Service', '$window',
    function ($scope, Service, $window) {

		$scope.progs = 0;

		$scope.$on( 'flow::fileProgress',
			function( event, $flow, file ) {
				$scope.progs = $flow.progress( true ) * 100;
			}
		);

		$scope.$on( 'flow::filesAdded',
			function() {
				$scope.progs = 0;
			}
		);

		$scope.$on( 'flow::fileAdded',
			function() {
				$scope.progs = 0;
			}
		);

		$scope.$on( 'flow::fileError',
				function( event, $flow, file ) {
					alert( arguments [ 3 ] );  // woo hoo!  TODO
					$scope.resetProgress();
				}
			);

		$scope.resetProgress = function( f ) {
			$scope.progs = 0;
		};

		function handleError( d ) {
			alert( JSON.stringify( d ) );
		}
}]);