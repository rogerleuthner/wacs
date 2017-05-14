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


// TODO modals should be shared in here, and also code should be shared in project

var thisForm = {}
	,FORM = 'THEFORM'
	,shareApi
	,shareMessage = { 'op':'operation', 'value':'data' }
	,currentForm; 	// retain current form so we can suppress shares of the same form and pass along in case new appstate must be created

function processChangeEvent(event) {
	if (thisForm.applying_received_data === true)
		return;

	var data = {};
	data.username = WAC.sys.getUser();
	data.value = null;
	data.attrib_name = '';
	if (event.target.value !== null) {
		data.value = event.target.value;
		data.attrib_name = 'value';
	}
	data.target_name = event.target.name;
	data.target_id = event.target.id;

	if (event.target.type === 'checkbox' || event.target.type === 'radio' ) {
		data.value = event.target.checked;
		data.attrib_name = 'checked';
	} else if (event.target.type === 'select-one') {
		data.value = event.target.selectedIndex;
		data.attrib_name = 'selectedIndex';
	} else if (event.target.type === 'select-multiple') {
		data.value = [];
		data.attrib_name = "";
		for (var i = 0; i < event.target.options.length; i++) {
			if (event.target.options[i].selected) {
				data.value.push(i);
			}
		}
	}

	sendData(data);

	//Note: We want to call this function on every onchange event to take care of the case when, HTML input elements displayed depend on what has been clicked/selected.
	// It is OK to call this function many times because, according to https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Multiple_identical_event_listeners
	// If multiple identical EventListeners are registered on the same EventTarget with the same parameters, the duplicate instances are discarded.
	// They do not cause the EventListener to be called twice, and since the duplicates are discarded, they do not need to be removed manually
	// with the removeEventListener method.

	setupDOMTree();
}

function showMess( mess ) {
	document.getElementById( 'message' ).innerHTML = mess;
	document.getElementById( 'errModal' ).style.display = 'block';
}

function dismissMess() {
	document.getElementById( 'errModal' ).style.display = 'none';
}

function applyData(data) {
	//data.value = event.target.value;
	//data.attrib_name = 'value';
	//data.target_name = event.target.name;
	//data.target_id = event.target.id;

	var target = window.frames[FORM].document.getElementById(data.target_id);
	if (target.type === 'select-multiple') {
		for (var i = 0; i < data.value.length; i++) {
			target.options[data.value[i]].selected = true;
		}
	} else {
		target[data.attrib_name] = data.value;
	}

	//to account for new HTML elements that potentially could have been added.
	setupDOMTree();
}

function setupDOMTree() {
	var inputElements = window.frames[FORM].document.getElementsByTagName("input")
		,selectElements = window.frames[FORM].document.getElementsByTagName("select")
		,textareaElements = window.frames[FORM].document.getElementsByTagName("textarea");

	for (i = 0; i < inputElements.length; i++) {
		var e = inputElements[i];
		// pick out the text-type fields for putting character by character propagate
		// absence of type implies it's a plain text field, and we propagate all inputs
		if ( e.getAttribute( 'type' ) == 'undefined' || e.getAttribute( 'type' ) == null || e.getAttribute( 'type' ).toUpperCase() == 'text'.toUpperCase() ) {
			e.addEventListener('input', processChangeEvent, false);
			e.addEventListener('change', processChangeEvent, false);
		} else {
			e.addEventListener('change', processChangeEvent, false);
		}
	}
	for (i = 0; i < selectElements.length; i++) {
		selectElements[i].addEventListener('change', processChangeEvent, false);
	}
	for (i = 0; i < textareaElements.length; i++) {
		textareaElements[i].addEventListener('input', processChangeEvent, false);
	}
}

/*
 * 	JUST PROCESS FIELDS IN ORDER and then expect them in the same order when restoring SINCE name/id attributes are OPTIONAL.
 */
function getState() {

	if ( typeof window.frames[FORM] === 'undefined' ) {
		return '';
	}

	var state = []
		,inputElements = window.frames[FORM].document.getElementsByTagName("input")
		,selectElements = window.frames[FORM].document.getElementsByTagName("select")
		,textareaElements = window.frames[FORM].document.getElementsByTagName("textarea");

	for (i = 0; i < inputElements.length; i++) {
		if ( inputElements[ i ].type === 'checkbox' || inputElements[ i ].type === 'radio' ) {
			state.push( inputElements[i].checked );
		} else {
			state.push( inputElements[i].value );
		}
	}
	for (i = 0; i < selectElements.length; i++) {
		state.push( selectElements[i].value );
	}
	for (i = 0; i < textareaElements.length; i++) {
		state.push( textareaElements[i].value );
	}

	return JSON.stringify( state );
}

function setState( state ) {

	if ( typeof window.frames[FORM] === 'undefined' ) {
		return '';
	}

	if ( typeof state === 'string' ) {
		state = JSON.parse( state );
		if ( typeof state.data !== 'undefined' ) {
			state = JSON.parse( state.data );
		}
	}

	var inputElements = window.frames[FORM].document.getElementsByTagName("input")
		,selectElements = window.frames[FORM].document.getElementsByTagName("select")
		,textareaElements = window.frames[FORM].document.getElementsByTagName("textarea")
		,stateIdx = 0;

	_clear();

	if ( state !== null ) {
		for (i = 0; i < inputElements.length; i++) {
			if ( inputElements[ i ].type === 'checkbox' || inputElements[ i ].type === 'radio' ) {
				inputElements[ i ].checked = state[ stateIdx++ ];
			} else {
				inputElements[ i ].value = state[ stateIdx++ ];
			}
		}
		for (i = 0; i < selectElements.length; i++) {
			selectElements[ i ].value = state[ stateIdx++ ];
		}
		for (i = 0; i < textareaElements.length; i++) {
			textareaElements[ i ].value = state[ stateIdx++ ];
		}
	}
}

function clear() {
	// TODO replace with modal
	if ( confirm( 'Are you sure you want to clear all inputs from this form?' ) ) {
		_clear();
	}
}

function _clear() {
	var inputElements = window.frames[FORM].document.getElementsByTagName("input")
	,selectElements = window.frames[FORM].document.getElementsByTagName("select")
	,textareaElements = window.frames[FORM].document.getElementsByTagName("textarea");

	for (i = 0; i < inputElements.length; i++) {
		if ( inputElements[ i ].type === 'checkbox' || inputElements[ i ].type === 'radio' ) {
			inputElements[ i ].checked = false;
		} else {
			inputElements[ i ].value = "";
		}
	}
	for (i = 0; i < selectElements.length; i++) {
		selectElements[ i ].value = "";
	}
	for (i = 0; i < textareaElements.length; i++) {
		textareaElements[ i ].value = "";
	}
}



function refresh() {
	location.reload();
}

function initMenus() {
	SlideInMenu.build();
	SlideInMenu.setButtons( [{label: 'Reload/Switch', icon: '/wac-w1/shr/mnu/img/glyphicons_081_refresh.png', callback: refresh},
	                         // clear is not propagated (messaged), so this would open opportunity for messing up synchronization
							// {label: 'Clear', icon: '/wac-w1/shr/mnu/img/glyphicons_067_cleaning.png', callback: clear}
							]);
}

// if there's a currently displayed image, the buttons appear and should not
var dcb = function(data) {
	var data = JSON.parse( data )
		,getIt = false;

	if ( data.type === 'LINK' ) {
		type = data.path.substring( data.path.lastIndexOf( "." ) + 1);
		getIt = true;
	} else {
		type = data.name.substring( data.name.lastIndexOf( "." ) + 1);
	}

	switch( type ) {
		case 'html':
		case 'htm':
			if ( getIt ) {
				WAC.sys.fetchResource( data.id, data.path,
						function( data ) {
							WAC.sys.sendEventNotice( WAC.sys.FORMSHARE );
							loadFormAndInitialize( data );
							shareApi.publish( { 'op' : 'loadForm', 'value': data } );
						}
					);
			} else {
				WAC.sys.sendEventNotice( WAC.sys.FORMSHARE );
				loadFormAndInitialize( data.name );
				shareApi.publish( { 'op' : 'loadForm', 'value': data.name } );
			}
			break;
		case 'application/pdf':
		case 'pdf':
		case 'PDF':
			if ( getIt ) {
				WAC.sys.fetchResource( data.id, data.path,
						function( data ) {
							WAC.sys.convert( data,
								function( response ) {
									WAC.sys.sendEventNotice( WAC.sys.FORMUPLOAD );
									loadFormAndInitialize( response );
									shareApi.publish( { 'op' : 'loadForm', 'value': response } );
								}
							);
						}
					);
			} else {
				WAC.sys.convert( data.name,
						function( response ) {
							WAC.sys.sendEventNotice( WAC.sys.FORMUPLOAD );
							loadFormAndInitialize( response );
							shareApi.publish( { 'op' : 'loadForm', 'value': response } );
						}
					);
			}

			break;
		default:
			showMess( 'Cannot handle provided suffix: ' + JSON.stringify( data ) );
	}
};

function loadFormAndInitialize( file ) {

	var newBody = document.createElement( 'body' );
	var ifr = document.createElement( 'iframe' );
	ifr.name = FORM;  // note this is hardcoded in the forms.js
	ifr.id = encodeURIComponent( file );

	ifr.src = '/wac-wapi/asset/textfile/' + ifr.id;
	currentForm = file;

	ifr.setAttribute( 'style', 'height:100%;width:100%');
	newBody.appendChild( ifr );
	var body = document.getElementsByTagName( 'body' )[0];
	body.parentNode.replaceChild( newBody, body );

	// the iframe needs to to load before parsing the elements
	ifr.onload = function() {
		WAC.sys.initApp( 'forms', file, initForms );
	}
}

function addButtonListItem( list, form ) {
	var li = document.createElement( 'li' );
	var button = document.createElement( 'button' );
	button.setAttribute( 'class', 'btn btn-primary' );
	button.setAttribute( 'style', 'margin: 2px' );
	button.addEventListener( 'click', function( e ) { loadFormAndInitialize( form ); }, false );
	button.innerHTML = form;
	li.appendChild( button );
	list.appendChild( li );
}

function getAppInstances( ) {
	var request = new XMLHttpRequest();
	request.open("GET", "/wac-wapi/app/listinstances/" + encodeURIComponent( WAC.sys.getAppId() ), true);
	request.onreadystatechange = function(e) {
		if ( request.readyState === 4 ) {
			if ( request.status === 200 ) {

				var o = JSON.parse( request.responseText );
				var l = document.getElementById( 'sharedList' );
				for( var i = 0; i < o.length; i++ ) {
					addButtonListItem( l, o[ i ] );
					document.getElementById( 'running' ).style.display = 'block';
				}

			} else {
				// readyState 4 but bad request status
				throw 'Did not receive requested data: ' + request.statusText;
			}
		} // else, just ignore as the request is not "ready" yet
	};
	request.send();
}

// NOTE that the getState and setState are defined in forms.js,
// but JS let's us reference functions that are not defined yet so it works ok
function eventReceiver( e ) {
	var o = JSON.parse( e );

	switch( o.op ) {
		case WAC.sys.STATESAVE:
			WAC.wst.update( o.data, WAC.sys.getAppId(), currentForm,  getState() );
			break;
		case WAC.sys.STATESET:
			WAC.wst.getAppHead( setState );
			// hickety hack, rebuild this list if it's visible
			var e = document.getElementById( 'sharedList' );
			if ( e != null && e.style.display !== 'none' ) {
				while( e.firstChild ) {
					e.removeChild( e.firstChild );
				}
				getAppInstances();
			}
			break;
	}
}

function processRequest( message ) {
	message = JSON.parse( message );

	switch ( message.op ) {
		case 'loadForm':
			addButtonListItem( document.getElementById( 'sharedList' ), message.value );
			break;
	}
}

function initApp( ) {
	WAC.sys.initApp( 'forms', '*', completeInit );
	SetupDropAttrib( dcb );
}

//dropped in image or startup
function completeInit() {
	if ( typeof shareApi !== 'undefined' ) {
		shareApi.close();
	}
	shareApi = WSApi( {
		'service' : 'message',
		'target' : WAC.sys.getAppId(),
		'jwt' : WAC.sys.getJWT(),
		'messageHandler' : processRequest,
		'errorHandler' : showMess
	} );
	// get running instances so we can assemble a list to choose from
	getAppInstances();
}

function initForms() {
	if ( typeof shareApi !== 'undefined' && shareApi !== null ) {
		shareApi.close();
	}

	thisForm.wsApi = WSApi( {
		'service' : 'message',
		'target' : WAC.sys.getAppId(),
		'jwt' : WAC.sys.getJWT(),
		'messageHandler' : receiveData,
		'errorHandler' : showMess
	} );
	thisForm.msg_id = 0;
	thisForm.applying_received_data = false;

	// form is fully initialized, now get any current state and set it in
	initFormData();
	initMenus();

	// the DOM is not ready yet if form is dropped on
	setupDOMTree();
}

function initFormData() {
	WAC.wst.getCombo(
			setState,
			function( arg ) {
				arg = JSON.parse( arg );
				for( var i = 0; i < arg.length; i++ ) {
					receiveData( arg[ i ] );
				}
			}
	);
}

function sendData(data) {
	var str = JSON.stringify(data);
	thisForm.wsApi.publish(str);
}

function receiveData(str) {
	var data = JSON.parse(str);
	// messages that are also in the message list include    {"op":"loadForm","value":"RandomForm.html"}
	if ( typeof data.op === 'undefined' && data.op !== 'loadForm' ) {
		thisForm.applying_received_data = true;
		applyData(data);
		thisForm.applying_received_data = false;
	}
}

WAC.sys.WACInit( initApp, null, eventReceiver );