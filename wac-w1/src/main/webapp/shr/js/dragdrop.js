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

//
// WAC HTML 5 Drag and Drop Library
//
// TODO: Add some sort of error checking so that drop regions "know about"
//       which drag elements they are allowed to accept. Can probably be done
//       using custom attributes or ids or something similar.
//
// This library provides browser-native HTML 5 drag-and-drop capabilities
// to any HTML element marked with the appropriate attributes (see below)
//
// This library has also been designed to work with AngularJS apps in a
// reasonably non-intrusive way.
//
// The library consists of this file (dragdrop.js), dragdropng.js, and dragdrop.css.
//
// Usage:
// In the HTML code include this javascript file and the corresponding CSS file:
// <link rel="stylesheet" href="/wac-w1/shr/css/dragdrop.css"/>
// <script src="/wac-w1/shr/js/dragdrop.js></script>
// and
// <script src="/wac-w1/shr/js/dragdropng.js></script>
// if writing an AngularJS app
//
// Mark any draggable elements with class "wac-draggable", and include
// a data attribute called data-transfer-data="data-to-be-transferred" which
// will contain any special data to be transferred to the drop region.
// NOTES:
// -- data-transfer-data can be bound to angularjs using the normal data binding.
// -- JavaScript objects can be transferred by calling JSON.stringify before setting as transfer data
//    and calling JSON.parse to restore the object upon receiving the data
//
// <div class="my-class wac-draggable" style="text-weight: bold;" data-transfer-data="5">Display Text</div>
//     or
// <div class="my-ng-class wac-draggable" data-transfer-data="{{bound-ng-data}}">{{Bound display text}}</div>
//
// Note: Text selection will be disabled for these elements and a drag/drop cursor will be
//		will be displayed when mousing over these elements.
//
// Mark any droppable regions with class "wac-droppable":
//
// <div class="my-drop-class wac-droppable" ... >Display Text</div>
//
// Finally for any elements that you would like to "erase" by dragging to nowhere, mark with the class "wac-erasable"
// and include element identification data in the "data-transfer-data" attribute.
// Then include a callback function that will use this transfer data to remove the dragged element.
//
// In order to initialize the drag-drop event listeners, SetupDragAttrib(), SetupEraseAttrib(eraseCallback), and
// SetupDropAttrib(dropCallback) must be called from the main app upon page load.
// Note that SetupDropAttrib() requires a callback function, which will be responsible for taking the transferred
// data and doing something with it within the app itself.

var counter = 0;

var SetupDragAttrib = function() {

	// find draggable elements
	var el = document.getElementsByClassName('wac-draggable');

	// loop through the list of draggable elements and bind to eventListeners
	for (var i=0; i<el.length; i++) {
		el[i].setAttribute('draggable', 'true');
		el[i].addEventListener('dragstart', handleDragStart, false);
		el[i].addEventListener('dragend', handleDragEnd, false);
	}

	// define event listener functions
	function handleDragStart(e) {
		this.style.opacity = '0.4';
		 e.dataTransfer.effectAllowed = 'copy';
		 e.dataTransfer.setData('Text', this.dataset.transferData);
	}

	function handleDragEnd(e) {
		this.style.opacity = '1.0';
	}

}

var SetupEraseAttrib = function(eraseCallback) {

	var el = document.getElementsByClassName('wac-erasable');

	for (var i=0; i<el.length;i++) {
		el[i].setAttribute('draggable', 'true');
		el[i].addEventListener('dragstart', handleEraseStart, false); // same as drag start method
		el[i].addEventListener('dragend', handleEraseEnd, false);
	}

	// define event listener functions
	function handleEraseStart(e) {
		this.style.opacity = '0.4';
		 e.dataTransfer.effectAllowed = 'copy';
		 e.dataTransfer.setData('Text', this.dataset.transferData);
	}

	function handleEraseEnd(e) {
		this.style.opacity = '1.0';
		eraseCallback(e.dataTransfer.getData('Text'));
	}
}

var SetupDropAttrib = function(dropCallback) {

	// find drop region elements
	var el = document.getElementsByClassName('wac-droppable');

	// loop through the list and bind to corresponding event listeners
	for (var i=0; i<el.length; i++) {
		el[i].addEventListener('dragleave', handleDragLeave, false);
		el[i].addEventListener('drop', handleDrop, false);
		el[i].addEventListener('dragenter', handleDragEnter, false);
		el[i].addEventListener('dragover', handleDragOver, false);
		el[i].addEventListener('dragend', handleDragEnd, false);
	}

	// define event listener functions
	function handleDragLeave(e) {
		counter--;
		if (counter === 0)
			this.classList.remove('over');
	}

	function handleDrop(e) {
		if (e.preventDefault) e.preventDefault();
		if (e.stopPropagation) e.stopPropagation();

		this.classList.remove('over');

		dropCallback(e.dataTransfer.getData('Text'), e);

		return false;
	}

	function handleDragEnter(e) {
		counter++;
		this.classList.add('over');
	}

	function handleDragOver(e) {
		if (e.preventDefault) e.preventDefault();

		e.dataTransfer.dropEffect = 'copy'; // has to match the dropEffect set in 'handleDragStart'

		return false;
	}

	function handleDragEnd(e) {
		this.classList.remove('over');
	}
}