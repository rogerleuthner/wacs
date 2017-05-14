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

channelEditorApp.directive('draggable', function() {

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
						scope.$parent.selectedRole = scope.obj;
						return false;
					},
					false
			);

			el.addEventListener(
					'dragend',
					function(e) {
						this.classList.remove('drag');
						scope.$parent.selectedRole = null;
						return false;
					},
					false
			);

		}

	};

});

channelEditorApp.directive('notdroppable', function() {

	return {
		link: function(scope, element) {

			var el = element[0];

			el.addEventListener(
					'dragover',
					function(e) {
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

channelEditorApp.directive('droppable', function() {

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
					'drop',
					function(e) {
						if (e.preventDefault) e.preventDefault();
						if (e.stopPropagation) e.stopPropagation();
						this.classList.remove('over');

						function contains(array, elm) {
							var i;
							for (i=0;i<array.length;i++)
							{
								if(array[i].name === elm.name)
									return true;
							}
							return false;
						}

						if (!contains(scope.userroles, scope.selectedRole)) {
							scope.userroles.push(scope.selectedRole);
						}
						scope.selectedRole = null;

						return false;
					},
					false
			);
		}
	}

});


channelEditorApp.directive('erasable', function() {

	return {
		link: function(scope, element) {
			var el = element[0];

			el.draggable = true;

			el.addEventListener(
					'dragstart',
					function(e) {
						e.dataTransfer.effectAllowed = 'copy';
						e.dataTransfer.setData('Text', this.src);
						this.classList.add('drag');
						scope.$parent.selectedRole = scope.ur;
						return false;
					},
					false
			);

			el.addEventListener(
					'dragend',
					function(e) {
						this.classList.remove('drag');
						var idx = scope.userroles.indexOf(scope.selectedRole);
						// do not allow removal of the default and required-so-the-user-can-do-something role ROLE_USER
						if (scope.selectedRole.name !== "ROLE_USER") {
						 scope.userroles.splice(idx, 1);
						}
						scope.selectedRole = null;
						return false;
					},
					false
			);
		}
	};

});


