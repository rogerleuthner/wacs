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

slideshowViewerApp.controller('slideshowController', ['$scope', '$route', '$log', 'slideshowService',
     function($scope, $route, $log, slideshowService) {

	// this ws api channel remains open unless a full reload is done, in which case the websocket is closed by the server
	var controlApi;
	// this ws api channel corresponds to an 'instance' e.g. a shared live slideshow
	var sessionApi;
	const messagetypes = { publishShow: 1, openSession: 2, changeSlide: 3, closeSession: 4, updateSession: 5 };
	// millis delay factor before setting up anno layer for users paging quickly through slides
	const ANNO_SETUP_DELAY = 1000;
	// every possible slide has a slot where the anno layer id, if generated, is kept
	//var annoLayerIds = [];

	// initialize the app with the system so we can send and receive event messages
	function initApp() {
		WAC.sys.initApp(slideshowService.getAppName(), '*', function() {
				controlApi = WSApi( {
					'service' : 'message',
					'target' : WAC.sys.getAppId(),
					'jwt' : WAC.sys.getJWT(),
					'messageHandler' : function(m) {processGeneralEvent(m);$scope.$apply();},
					'errorHandler' : null
				} );

				$scope.data.currentUserName = WAC.sys.getUser();

				// update the Q'd list if found (local data)
				var localQ = WAC.sys.get( WAC.sys.getAppId() );
				if ( typeof localQ !== 'undefined' && localQ !== null ) {
					$scope.data.queued = JSON.parse( localQ );
				}

				// get any shared state messages and 'replay' them
				slideshowService.getMessages( WAC.sys.getAppId() ).get().then(
					function( list ) {
						angular.forEach( list, function( entry ) {
							processGeneralEvent( entry, false );
						} );
					},
					function(e) {
						showMess( e );
					}
				);
				$scope.$apply();
			}
		);
	}

	// 'control channel' Message Handler
	function processGeneralEvent( message ) {
		var data;

		if ( typeof message === 'string' ) {
			data = JSON.parse( message );
		} else {
			data = message;
		}

		switch(data.id) {
		case messagetypes.publishShow: // a new show has been published so add it to the list of available shows
			$scope.data.showing.push(data.data);
			$scope.data.status.showViewPanel = true;
			break;
		case messagetypes.openSession: // we are opening a slideshow session, so update the appropriate slideshow list entry
			for (var i=0; i<$scope.data.showing.length; i++) {
				if ($scope.data.showing[i].filename === data.data.filename)  {   // then we have the same show
					$scope.data.showing[i].inSession = data.data.inSession; // copy the inSession info, which should be true; all other information should remain the same
					$scope.data.showing[i].channelName = data.data.channelName;
					$scope.data.showing[i].currentslide = data.data.currentslide; // prevents incorrect information on viewers' app if the show is stopped and started again
					break;
				}
			}
			if ($scope.data.slideshow.filename === data.data.filename) { // if the owner takes control while we are viewing
				showMess("The owner oshowMesss slideshow is taking control of it for a presentation");
				joinChannel(data.data.channelName);
				$scope.data.status.showSlideControls = false;
				$scope.data.slideshow.inSession = data.data.inSession;
				$scope.data.slideshow.channelName = data.data.channelName;
			}
			break;
		case messagetypes.updateSession: // this message will be broadcase on the general slideshow channel so everyone can view current slide page number
			for (var i=0; i<$scope.data.showing.length; i++) {
				if ($scope.data.showing[i].filename === data.data.filename) {
					$scope.data.showing[i].currentslide = data.data.currentslide; // slide number is the only thing that should change here
					break;
				}
			}
			break;
		case messagetypes.closeSession: // an open session is being closed, so if we are viewing we should destroy the corresponding websocket and take local control of the slideshow
			for (var i=0; i<$scope.data.showing.length; i++) {
				if ($scope.data.showing[i].filename === data.data.filename) {
					$scope.data.showing[i].inSession = data.data.inSession; // only the inSession information should change: this will allow any users who want to keep viewing the slides to remain on the current slide
					break;
				}
			}
			// destroy connection to websocket only if we are actually viewing the slideshow -- we could have a different show open
			if ($scope.data.slideshow.filename === data.data.filename) {
				sessionApi && sessionApi.close();
				$scope.data.status.showSlideControls = true;
				$scope.data.slideshow.inSession = false;
			}
			break;
		default:
			$log.error("bad message in slideshow app: " + data.id);
		}
	}

	// since all 'instance' apps receive all of the control channel messages as well as messages targetted to
	// them, we need to expect messages to come through that are not of current interest (so ignore them)
	function processChannelEvent(message) {
		var data = JSON.parse(message);
		switch(data.id) {
		case messagetypes.changeSlide: // an inSession show has been updated, so update currently viewed slide (this message will only be received by those subscribed to the messsasges)
			// now update the actual slideshow we are viewing (current slide number and slide image)
			$scope.data.slideshow.currentslide = data.data.currentslide;
			updateSlideImage($scope.data.slideshow.filename, $scope.data.slideshow.currentslide);
			$scope.$apply();
			break;
		case messagetypes.updateSession:
			// explicitly ignoring this message, as it's a control channel message
		default:
		}
	}

	// show structure: { name: "", presenter: "", filename: "", nSlides: #, currentslide: #, inSession: bool, channel: "" }

	// The following function will trim a string to length "l" and add an ellipsis
	$scope.limitString = function(s, l) {
		if (s.length > l)
			return s.substring(0, l)+"...";
		else
			return s;
	};

	// ---------------------------  Extend and retract slideshow controls and view boxes ---------------------
	$scope.toggleHiddenTop = function() {
		$scope.data.status.extendSlideControls = !$scope.data.status.extendSlideControls;
	};

	$scope.toggleHiddenRight = function() {
		$scope.data.status.showViewPanel = !$scope.data.status.showViewPanel;
	};

	$scope.toggleHiddenLeft = function() {
		$scope.data.status.showQueuePanel = !$scope.data.status.showQueuePanel;
	};

	// ---------------------------- Slideshow controller functions ------------------------------------------
	function publishNewPage(pageNum) {
		var entry = {}; // create the message data structure
		// pull data from the current local slideshow on the presenter's app
		entry.name = $scope.data.slideshow.name;
		entry.filename = $scope.data.slideshow.filename; // we will use this to identify the show in the receiver's list
		entry.presenter = $scope.data.currentUserName;
		entry.nSlides = $scope.data.slideshow.nslides;
		entry.currentslide = pageNum;  // this is the key bit of new information
		entry.inSession = true;
		sessionApi.publish({'id':messagetypes.changeSlide,'data':entry});
		// update all of the slideouts that a published show has a slide change
		controlApi.publish({'id':messagetypes.updateSession, 'data':entry});
	}

	function updateSlideImage(filename, slidenum) {
		$scope.data.status.slideloading = true;
		SlideInMenu.hide();
		$scope.data.slideshow.url = "/wac-wapi/ss/slide/" + filename + "/" + slidenum;

		// don't do anno layer immediately, as if they are switching through
		// quickly we want to avoid setting it up as it won't have time to
		// complete anyway.
		// after the delay, check to make sure the slide number is still the same;
		// if it has changed aviod initializing the anno layer
		setTimeout( setupAnnotate, ANNO_SETUP_DELAY, filename, slidenum );
	}

	function setupAnnotate(filename,slidenum) {
//		var al;
//		// make sure we're still on the slide of interest, otherwise they're paging
//		// through quickly and we don't need to create anno layer
		if ( slidenum === $scope.data.slideshow.currentslide ) {
//
//			if ( typeof annoLayerIds[ slidenum ] !== 'undefined' ) {
//				// then we are working with restored snapshot, and have not yet initialized the anno app for this slide
//				al = annoLayerIds[ slidenum ];
//				annoLayerIds[ slidenum ] = 'undefined';
//			} else {
//				al = undefined;
//			}

			// initialize 'new' app (annotation layer) for this file/slide
			WAC.sys.initSubApp( 'anno', filename + slidenum,
				function( appId ) {
//					annoLayerIds[ slidenum ] = appId;
					WAC.annoApi.initJS( { target: appId }, function() {
						$scope.data.status.slideloading = false;
						SlideInMenu.show();
//						if ( typeof al !== 'undefined' ) {
//							WAC.annoApi.setState( al );
//						}
						$scope.$apply();
					} );
				}
			);
		}
	}

	$scope.nextSlide = function() {
		// only change slide if we haven't reached the end of the show
		if ($scope.data.slideshow.currentslide < $scope.data.slideshow.nslides-1) {// zero-base page numbers
			$scope.data.slideshow.currentslide++;
			updateSlideImage($scope.data.slideshow.filename, $scope.data.slideshow.currentslide);
			// if we are owner and the current show is in session (we are controlling)
			// broadcast nextSLide message to unique show channel
			if ($scope.data.slideshow.inSession === true)
				publishNewPage($scope.data.slideshow.currentslide);
		}
		// otherwise do nothing (the button should be disabled anyway)
	};

	$scope.prevSlide = function() {
		if ($scope.data.slideshow.currentslide > 0) {
			$scope.data.slideshow.currentslide--;
			updateSlideImage($scope.data.slideshow.filename, $scope.data.slideshow.currentslide);
			// if we are owner and the current show is in session (we are controlling)
			// broadcast prevSLide message to unique show channel
			if ($scope.data.slideshow.inSession === true)
				publishNewPage($scope.data.slideshow.currentslide);
		}
	};

	$scope.gotoStart = function() {
		$scope.data.slideshow.currentslide = 0;
		updateSlideImage($scope.data.slideshow.filename, $scope.data.slideshow.currentslide);
		// if we are owner and the current show is in session (we are controlling)
		// broadcast gotoStart message to unique show channel
		if ($scope.data.slideshow.inSession === true)
			publishNewPage($scope.data.slideshow.currentslide);
	};

	$scope.gotoEnd = function() {
		$scope.data.slideshow.currentslide = $scope.data.slideshow.nslides-1;
		updateSlideImage($scope.data.slideshow.filename, $scope.data.slideshow.currentslide);
		// if we are owner and the current show is in session (we are controlling)
		// broadcast gotoEnd message to unique show channel
		if ($scope.data.slideshow.inSession === true)
			publishNewPage($scope.data.slideshow.currentslide);
	};

	$scope.atStart = function() {
		return $scope.data.slideshow.currentslide === 0;
	};

	$scope.atEnd = function() {
		return $scope.data.slideshow.currentslide === $scope.data.slideshow.nslides-1;
	};

	// ------------------------- End Slideshow Controls ------------------------------------

	// this auxiliary function will load the given slideshow into the local app
	function loadShowLocal(show, slidenum) {
		$scope.data.slideshow.presenter = show.presenter;
		$scope.data.slideshow.currentslide = slidenum;
		$scope.data.slideshow.nslides = show.nSlides;
		$scope.data.slideshow.filename = show.filename;
		$scope.data.slideshow.name = show.name;
		$scope.data.status.slideloading = true;
		$scope.data.slideshow.url = "/wac-wapi/ss/slide/" + $scope.data.slideshow.filename + "/" +$scope.data.slideshow.currentslide;
		$scope.data.status.slideloading = false;
	}

	// this auxiliary function will clear a loaded slideshow from the local app
	function clearShowLocal() {
		$scope.data.status.showSlideControls = false;
		$scope.data.status.showSlideShows = true;
		$scope.data.status.showQueue = true;
		$scope.data.status.isOwner = false;
		$scope.data.slideshow.clear();
	}

	// note that this requires running load show local before it is called, because
	// it pulls from the local show data
	function publishNewSession(channelName) {
		var entry = {}; // create the message data structure
		// pull data from the show given as an argument
		entry.name = $scope.data.slideshow.name;
		entry.filename = $scope.data.slideshow.filename; // we will use this to identify the show in the receiver's list
		entry.presenter = $scope.data.currentUserName;
		entry.nSlides = $scope.data.slideshow.nslides;
		entry.currentslide = 0;
		entry.inSession = true;
		entry.channelName = channelName;
		controlApi.publish({'id':messagetypes.openSession, 'data': entry });
		// start the layer so that we can annotate the first slide
		setTimeout( setupAnnotate, ANNO_SETUP_DELAY, entry.filename, entry.currentslide );
	}

	// This function publishes a message that the slideshow owner has now stopped the presentation
	// the message handler for all other slideshow app instances should destroy the channel if they
	// are currently viewing this slideshow
	function stopSession() {
		var entry = {}; // create the message data structure
		entry.name = $scope.data.slideshow.name;
		entry.filename = $scope.data.slideshow.filename;
		entry.presenter = $scope.data.currentUserName;
		entry.nSlides = $scope.data.slideshow.nslides;
		entry.currentslide = 0;
		entry.inSession = false;
		entry.channelName = undefined;
		controlApi.publish({'id':messagetypes.closeSession, 'data':entry });
	}

	// initialize session channel for sending messages to those who join
	function createChannel(show, ready) {
		sessionApi && sessionApi.close();

		WAC.sys.initApp(slideshowService.getAppName(), show.filename,
			function() {
				sessionApi = WSApi( {
					'service' : 'message',
					'target' : WAC.sys.getAppId(),
					'jwt' : WAC.sys.getJWT(),
					'messageHandler' : function() {/*we ignore all events here, creating just to get the sessionApi initialized for sending*/},
					'errorHandler' : null,
					'callback': ready
				} );
			}
		);
	}

	// joined session channel (slideshow).
	function joinChannel(channelName) {
		$log.info("joining channel: " + channelName);

		sessionApi && sessionApi.close();

		// reinitialize as an instance app
		WAC.sys.initApp(slideshowService.getAppName(), channelName, function() {
			sessionApi = WSApi( {
				'service': 'message',
				'target' : WAC.sys.getAppId(),
				'jwt': WAC.sys.getJWT(),
				'messageHandler': processChannelEvent,
				'errorHandler': null
			} );
		});
	}

	// make sure we don't already have a channel open--if so we need to clear it and send a message to destroy it if we are the owner
	// call this function before we open any new slideshows as a protection in case we didn't close the last one we were viewing
	function safeCloseChannel() {
		if ( sessionApi ) {
			if ($scope.data.slideshow.presenter === $scope.data.currentUserName && $scope.data.slideshow.inSession === true) {
				// we are owner and presenter
				stopSession();
				$scope.data.slideshow.inSession = false;
				sessionApi.close();
			}
			if ($scope.data.slideshow.presenter !== $scope.data.currentUserName && $scope.data.slideshow.inSession === true) {
				// we are viewing an owned presentation
				$scope.data.slideshow.inSession = false;
				sessionApi.close();
			}
		}
		clearShowLocal();
	}

	$scope.processShowButton = function(show) {
		// technically this is slightly inefficient
		// since we already do this to get the button color and label
		var showstate = $scope.getButtonState(show);

		safeCloseChannel();

		switch (showstate.state) {
		case 1: // Owner starts slideshow: claims control over the slideshow and creates a unique channel to view the presentation
			$scope.data.status.slideloading = true;
			createChannel( show, function() {
				$scope.data.status.showSlideControls = true;
				$scope.toggleHiddenRight();
				$scope.data.status.showQueuePanel = false;
				loadShowLocal(show, 0);
				$scope.data.slideshow.inSession = true;
				publishNewSession(show.filename);
				$scope.data.status.slideloading = false;
				$scope.$apply();
			});

			break;
		case 3: // User joins a show in session--connects user to the unique slideshow channel established by the owner
			// connect to unique slideshow channel contained in show entry
			$scope.data.status.showSlideControls = false;
			loadShowLocal(show, show.currentslide);
			$scope.data.slideshow.inSession = true;
			joinChannel(show.channelName);
			$scope.data.status.showQueuePanel = false;
			$scope.data.status.showViewPanel = false;
			break;
		case 4: // User views a show that is not in session--no messages passed and user is allowed to switch slides at his/her convenience
			$scope.data.status.showSlideControls = true;
			$scope.data.status.showQueuePanel = false;
			$scope.data.status.showViewPanel = false;
			loadShowLocal(show, 0);
			break;

			// following all exploit the fact that the safeCloseChannel has already been executed

		case 2: // Owner stops slideshow: removes unique channel and relinqueshes control over the slideshow
			break;
		case 5: // User disconnects from a show in session--removes user from the unique slideshow channel
			break;
		case 6: // User stops viewing a show that is not in session--no messages passed, just clears the screen
			break;
		default:
			showMess("Programming error: bad showstate: " + showstate); // we should never reach this point
		}
	};

	$scope.isShowing = function(show) {
		// this means we are looking at the slideshow in question
		// -- not the same as having the show "in session", which
		// is a slideshow property to be shared across app instances
		return (show.name === $scope.data.slideshow.name);
	};

	$scope.getButtonState = function(show) {
		// This function allows us to have a single, multi-state button
		// for two types of presentation users: presenters and viewers
		// -- Presenters own the slideshow while they are presenting it and
		// control slide transitions for all viewers.
		// -- Viewers can watch a slideshow while controlled by a Presenter
		// where they cannot control slide transitions, or they can view
		// a non-controlled slideshow and scroll through slides at their
		// leisure.
		if ($scope.isOwner(show)) {
			// if we are the owner, we can start and stop the show
			if ($scope.isShowing(show)) { return { state: 2, name: "Stop" }; }
			else { return { state: 1, name: "Start" }; }
		} else {
			if (show.inSession) {
				if ($scope.isShowing(show)) {
					return { state: 5, name: "Leave" }
				} else {
					return { state: 3, name: "Join" }
				}
			} else {
				if ($scope.isShowing(show)) {
					return { state: 6, name: "Stop" }
				} else {
					return { state: 4, name: "View" }
				}
			}
		}
		$scope.$apply();
	};

	$scope.isOwner = function(show) {
		if (show.presenter === $scope.data.currentUserName)
			return true;
		else
			return false;
	};

	$scope.wacOnDrop = function(dropdata) {
		try {
			var dd = JSON.parse( dropdata );
			var temp = { name: dd.name, loading: true, type: dd.type };

			if ( temp.type === 'LINK' ) {
				WAC.sys.fetchResource( dd.id, dd.path,
						function( data ) {
							convertAndAdd( temp, data )
						},
						showMess
					);
			} else {
				convertAndAdd( temp, temp.name );
			}

		} catch( exc ) {
			showMess( 'Failed to convert, please drag from Asset Manager only: ' + JSON.stringify( exc ) );
			return;
		}
	};

	function convertAndAdd( temp, filename  ) {
		$scope.data.queued.push(temp);
		slideshowService.dropSlideshow(filename).get().then(
				function(result) {
					result.text = temp.name;
					var idx = $scope.data.queued.indexOf(temp);
					$scope.data.queued[idx] = result;

					// every time a 'q' entry is completed, resave to local data
					// so it may be restored upon refresh; note this is also done
					// when a q'd show is published so the local state is kept sync'd
					WAC.sys.set( WAC.sys.getAppId(), JSON.stringify( $scope.data.queued ) );
				},
				function(e) {
					temp.failed = true;
					temp.name = 'FAILED CONVERT: ' + temp.name;
				}
		);
	}


	// This function will move the slideshow from the owner's queue to the general slideshow viewing region
	// where all users can see and view it.
	$scope.publishShow = function(show) {
		// set up temporary object to be placed in view queue
		var entry = {};
		$scope.data.status.showViewPanel = true;
		// create an object with all the properties we need for each slideshow
		entry.name = show.text;
		entry.filename = show.data.inputFile;  // the name 'inputFile' comes from the backend JSON
		entry.presenter = $scope.data.currentUserName;
		entry.nSlides = show.data.frames;
		entry.currentslide = 0;
		entry.inSession = false;
		// place temporary object into view queue (since we don't get our own messages)
		$scope.data.showing.push(entry);
		// remove corresponding object from publish queue
		var idx = $scope.data.queued.indexOf(show);
		$scope.data.queued.splice(idx, 1);
		// create and broadcast message that a new slideshow is available
		// a new show has been published so add it to the list of available shows
		controlApi.publish( {'id': messagetypes.publishShow, 'data': entry} );
		// finally remove the item from the local data by saving new state over it
		WAC.sys.set( WAC.sys.getAppId(), JSON.stringify( $scope.data.queued ) );
	};


	// Set up the data structures we will need to keep track of the
	// available slideshows and display the current slideshow
	function setupScopeDataStructs() {

		$scope.data = {};
		$scope.data.slideshow = {
				name: undefined,
				presenter: undefined,
				url: undefined,
				filename: undefined,
				nslides: 0,
				currentslide: 0,
				inSession: false,
				channelName: undefined,
				clear: function () {
					this.name = undefined;
					this.presenter = undefined;
					this.filename = undefined;
					this.url = undefined;
					this.nslides = 0;
					this.currentslide = 0;
					this.inSession = false;
					this.channelName = undefined;
				}
		};
		$scope.data.status = {
				showSlideControls: false,
				extendSlideControls: true,
				showViewPanel: true,
				showQueuePanel: true,
				isOwner: false,
				slideloading: false,
		};

		// This array contains the slideshows that the user has uploaded to the queue
		// Only the owner can see these
		$scope.data.queued = [];

		// This array contains the slideshows that have been moved from the queue to the viewing
		// region, where all users can see them.
		$scope.data.showing = [];

	}

	function showMess( mess ) {
		document.getElementById( 'message' ).innerHTML = mess;
		document.getElementById( 'errModal' ).style.display = 'block';
	}

	$scope.dismissMess = function() {
		document.getElementById( 'errModal' ).style.display = 'none';
	}

//	function getState() {
//		return JSON.stringify( {
//					slideshow : {
//							name: $scope.data.slideshow.name,
//							presenter: $scope.data.slideshow.presenter,
//							url: $scope.data.slideshow.url,
//							filename: $scope.data.slideshow.filename,
//							nslides: $scope.data.slideshow.nslides,
//							currentslide: $scope.data.slideshow.currentslide,
//							inSession: $scope.data.slideshow.inSession,
//							channelName: $scope.data.slideshow.channelName
//					},
//					status : {
//							showSlideControls: $scope.data.status.showSlideControls,
//							extendSlideControls: $scope.data.status.extendSlideControls,
//							showViewPanel: $scope.data.status.showViewPanel,
//							showQueuePanel: $scope.data.status.showQueuePanel,
//							isOwner: $scope.data.status.isOwner,
//							slideloading: $scope.data.status.slideloading
//					},
//					queued : $scope.data.queued,
//					showing : $scope.data.showing,
//					annoIds : JSON.stringify( annoLayerIds ),
//					annos: getAnnoStates()
//		} );
//	}
//
//	function getAnnoStates( ) {
//		var ss = [];
//		// for each possible anno, get the messages if any and put the messages string into slide # array slot
//		for( var i in annoLayerIds ) {
//			if ( typeof annoLayerIds[ i ] !== 'undefined' ) {
//				WAC.wst.getMessages(
//					function( s ) {
//						ss[ i ] = s;
//					}, annoLayerIds[ i ], false );
//			}
//		}
//		// since getmessages issued async = false, this should be ready now
//		return JSON.stringify( ss );
//	}
//
//	function setState( state ) {
//		state = JSON.parse( state );
//
//		$scope.data.slideshow.name = state.slideshow.name;
//		$scope.data.slideshowpresenter = state.slideshow.slideshowpresenter;
//		$scope.data.slideshowurl = state.slideshow.slideshowurl;
//		$scope.data.slideshowfilename = state.slideshow.slideshowfilename;
//		$scope.data.slideshownslides = state.slideshow.slideshownslides;
//		$scope.data.slideshowcurrentslide = state.slideshow.slideshowcurrentslide;
//		$scope.data.slideshowinSession = state.slideshow.slideshowinSession;
//		$scope.data.slideshowchannelName = state.slideshow.slideshowchannelName;
//
//		$scope.data.status.showSlideControls = state.status.showSlideControls;
//		$scope.data.status.extendSlideControls = state.status.extendslideControls;
//		$scope.data.status.showViewPanel = state.status.showViewPanel;
//		$scope.data.status.showQueuePanel = state.status.showQueuePanel;
//		$scope.data.status.isOwner = state.status.isOwner;
//		$scope.data.status.slideloading = state.status.slideloading;
//
//		$scope.data.queued = state.queued;
//		$scope.data.showing = state.showing;
//		annoLayerIds = JSON.parse( state.annoIds );
//		// sparse array of anno states
//		$scope.data.annos = state.annos;
//	}
//
//	function eventReceiver( e ) {
//		var o = JSON.parse( e );
//
//		switch( o.op ) {
//			case WAC.sys.STATESAVE:
//				WAC.wst.update( o.data, WAC.sys.getAppId(), $scope.data.slideshowfilename, getState() );
//				break;
//			case WAC.sys.STATESET:
//				WAC.wst.getAppHead( setState );
//				break;
//		}
//	}

	// scope function definitions depend upon these structures existing
	setupScopeDataStructs();

	WAC.sys.WACInit( initApp, null, null );

}]);