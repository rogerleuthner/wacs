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
 * Use:
 *
 * <code>

	<script src="/wac-w1/shr/mnu/FixedMenu.js"></script>

	<script>
		FixedMenu.build();

		FixedMenu.setButtons(
				[ {
						id:'Polyline',
						icon: '/wac-w1/shr/mnu/img/glyphicons_097_vector_path_line.png',
						tooltip: 'Click to start drawing a 2D polyline',
						handler: function() {
			            			alert('polyline');
			            		}
		   		 	},{
						id:'Polygon',
						icon: '/wac-w1/shr/mnu/img/glyphicons_096_vector_path_polygon.png',
						tooltip: 'Click to start drawing a 2D polygon',
						handler: function() {
			            			alert('polygon');
			            		}
		] );

		FixedMenu.addSeparator();

		FixedMenu.addButton( 'marker',
						'/wac-w1/shr/mnu/img/glyphicons_242_google_maps.png',
						'Click to start drawing a 2D marker',
						function() {
	            			alert('marker');
	            		}
	 	);

		FixedMenu.removeButtonByLabel( 'Polygon' );
	</script>

 * </code>
 * @param document
 * @author rleuthner
 */


var FixedMenu = (function(document) {
	var buttonContainer = null;
	var toolbarContainer = null;
	const STYLES_URL = '/wac-w1/shr/mnu/FixedMenu.css';

	function init( CONFIG ) {

		if ( typeof CONFIG == 'undefined' ) {
			throw 'FixedMenu.init() must be invoked with a config object';
		}

		// only build this if not already initialized
		if ( buttonContainer === null ) {
			var bod = document.getElementsByTagName( 'body' )[0];
			toolbarContainer = document.createElement( 'div' );
			toolbarContainer.id = 'fixedMenus';
			bod.appendChild( toolbarContainer );

			buttonContainer = document.createElement( 'div' );
			buttonContainer.className = "fixedMenus";
			toolbarContainer.appendChild( buttonContainer );

			var link = document.createElement( "link" );
			link.setAttribute( 'rel', 'stylesheet' );
			link.setAttribute( 'href', STYLES_URL );
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
		}
	}

	function addButtons( CONFIG ) {
		for( var i = 0; i < CONFIG.length; i++ ) {
			buttonContainer.appendChild( addButton( CONFIG[i].id, CONFIG[i].icon, CONFIG[i].tooltip, CONFIG[i].handler ) );
		}
	}

    function addButton(id, icon, tooltip, handler) {
    	if ( typeof id === 'undefined' || typeof icon === 'undefined' || typeof tooltip === 'undefined' || typeof handler === 'undefined' ) {
    		throw 'Not all required button parameters are defined, cannot continue';
    	}
        var div = document.createElement('DIV');
        div.className = 'button';
        div.title = tooltip;
        // id by id so can remove later
        div.id = id;
        buttonContainer.appendChild(div);
        div.onclick = handler;

        var image = document.createElement('IMG');
        image.src = icon;
        div.appendChild(image);

        return div;
    }
    function addSeparator( ) {
        var div = document.createElement('DIV');
        div.className = 'divider';
        buttonContainer.appendChild(div);
    }
    function removeButtonById( id ) {
    	var elt = document.getElementById( id );
    	elt.parentNode.removeChild( elt );
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
		addButtons( CONFIG );
	}

	// build and configure with top button
	function build(	) {
		init( [
               {

               }
               ] );
	}

	function hide( replacement ) {
		if ( typeof replacement !== 'undefined' ) {
			replacement.style.display = 'block';
		}
		toolbarContainer.style.display = 'none';
		buttonContainer.style.display = 'none';
	}

	function show( replacement ) {
		if ( typeof replacement !== 'undefined' ) {
			replacement.style.display = 'none';
		}
		toolbarContainer.style.display = 'inline';
		buttonContainer.style.display = 'block';
	}

	return {
		build: build,
		setButtons: setButtons,
		addButtons: addButtons,
		addButton: addButton,
		addSeparator: addSeparator,
		removeButtonById: removeButtonById,
		hide: hide,
		show: show
	};

})(window.document);