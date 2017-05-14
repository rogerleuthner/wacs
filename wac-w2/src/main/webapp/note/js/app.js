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

var app={};

function init() {
    app.msg_id = 0;
	app.shareApi = WSApi( {
		'service' : 'message',
		'target' : WAC.sys.getAppId(),
		'jwt' : WAC.sys.getJWT(),
		'messageHandler' : handleOneMessage,
		'errorHandler' : null
	} );
    app.advancedEditor = new Quill('.advanced-wrapper .editor-container', {
        modules: {
          'authorship': {
            authorId: 'advanced',
            enabled: true
          },
          'toolbar': {
            container: '.advanced-wrapper .toolbar-container'
          },
          'link-tooltip': true,
          'image-tooltip': true,
          'multi-cursor': true
        },
        styles: false,
        theme: 'snow'
      });

      app.advancedEditor.on('text-change', function(delta, source) {
        if (source === 'api') {
          return;
        }
        sendData( JSON.stringify(delta));

      });

      WAC.wst.getCombo(
    			handleStatic,
    			handleMessages
    	);
}

function handleStatic( d ) {
	var x = JSON.parse( d ).data;
	if ( x !== null ) {
		handleOneMessage( JSON.parse( d ).data );
	}
}

function handleMessages( data ) {
	var data = JSON.parse( data );
	for( var i = 0; i < data.length; i++ ) {
		handleOneMessage( data[ i ] );
	}
}

function sendData(str) {
    app.shareApi.publish(str);
}
function handleOneMessage(str) {
	delta = JSON.parse(str);
    app.advancedEditor.updateContents(delta);
}

function resizeEditor() {
    myEditor = document.getElementById("advanced_wrapper_id");
    if (myEditor) {
        try {
            var targetHeight = window.innerHeight-70; // Change this to the height of your wrapper element
            myEditor.style.height = targetHeight+"px";  // sets the dimensions of the editable area
        }
        catch (err) {
        }
    }
}
window.onresize = function()
{
    resizeEditor();
}

function eventReceiver( e ) {
	var o = JSON.parse( e );

	switch( o.op ) {
		case WAC.sys.STATESAVE:
			WAC.wst.update( o.data, WAC.sys.getAppId(), '*', JSON.stringify( app.advancedEditor.getContents() ) );
			break;
		case WAC.sys.STATESET:
			WAC.wst.getAppHead(
					function( arg ) {
						app.advancedEditor.setContents( JSON.parse( arg ) );
					});
			break;
	}
}

function initApp( ) {
	WAC.sys.initApp( 'note', '*', init );
}

WAC.sys.WACInit( initApp, null, eventReceiver );
