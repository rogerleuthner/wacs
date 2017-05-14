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

userEditorApp.directive('draggable', function() {

		return {

			link: function(scope,element) {

			var el=element[0];

			el.draggable = true;

			el.addEventListener(
					'dragstart',
					function(e) {
						e.dataTransfer.effectAllowed = 'copy';
						e.dataTransfer.setData('Text', this.src);
						this.classList.add('drag');
						scope.$parent.draggedrole = scope.role;
						return false;
					},
					false
			);

			el.addEventListener(
					'dragend',
					function(e) {
						this.classList.remove('drag');
						scope.$parent.draggedrole = null;
						return false;
					},
					false
				);

		}
	};

});

// prevent dropping role images in text boxes, where it turns into the URL for the image
userEditorApp.directive('notdroppable', function () {

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

userEditorApp.directive('droppable', function() {

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
						if (e.preventDefault) e.preventDefault();
						if (e.stopPropagation) e.stopPropagation();

						this.classList.remove('over');

						scope.currentrole = scope.draggedrole;
						scope.draggedrole = null;
						scope.status.roledefined = true;

						return false;
					},
					false
			);
		}

	}

});

// the following directive also captures drag events so we can
// empty the role box by dragging out
userEditorApp.directive('erasable', function() {

	return {
		link: function(scope, element) {
			var el = element[0];

			el.draggable = true;

			el.addEventListener(
					'dragstart',
					function(e) {
						this.classList.add('drag');
						return false;
					},
					false
			);

			el.addEventListener(
					'dragend',
					function(e) {
						this.classList.remove('drag');
						scope.currentrole = null;
						scope.status.roledefined = false;
						scope.$apply();
						return false;
					},
					false
			);
		}
	};

});