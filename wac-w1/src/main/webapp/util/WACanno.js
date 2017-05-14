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


/**
 * Interface to annotating functionality.
 *
 * @author Roger Leuthner
 */

WAC.annoApi = (function(win) {

	var app = {},
		initiator = false,
		originatorHeight = null,
		originatorWidth = null,
		wsapi,
		target;
	const tCanvasElt = win.document.getElementById( 'waccanvas' );
	// prevent annoying discolored square while loading
	tCanvasElt.height='1px';
	tCanvasElt.width='1px';
	const hideStyle = 'display: none';
	const showStyle = 'display: block';
	const ANNO_ICON_URL = '/wac-w1/shr/mnu/img/glyphicons_150_edit.png';
	const ANNO_ICON_OFF_URL = '/wac-w1/shr/mnu/img/glyphicons_150_edit_off.png';
	const ANNO_ICON_REFRESH_URL = '/wac-w1/shr/mnu/img/glyphicons_081_refresh.png';
	var BASE_MENU =  [{label: 'Annotate', icon: ANNO_ICON_URL, callback: initiateAnnotate},
                        {label: 'Reset', icon: ANNO_ICON_REFRESH_URL, callback: refresh}];

	function routeMessage( message ) {
		if ( typeof message === 'string' ) {
			message = JSON.parse( message );
		}

		// process control message
		if ( typeof message.op !== 'undefined' ) {
			var err = '>>>>> non-annotate, non-control command: ' +  JSON.stringify( message );

			switch ( message.op ) {
				case 'annotate':
					switch ( message.data ) {
						case 'start':
							initiator = false;
							show( message.size );
							break;
						case 'stop':
							hide();
							break;
						default:
							console.log( err );
					}
					break;
				default:
					console.log( err );
			}

		// process graphics message
		} else {
			//try {
				app.tcanvas.receiveCommand(  message  );

			//} catch ( e ) {
			//	console.log( err );
			//}
		}
	}

	function refresh() {
		location.reload();
	}

	// provide conf.target if needing to init anno app with specific id;
	// otherwise the current app id is used as the target.
	// this allows operating a app that has anno layers as a contained app.
	function commonInit( conf ) {
		// if not configured, then use the existing app id for the anno target;
		// otherwise we are probably wanting multiple anno data sets for a single app (slideshow)
		if ( typeof conf !== 'undefined' && conf.target ) {
			target = conf.target;
		} else {
			target = WAC.sys.getAppId();
		}

		// this will happen if a new picture is dragged in; e.g. need a 're-init' w/o page load
		if ( typeof app.tcanvas !== 'undefined' ) {
			if ( typeof wsapi !== 'undefined' ) {
				wsapi.close();
			}
		}

		app.canvas = tCanvasElt;
		app.context = app.canvas.getContext("2d");
		app.tcanvas = new WAC.anno.wacCanvas(app.canvas);
		app.tcanvas.originalWindowWidth=win.innerWidth;
		app.tcanvas.originalWindowHeight=win.innerHeight;
		app.canvas.width = app.tcanvas.originalWindowWidth;
		app.canvas.height = app.tcanvas.originalWindowHeight;
		app.tcanvas._Object.draw();

		WAC.anno.dialogs.createEditTextDialog();
		WAC.anno.dialogs.createEditFontDialog();
		WAC.anno.dialogs.createEditLineWidthDialog();
		WAC.anno.dialogs.createEditColorDialog();
	    WAC.anno.dialogs.createEditOpacityDialog();

		function receive() {
			routeMessage( arguments[ 0 ] );
		}
		wsapi = WSApi( {
					service:'message',
					target: target,
					jwt: WAC.sys.getJWT(),
					messageHandler: receive,// layer.tcanvas.receiveCommand,
					errorHandler: null
		});
		app.tcanvas.wsapi = wsapi;  // share channel for control messages

		FixedMenu.setButtons(
				[{
					id: 'line', tooltip: 'New Line', handler:
						function() {
							WAC.anno.createLine(tCanvasElt.self, null, null, null, null);
						}, icon: '/wac-w1/shr/mnu/img/glyphicons_097_vector_path_line.png' }, {
					id: 'rect', tooltip: 'New Rectangle', handler:
						function() {
							WAC.anno.createRect(tCanvasElt.self, null, null);
						}, icon: '/wac-w1/shr/mnu/img/glyphicons_094_vector_path_square.png' }, {
//					id: 'highlighter', tooltip: 'New Highlighter', handler:
//						function() {
//							var rect = WAC.anno.createRect(tCanvasElt.self, null, null);
//				            rect._lineColor = "#FFFF00";
//				            rect._fillColor = "#FFFF00";
//				            rect._transparent = false;
//				            rect._opacity = 0.5;
//
//				            app.tcanvas.sendCommand(new WAC.anno.wacCmd_SetColor(rect.getID(), "_lineColor", rect._lineColor));
//				            app.tcanvas.sendCommand(new WAC.anno.wacCmd_SetColor(rect.getID(), "_fillColor", rect._fillColor));
//						}, icon: '/wac-w1/shr/mnu/img/glyphicons_094_vector_path_highlighter.png' }, {
					id: 'free', tooltip: 'New FreeHand', handler:
						function() {
							WAC.anno.createFreeHand(tCanvasElt.self, null, null);
						}, icon: '/wac-w1/shr/mnu/img/glyphicons_030_pencil.png' }, {
					id: 'text', tooltip: 'New Text', handler: function() {
							WAC.anno.createText(tCanvasElt.self, null, null);
						}, icon: '/wac-w1/shr/mnu/img/glyphicons_107_text_resize.png' }, {
					id: 'clear', tooltip: 'Clear', handler: function() {
							tCanvasElt.self.clear();
							tCanvasElt.self.redraw();
						}, icon: '/wac-w1/shr/mnu/img/glyphicons_067_cleaning.png' } ] );
	}

	// get and set respectively need to 1) insert the original scale command to the save state string
	// so we know what to start scaling from and 2) pick out that command and set the scale prior to restoring the state.
	// assumption here is that the originatorHeight/Width has been set from the command messages ...
	// TODO ensure that this is true
	function getState() {
		var state = tCanvasElt.self.saveObjects();
		// manually consruct and insert a start/scale command as the first action
		var scaleStartCmd = {
				'op': 'annotate',
				'data': 'start',
				'size': {
						'width': originatorWidth,   // TODO what if they have not initiated any layer actions; this won't have a value yet.
						'height': originatorHeight
					}
		};

		state.unshift( scaleStartCmd );

		return JSON.stringify( state );
	}

	function setState( stateStr ) {
		// when setting state where none exists, could happen
		if ( stateStr !== null && stateStr !== "" ) {
			var state = JSON.parse( stateStr );
			// cmd should be the first item in two item array
			var scaleStartCmd = state[ 0 ];
			// play the scale - this sets originatorWidth and Height
			routeMessage( scaleStartCmd );
			// done with that command so delete it
			state.shift();

			tCanvasElt.self.restoreObjects( state, true );
		}
	}

	// if the closing person is the initiator, shut off the layer so others aren't dangling.
	function terminate() {
		if ( initiator ) {
			wsapi.publish( { 'op' : 'annotate', 'data': 'stop' } );
		}
		if ( typeof wsapi !== 'undefined' ) {
			wsapi.close();
		}
	}

	function scaleDrawing()
	{
		if ( tCanvasElt.self ) {
			tCanvasElt.width = win.innerWidth;
			tCanvasElt.height = win.innerHeight;
			var scaleW =  tCanvasElt.width/tCanvasElt.self.originalWindowWidth;
			var scaleH =  tCanvasElt.height/tCanvasElt.self.originalWindowHeight;

			tCanvasElt.self.ctx.scale(scaleW, scaleH);
			tCanvasElt.self._scaleFactorX = scaleW;
			tCanvasElt.self._scaleFactorY = scaleH;

			tCanvasElt.self._Object.draw();
		}
	}

	function show( size ) {
		// when resetting, this layer is not yet available so don't error on resize
		// probably clients should avoid this instead of protecting here
		if ( typeof tCanvasElt !== 'undefined' ) {

			SlideInMenu.setButtons( [{label: 'Quit Annotate', callback: hide, icon: ANNO_ICON_OFF_URL }] );

			FixedMenu.show();


			// 'display: inline'  seems to introduce performance issue when relaying a bunch of commands
			tCanvasElt.setAttribute( 'style', showStyle );

			// the first time this is called, we need to store the height and width, since that is the originator
			// from then on, those are the coords we need to operate from.
			if ( originatorHeight === null && originatorWidth === null ) {
				originatorHeight = size.height;
				originatorWidth = size.width;
			}

			tCanvasElt.self.originalWindowWidth = originatorWidth;
			tCanvasElt.self.originalWindowHeight = originatorHeight;

			scaleDrawing();
		}
	}

	function isAnnotating() {
		return tCanvasElt.getAttribute( 'style' ) === showStyle;
	}

	function hide() {
		// if I initiated, I can terminate (everyone); otherwise, I can only terminate myself
		if ( initiator ) {
			wsapi.publish( { 'op' : 'annotate', 'data': 'stop' } );
			initiator = false;
		}

		tCanvasElt.setAttribute( 'style', hideStyle );

		SlideInMenu.setButtons( BASE_MENU );

		FixedMenu.hide();
	}

	// assumption is that I don't get my own messages
	function initiateAnnotate() {
		var size = {'width': win.innerWidth, 'height': win.innerHeight};
		initiator = true;
		wsapi.publish( { 'op' : 'annotate', 'data': 'start', 'size': size } );
		show( size );
	}

	function handleMessages( arg ) {
		var data = JSON.parse( arg );
		for( var i = 0; i < data.length; i++ ) {
			routeMessage( data[ i ] );
		}
		// now that messages have been replayed, hide as the final state
		// this has to be done here, as it needs to be done only after
		// all of the messages have been replayed
		hide();
	}

	function handleStaticState( arg ) {
		arg = JSON.parse( arg );
		if ( arg.data !== null && arg.status !== 'NO_CONTENT' ) {
			setState( arg.data );
		}
	}

	function syncData( finish ) {
		WAC.wst.getCombo( handleStaticState, handleMessages, target, finish );
	}
// OLD STYLE SYNC, JUST READ FROM MESSAGE QUEU
//		WAC.wst.getMessages(
//				function( arg ) {
//					var data = JSON.parse( arg );
//					for( var i = 0; i < data.length; i++ ) {
//						routeMessage( data[ i ] );
//					}
//					// now that messages have been replayed, hide as the final state
//					// this has to be done here, as it needs to be done only after
//					// all of the messages have been replayed
//					hide();
//				}, target );

	function initJS( conf, finish ) {
		SlideInMenu.build();
		if ( typeof conf !== 'undefined' && conf.appendBtns ) {
			for( var i in conf.appendBtns ) {
				BASE_MENU.push( conf.appendBtns[ i ] );
			}
		}
		SlideInMenu.setButtons( BASE_MENU );
		FixedMenu.build();
		FixedMenu.hide();
		commonInit( conf );
		syncData( finish );
	}

	// when window is resized, reset the menu positions and scale the drawing
	win.addEventListener('resize', function() {
		// a little trickery so that resize is only fired when user stops resize activity,
		// otherwise it's fired like every pixel of resize
		var resizeId;
		clearTimeout( resizeId );
		resizeId = setTimeout(
				function() {
					scaleDrawing();
				}, 500 );
	});

	return {
		initJS: initJS,
		isAnnotating: isAnnotating,
		getState : getState,
		setState: setState,
		terminate: terminate
	};


})(window);