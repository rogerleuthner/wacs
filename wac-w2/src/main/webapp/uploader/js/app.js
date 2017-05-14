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

var fileUploader = angular.module('fileUploader', [ 'flow', 'ngRoute', 'ui.bootstrap' ])

.config( [ 'flowFactoryProvider', '$routeProvider',

	function ( flowFactoryProvider, $routeProvider ) {

		flowFactoryProvider.defaults = {
		    target: '/wac-wapi/UploadServlet',
		    permanentErrors: [404, 500, 501],
		    maxChunkRetries: 5,
		    chunkRetryInterval: 3000,
		    simultaneousUploads: 4,
		    uploadMethod: 'POST',
		    testChunks: false,
		    progressCallbacksInterval: 200,
		    fileParameterName: 'TARGET_FILE'   // multipart file stream part name; see UploadServlet code

		};

//		flowFactoryProvider.on('catchAll', function (event) {
//			console.log('catchAll', arguments);
//		});

		$routeProvider.when('/', {
	            templateUrl:'views/FileUploader.html',
	            controller: 'Controller'
	     });

		// TODO CORS stanza
	}
]);