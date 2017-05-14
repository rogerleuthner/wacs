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

var channelEditorApp = angular.module('channelEditor', ['ngRoute', 'restangular', 'ui.bootstrap', 'ui.grid', 'ui.grid.selection']);

channelEditorApp.config(

		['$routeProvider', 'RestangularProvider', '$locationProvider',
		 function ($routeProvider, RestangularProvider, $locationProvider) {

			RestangularProvider.setBaseUrl('/wac-wapi');

			RestangularProvider.setDefaultHeaders({ Authorization: WAC.sys.getJWT() });

			RestangularProvider.setDefaultHttpFields({ cache: false });

			$routeProvider.when('/', {
				templateUrl: 'views/main.html',
				controller: 'ChannelEditorController'
			});
		}]
);

channelEditorApp.config(
		['$httpProvider', function($httpProvider) {
			// following supposedly fixes CORS problems
			$httpProvider.defaults.useXDomain = true;
			delete $httpProvider.defaults.headers.common['X-Requested-With'];
		}]
);

channelEditorApp.factory('channelEditorService', ['Restangular', '$rootElement', function(Restangular, $rootElement) {

	return {

		showMess: function( mess ) {
			document.getElementById( 'message' ).innerHTML = mess;
			document.getElementById( 'errModal' ).style.display = 'block';
		},

		showConfirm: function( mess, callback ) {
			document.getElementById( 'cmessage' ).innerHTML = mess;
			document.getElementById( 'confirmModal' ).style.display = 'block';
			document.getElementById( 'confirmModalButton' ).onclick = function() {
				document.getElementById("confirmModal").style.display = "none";
				callback();
			}
		},

		getAppName: function() {
			return $rootElement.attr('data-ng-app');
		},

		getChannelList: function() {
			return Restangular.one('channel/list');
		},

		getUserList: function() {
			return Restangular.one('user/listusers');
		},

		getUserByChannel: function(chId) {
			return Restangular.one('user/getuser', chId);
		},

		createNewChannel: function(channelObj) {
			return Restangular.all('channel/createchannel').post(JSON.stringify(channelObj));
		},

		updateExistingChannel: function(channelObj) {
			return Restangular.all('channel/update').post(JSON.stringify(channelObj));
		},

		addUserAndRoles: function(userObj) {
			return Restangular.all('user/adduserandroles').post(JSON.stringify(userObj));
		},

		updateUserAndRoles: function(userObj) {
			return Restangular.all('user/updateuserandroles').post(JSON.stringify(userObj));
		}
	};
}]);