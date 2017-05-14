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

// ngDragDrop - an Angular-based Drag and Drop library
//
// Author - Wesley Krueger - April 2015
//
// This Angular module provides native angular Drag-Drop functionality
// using user-defined drag-drop callbacks to transfer user-defined data.

// Usage:
// First declare 'ngdragdrop' in the declaration of the module where you
// would like to have drag-drop support:
// var MyApp = angular.module('myModule', ['dependency', 'ngdragdrop', 'another.dependency']);
//
// Then, in your HTML view, use the "draggable" attribute to link each draggable element to the
// draggable directive, and use the data-transfer-data attribute to bind the data you would like
// to transfer on drag:
// <div class="my-draggable-item" ng-repeat="item in data.dragitems" draggable data-transfer-data="{{item}}">{{item.name}}</div>
//
// Use the "droppable" attribute to link each drop area to the droppable directive
// <div class="well col-xs-5 drop-region" droppable>drop region</div>
//
// If you would like any items to be "erasable" by "dragging to nowhere", use the "erasable"
// attribute as well as the data-transfer-data attribute set to some bit of data that will
// uniquely identify the element to delete:
// <div class="my-erasable-item" ng-repeat="item in data.eraseitems" erasable data-transfer-data="{{item}}">{{item.name}}</div>
//
// Finally, in your controller, create three functions in your scope:
// $scope.wacOnDragEnd = function(data) { // handle string data };
// $scope.wacOnDrop = function(data) { // handle string data };
// $scope.wacOnEraseEnd = function(data) { // handle string data };
//
// These functions will have access to the scope of your controller, and can thus be used to perform
// any scope-level data manipulation required by the drag-drop action.

// Certain elements (text input boxes, etc.) may accept drop events, even though this is not
// desireable behavior. This can be prevented by using the 'notdroppable' attribute in these elements.

// Note also that it is possible to drag between browser windows that include draggable and droppable elements
// as defined here (and also defined with the corresponding HTML5 library); however, when dragging to a new
// window, the entire window (except the defined drop region(s)) becomes a redirect drop zone, and will attempt
// to redirect to the data string (and likely fail). This is a known issue and we are working on a fix.

var WACDragDrop = angular.module('ngdragdrop', []);

WACDragDrop.directive('draggable', function() {

	return {

		link: function(scope,element) {

		var el=element[0];

		el.draggable = true;

		el.addEventListener(
				'dragstart',
				function(e) {
					e.dataTransfer.effectAllowed = 'copy';
					e.dataTransfer.setData('Text', this.dataset.transferData);
					this.classList.add('drag');
					return false;
				},
				false
		);

		el.addEventListener(
				'dragend',
				function(e) {
					if ( typeof scope.wacOnDragEnd === 'function' ) {
						this.classList.remove('drag');
						scope.wacOnDragEnd(e.dataTransfer.getData('Text'));
						// scope.wacOnDragEnd( this.getAttribute( 'data-transfer-data' ) );
					} // else don't do anything, there is no end setup at the source
					return false;
				},
				false
			);

	}
};

});

//prevent dropping role images in text boxes, where it turns into the URL for the image
WACDragDrop.directive('notdroppable', function () {

return {
	link: function(scope, element) {
		var el = element[0];

		el.addEventListener(
				'dragover',
				function(e){
					e.dataTransfer.dropEffect = 'none';
					if (e.preventDefault) e.preventDefault();
					return false;
				},
				false
		);

		el.addEventListener(
				'dragenter',
				function(e) {
					if (e.preventDefault) e.preventDefault();
					return false;
				},
				false
		);

		el.addEventListener(
				'dragleave',
				function(e) {
					if (e.preventDefault) e.preventDefault();
					return false;
				},
				false
		);

		el.addEventListener(
				'drop',
				function(e) {
					if (e.preventDefault) e.preventDefault();
					if (e.stopPropagation) e.stopPropagation();
					return false;
				},
				false
		);
	}
};

});

WACDragDrop.directive('droppable', function() {

return {
	link: function(scope, element) {
		var el = element[0];

		el.addEventListener(
				'dragover',
				function(e) {
					e.dataTransfer.dropEffect = 'copy';
					if (e.preventDefault) e.preventDefault();
					this.classList.add('over');
					return false;
				},
				false
		);

		el.addEventListener(
			'dragenter',
			function(e) {
				this.classList.add('over');
				return false;
			},
			false
		);

		el.addEventListener(
				'dragleave',
				function(e) {
					this.classList.remove('over');
					return false;
				},
				false
		);

		el.addEventListener(
				'drop',
				function(e) {
					if ( typeof scope.wacOnDrop === 'function' ) {
						if (e.preventDefault) e.preventDefault();
						if (e.stopPropagation) e.stopPropagation();
						this.classList.remove('over');

						// figure out if we're accepting a drag in from the desktop or another component

						// TODO this has a huge potential issue browser dependency issue since FireFox 45 passes in three
						// types (e.g. "application/x-moz-file", "text/x-moz-url", "Files"), while chrome/opera pass in "Files"
						// in the first slot ... so take the huge leap of faith that the chronologically LAST array entry contains
						// the more-or-less standard "Files"
						if ( e.dataTransfer.types[  e.dataTransfer.types.length - 1 ].match( /text/g ) ) { // 'text/plain', 'text/html'
							scope.wacOnDrop(e.dataTransfer.getData('Text'));

						} else if ( e.dataTransfer.types[ e.dataTransfer.types.length - 1 ] === 'Files' ) {
							scope.wacOnDrop( e.dataTransfer.files );

						} else {
							throw( "Drop type: " + e.dataTransfer.types[ e.dataTransfer.types.length - 1 ] + " not handled by ngdragdrop.js" );
						}
					}
					return false;
				},
				false
		);
	}

}

});

WACDragDrop.directive('erasable', function() {

	return {
		link: function(scope, element) {
			var el = element[0];

			el.draggable = true;

			el.addEventListener(
					'dragstart',
					function(e) {
						this.classList.add('drag');
						this.setAttribute('draggable', 'true');
						e.dataTransfer.setData('Text', this.dataset.transferData);
						return false;
					},
					false
			);

			el.addEventListener(
					'dragend',
					function(e) {
						if ( typeof scope.wacOnEraseEnd === 'function' ) {
							this.classList.remove('drag');
							scope.wacOnEraseEnd(e.dataTransfer.getData('Text'));
						}
						return false;
					},
					false
			);
		}
	};

});