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
 * Slide in menu component.  Config with array of objects, each describing
 * a button and it's associated callback.  The first array object configures
 * the initial appearance (inactive button).  Requires two companion .css files
 * (see example).
 *
 * Config options:
 * Main - [label, icon]
 * Each Button - [label, callback, icon]
 *
 * Use:
 *
 * <code>

    <link rel="stylesheet" href="/wac-w1/3rd/ico/ionicons.min.css"/>
	<link rel="stylesheet" href="/wac-w1/shr/css/mfb.css"/>
	<script src="/wac-w1/shr/SlideInMenu.js"></script>

	<script>
		var SLIDEINCONFIG =
			[
				{
					label: 'Button Set X',
					icon: 'css ref icon'
				}, {
					label: 'Button One',
					callback: doSomething,
					icon: 'css ref icon'
				}, {
					label: 'Button Two',
					callback: doSomethingElse,
					icon: 'css ref icon'
				}
		    ];

	SlideInMenu.initialize( SLIDEINCONFIG );

	</script>

 * </code>
 * @param document
 * @author rleuthner
 */


var SlideInMenu = (function(document) {
	var mainDiv = null;
	var buttonContainer;
	const STYLES_URL = '/wac-w1/shr/css/mfb.css';
	const ICON_URL = '/wac-w1/shr/mnu/img/glyphicons_439_wrench.png';

	function init( CONFIG ) {

		if ( typeof CONFIG == 'undefined' ) {
			throw 'SlideInMenu.initialize() must be invoked with a config object';
		}

		// only build this if not already initialized
		if ( mainDiv === null ) {
			var bod = document.getElementsByTagName( 'body' )[0];
			mainDiv = document.createElement( 'div' );
			bod.appendChild( mainDiv );

			var link = document.createElement( "link" );
			link.setAttribute( 'rel', 'stylesheet' );
			link.setAttribute( 'href', STYLES_URL );
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );

			buttonContainer = document.createElement( 'ul' );
			buttonContainer.className = "mfb-component__list";

			var mainButtonIcon = document.createElement('div');
			mainButtonIcon.className = "mfb-component__main-icon--resting";
	        var image = document.createElement('img');
	        image.src = CONFIG[ 0 ].icon;
	        mainButtonIcon.appendChild(image);

			var mainButton = document.createElement( 'div' );
			mainButton.setAttribute( 'data-mfb-label', CONFIG[ 0 ].label );
			mainButton.className = "mfb-component__button--main";

			mainButton.appendChild( mainButtonIcon );

			var buttonWrap = document.createElement( 'li' );
			buttonWrap.className = "mfb-component__wrap";
			buttonWrap.appendChild( mainButton );
			buttonWrap.appendChild( buttonContainer );

			var slideInList = document.createElement( 'ul' );
			slideInList.className = "bt mfb-component--tr mfb-slidein";
			slideInList.appendChild( buttonWrap );

			mainDiv.appendChild( slideInList );
		}
	}

	function addButtons( CONFIG ) {
		// index starts at one since first config object is general,
		// subsequent configure each remaining button
		for( var i = 0; i < CONFIG.length; i++ ) {
			var button = document.createElement( 'button' );
			button.className = "mfb-component__button--child";
			button.addEventListener( 'click', CONFIG[i].callback );

	        var image = document.createElement('img');
	        image.src = CONFIG[i].icon;
	        button.appendChild(image);

			var line = document.createElement( 'li' );
			var buttonDiv = document.createElement( 'div' );
			buttonDiv.setAttribute( 'data-mfb-label', CONFIG[i].label );
			buttonDiv.className = "mfb-component__button--child";

			buttonDiv.appendChild( button );
			line.appendChild( buttonDiv );
			buttonContainer.appendChild( line );
		}
	}

	// private
	function removeButtons( ) {
		while( buttonContainer.firstChild ) {
			buttonContainer.firstChild.remove();
//			buttonContainer.removeChild( buttonContainer.firstChild );
		}
	}

	// public
	function setButtons( CONFIG ) {
		removeButtons();
		if ( typeof CONFIG !== 'undefined' && CONFIG.length > 0 ) {
			addButtons( CONFIG );
		}
	}

	// build and configure with top button
	function build(	) {
		init( [
               {
              	'label': 'App Actions' ,
              	'icon': ICON_URL
               }
               ] );
	}

	function hide( replacement ) {
		if ( typeof replacement !== 'undefined' ) {
			replacement.style.display = 'block';
		}
		if ( mainDiv !== null ) {
			mainDiv.style.display = 'none';
		}
	}

	function show( replacement ) {
		if ( typeof replacement !== 'undefined' ) {
			replacement.style.display = 'none';
		}
		mainDiv.style.display = 'block';
	}

	return {
		build: build,
		setButtons: setButtons,
		addButtons: addButtons,
		hide: hide,
		show: show
	};

})(window.document);