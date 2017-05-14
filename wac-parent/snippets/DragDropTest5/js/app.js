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

window.onload = function() {

	var dragitems = [
	             { name: "drop item", value: 1 },
	             { name: "another item", value: 3 },
	             { name: "this", value: 39 },
	             { name: "that", value: 42 }
	             ];

	var dragRegion = document.getElementsByClassName("drag-region");

	for (var i=0; i<dragitems.length; i++) {
		var dragElement = document.createElement('div');
		dragElement.classList.add("drag-item");
		dragElement.classList.add("wac-draggable");
		dragElement.setAttribute("data-transfer-data", JSON.stringify(dragitems[i]));
		dragElement.innerHTML = dragitems[i].name;
		dragRegion[0].appendChild(dragElement);
	}

	var dcb = function(data) {
		var d = JSON.parse(data);
		var dropRegion = document.getElementsByClassName("drop-region");
		var droppedElement = document.createElement('div');
		droppedElement.classList.add("drag-item");
		droppedElement.classList.add("wac-erasable");
		droppedElement.setAttribute("data-transfer-data", data);
		droppedElement.innerHTML = d.name;
		dropRegion[0].appendChild(droppedElement);
		SetupEraseAttrib(eb);
	};

	var eb = function(data) {
		var d = JSON.parse(data);
		var dropRegion = document.getElementsByClassName("drop-region");
		var dropChildren = dropRegion[0].children;
		for (var i=0; i<dropChildren.length; i++) {
			var tmp = JSON.parse(dropChildren[i].getAttribute("data-transfer-data"));
			if(tmp.name === d.name) {
				dropRegion[0].children[i].remove();
				break;
			}
		}


	}

	SetupDragAttrib();
	SetupEraseAttrib(eb);
	SetupDropAttrib(dcb);
};