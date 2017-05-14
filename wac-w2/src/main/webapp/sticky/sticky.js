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



const minHeight = '50px', minWidth = '167px';
var noteId = 0, shareApi, h = minHeight, w = minWidth;

function pubMoveNoteToTopZ( id ) {
	WAC.sys.message( shareApi, 'MOVENOTETOTOPZ', id, WAC.sys.getUser() );
	pubInfo( 'MoveNoteToTopZ' );
}

function pubChange( note ) {
	WAC.sys.message( shareApi, 'CHANGE', describeNote( note ), WAC.sys.getUser() );
	pubInfo( 'Change' );
}

function pubAdd( note ) {
	WAC.sys.message( shareApi, 'ADD', describeNote( note ), WAC.sys.getUser() );
	pubInfo( 'Add' );
}

function pubDelete( id ) {
	WAC.sys.message( shareApi, 'DELETE', id, WAC.sys.getUser() );
	pubInfo( 'Delete' );
}

function pubClear() {
	WAC.sys.message( shareApi, 'CLEAR', null, WAC.sys.getUser() );
	pubInfo( 'Clear' );
}

function pubArrange() {
	WAC.sys.message( shareApi, 'ARRANGE', null, WAC.sys.getUser() );
	pubInfo( 'Arrange' );
}

function pubInfo( op ) {
	info( WAC.sys.getUser() + ' did ' + op );
//	WAC.sys.publishEvent( JSON.stringify( { events: 'sticky', name: 'notes arranged',
//	'timestamp' : new Date(), user: WAC.sys.getUser() } ) );
}

function drag_start(event) {
	var style = window.getComputedStyle(event.target, null);
	var str = (parseInt(style.getPropertyValue("left")) - event.clientX) + ','
		+ (parseInt(style.getPropertyValue("top")) - event.clientY)+ ',' + event.target.id;
	event.dataTransfer.setData("Text",str);
}

function drop(event) {
	var offset = event.dataTransfer.getData("Text").split(',');
	var dm = document.getElementById(offset[2]);
	dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px';
	dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px';
	event.preventDefault();
	pubChange( dm );
	return false;
}

function drag_over(event) {
	event.preventDefault();
	return false;
}

function moveNoteToTopZ(note_id) {
	var elt = document.getElementById( note_id );
	var notes = board.getElementsByClassName( 'note' );

	for(var i = 0; i < notes.length; i++) {
		if((notes[i].id != note_id) && (Number(notes[i].style.zIndex) > Number(elt.style.zIndex))) {
			notes[i].style.zIndex--;
			notes[i].childNodes[ 0 ].childNodes[ 0 ].innerHTML = notes[i].childNodes[ 0 ].creator + "  #" + notes[i].style.zIndex;
		}
	}
	elt.style.zIndex = notes.length;
	elt.childNodes[ 0 ].childNodes[ 0 ].innerHTML = elt.childNodes[ 0 ].creator + "  #" + elt.style.zIndex;
}

function raise( evt ) {
	var elt = document.getElementById( evt.currentTarget.id );

	// firing on delete for some reason
	if ( elt != null ) {
		moveNoteToTopZ(evt.currentTarget.id);
		//elt.style.zIndex++;
		pubMoveNoteToTopZ( evt.currentTarget.id );
	}
}

function removeNote( evt ) {
	// get button, title, note
	var elt = evt.currentTarget.parentNode.parentNode;
	if ( elt.childNodes[ 0 ].creator === WAC.sys.getUser() ) {
		pubDelete( evt.currentTarget.parentNode.parentNode.id );
		elt.parentNode.removeChild( elt );
		resetNotesIndexesButKeepOrder();
	} else {
		pubInfo( ' DELETE denied (not note owner).')
	}
}

function clear( who ) {
	var board = document.getElementById( 'board' )
		,notes = board.getElementsByClassName( 'note' )
		,len = notes.length - 1;
	// if no who, it was me initiating clear so delete mine
	if ( typeof who === 'undefined' ) {
		who = WAC.sys.getUser();
	}
	for( var i = len; i >= 0; i-- ) {
		if ( notes[ i ].childNodes[ 0 ].creator === who ) {
			board.removeChild( notes[ i ] );
		}
	}

	resetNotesIndexesButKeepOrder();
}

function resetNotesIndexesButKeepOrder() {
	//now we need to reset zIndices of these notes to be from 1 to notes.length while keeping their z-order.
	var notes = board.getElementsByClassName( 'note' );
	var sorted_notes = [];

	for( var i = 0; i < notes.length-1; i++) {
		for(var j = 1; j < notes.length; j++) {
			if(Number(notes[i].style.zIndex) > Number(notes[j].style.zIndex)) {
			   tmp = notes[i];
			   notes[i] = notes[j];
			   notes[j] = tmp;
			}
		}
	}
	for( var i = 0; i < notes.length; i++) {
		notes[i].style.zIndex = i+1;
		notes[i].childNodes[ 0 ].childNodes[ 0 ].innerHTML = notes[i].childNodes[ 0 ].creator + "  #" + notes[i].style.zIndex;
	}
}

function arrange( who ) {
	var board = document.getElementById( 'board' )
		,notes = board.getElementsByClassName( 'note' )
		,len = notes.length - 1
		,names = [who]
		,zInd = 1
		,top = 10
		,left = 10
		,bottom = 10
		,found = false
		,notesLen = notes.length
		,namesLen = names.length;

	for( var i = 0; i < notesLen; i++) {
		for(var j = 0; !found && j < namesLen; j++) {
			if ( names[j] === notes[i].childNodes[ 0 ].creator) {
				found = true;
				break;
			}
		}

		if(!found) {
			names[namesLen] = notes[i].childNodes[ 0 ].creator;
		}
	}

	for(var j = 0; j < namesLen; j++) {
		for( var i = 0; i < notesLen; i++) {
			if(names[j] === notes[i].childNodes[ 0 ].creator) {
				notes[i].style.top = top;
				notes[i].style.left = left;
				notes[i].style.zIndex= zInd;
				top += 20;
				left += 20;
				zInd += 1;
				if(top + notes[i].clientHeight > bottom) {
					bottom = top + notes[i].clientHeight;
				}

				notes[i].childNodes[ 0 ].childNodes[ 0 ].innerHTML = notes[i].childNodes[ 0 ].creator + "  #" + notes[i].style.zIndex;
			}
		}
		left = 10;
		top = bottom + 10;
	}
}

function textChange( evt ) {
	pubChange( evt.currentTarget.parentNode );
}

/*
 * Chrome won't sent the mousedowns, just mouse ups while firefox sends both
 *
 * The first just 'click in, no size change'
 * will fire a spurious change size, but subsequent ineffectual clicks will not
 */
function doResize( e ) {
	if ( h !== e.currentTarget.style.height || w !== e.currentTarget.style.width ) {
		pubChange( this.parentNode );
	}

	h = e.currentTarget.style.height;
	w = e.currentTarget.style.width;
}

function doKey( e ) {
	switch( e.keyCode ) {
		case 13:
			pubChange( e.currentTarget.parentNode );
			return false;
	}
	return true;
}

function _addNote() {
	var note = addNote( noteId, WAC.sys.getUser() /*default left, top from styles*/ );
	note.children[1].focus();
	return note;
}

function info( text ) {
	var f = document.getElementById( 'info' );
	f.innerHTML = text + ' (' +  document.getElementsByClassName( 'note' ).length + ' total notes)';
}

function addNote( id, owner, left, top, width, height, data ) {
	// update global counter
	noteId = id;

	var note = document.createElement( 'div' );
	note.setAttribute( 'class', 'note' );
	note.addEventListener( 'click', function(e) { raise( e ); e.stopPropagation(); } );
	note.setAttribute( 'draggable', true );
	note.setAttribute( 'id', noteId++ );
	note.addEventListener( 'dragstart', function(e) {drag_start(e); e.stopPropagation();} );
	if ( typeof left !== 'undefined' && typeof left !== null && typeof top !== 'undefined' && top !== null ) {
		note.style.left = left;
		note.style.top = top;
	}

	var notes = board.getElementsByClassName( 'note' );

	note.style.zIndex = notes.length+1;

	var title = document.createElement( 'div' );
	title.setAttribute( 'class', 'title' );
	title.innerHTML = owner + "  #" + note.style.zIndex;
	title.creator = owner;
	note.appendChild( title );

	var ctrl = document.createElement( 'button' );
	ctrl.setAttribute( 'class', 'closeBtn' );
	ctrl.addEventListener( 'click', function( e ) { removeNote( e ); e.stopPropagation(); } );
	ctrl.innerHTML = 'X';
	title.appendChild( ctrl );

	var text = document.createElement( 'textarea' );
	text.setAttribute( 'class', 'text' );

	if ( typeof width !== 'undefined' && typeof width !== null && typeof height !== 'undefined' && height !== null ) {
		text.style.width = width;
		text.style.height = height;

	} else {
		text.style.width = minWidth;
		text.style.height = minHeight;
	}

	text.addEventListener( 'change', textChange );
	text.addEventListener( 'mouseup', doResize );
	// also publish at enter key
	text.addEventListener( 'keypress', doKey );
	// double click selects all
	text.addEventListener( 'dblclick', function( e ) {this.select();} );

	// We are building with existing static data instead of new note
	if ( typeof data !== 'undefined' ) {
		text.innerHTML = data;
	}

	note.appendChild( text );

	document.getElementById( 'board' ).appendChild( note );

	return note;
}

function doAdd( e ) {
	var n = _addNote( );
	if ( typeof e !== 'undefined' ) {
		n.style.top = e.layerY;
		n.style.left = e.layerX;
	}
	pubAdd( n );
}

function describeNote( note ) {
	var json = {
			id: note.id,
			left: note.style.left,
			top: note.style.top,
			width: note.children[1].style.width,
			height: note.children[1].style.height,
			content: note.children[1].value,
			creator: note.children[0].creator,
			zIndex: note.style.zIndex
	};

	return json;
}

function editNote( note ) {
	var toEdit = document.getElementById( note.id );
	toEdit.style.left = note.left;
	toEdit.style.top = note.top;
	toEdit.style.zIndex = note.zIndex;
	toEdit.children[1].style.width = note.width;
	toEdit.children[1].style.height = note.height;
	toEdit.children[1].value = note.content;
}

function getState( ) {
	var notesJson=[];
	var elts = document.getElementsByClassName( 'note' );

	for( var i = 0; i < elts.length; i++ ){
		notesJson[ i ] = describeNote( elts[ i ] );
	}

	return JSON.stringify( notesJson );
}

function handleError( e ) {
	console.log( JSON.stringify( e ) );
}

function processMessage( e ) {

	if ( typeof e !== 'object' ) {
		e = JSON.parse( e );
	}
	if ( typeof e.op === 'undefined' ) {
		throw 'Programming error: op code required';
	}

	switch( e.op ) {
		case 'ARRANGE':
			arrange( e.who );
			break;
		case 'MOVENOTETOTOPZ':
			moveNoteToTopZ( e.data );
			break;
		case 'CHANGE':
			editNote( e.data );
			break;
		case 'DELETE':
			var note = document.getElementById( e.data );
			note.parentNode.removeChild( note );
			resetNotesIndexesButKeepOrder();
			break;
		case 'ADD':
			addNote( e.data.id, e.data.creator, e.data.left, e.data.top );
			break;
		case 'CLEAR':
			if ( typeof e.who !== 'undefined' ) {
				clear( e.who );
			} else {
				clear();
			}
			resetNotesIndexesButKeepOrder();

			break;
	}
	info( e.who + ' did ' + e.op );
}

function handleMessageState( arg ) {
	var data = JSON.parse( arg );
	for( var i = 0; i < data.length; i++ ) {
		processMessage( data[ i ] );
	}
}

function handleStaticState( arg ) {
	arg = JSON.parse( arg );
	if ( arg !== null ) {
		for( var i = 0, len = arg.length, e; e = arg[ i ]; i++ ) {
			addNote( e.id, e.creator, e.left, e.top, e.width, e.height, e.content );
		}
	}
}

function syncData( ) {
	WAC.wst.getCombo(
			// in this case we have arg.{op, data:{}}
			function( arg ) {
				arg = JSON.parse( arg );
				handleStaticState( arg.data );
			}
			, handleMessageState );
}

function removeNotes() {
	clear( WAC.sys.getUser() );
	pubClear();
	WAC.wst.clear();
	document.getElementById( 'confirmModal' ).style.display = 'none';
}

function refresh() {
	location.reload();
}

function completeInit() {
	SlideInMenu.build();

	SlideInMenu.setButtons( [
//	        {
//	        label: 'Add Note',
//			callback: function(e) {doAdd();},
//			icon: '/wac-w1/shr/mnu/img/glyphicons_150_edit.png' },
	        { label: 'Stack My Notes',
				callback: function() { arrange( WAC.sys.getUser() ); pubArrange(); },
				icon: '/wac-w1/shr/mnu/img/glyphicons_320_sort.png' }
			,{ label: 'Remove ALL My Notes',
			callback: function() {document.getElementById( 'confirmModal' ).style.display = 'block';},
			icon: '/wac-w1/shr/mnu/img/glyphicons_067_cleaning.png' }
			,{label: 'Reset', icon: '/wac-w1/shr/mnu/img/glyphicons_081_refresh.png', callback: refresh}
	]);

	shareApi = WSApi( {
		'service' : 'message',
		'target' : WAC.sys.getAppId(),
		'jwt' : WAC.sys.getJWT(),
		'messageHandler' : processMessage,
		'errorHandler' : handleError
	});

	document.getElementById( 'board' ).addEventListener('click', doAdd);
	info( 'No messages' );
}

// gain exclusive control over the board
function take() {
    var d = document.getElementById("covering_div");
    d.style.display = 'none';

}

// release control
function release() {
    var d = document.getElementById("covering_div");
    d.style.display = 'block';
}

// TODO -
// do we want to integrate session storage into refresh/restore/replay?

function eventReceiver( e ) {
	var o = JSON.parse( e );
	switch( o.op ) {
		case WAC.sys.STATESAVE:
			WAC.wst.update( o.data, WAC.sys.getAppId(), '*', getState() );
//			WAC.usercontrolpanel.saveyourself( o.data );
			break;
		case WAC.sys.STATESET:
			// TODO make sure that the collab messages/mutators are cleared too
			clear();

			// just ignore the snapshot id (o.data) since it has been loaded into head by the originator
			WAC.wst.getAppHead( handleStaticState );
			break;
	}
}

WAC.sys.WACInit( function() {
	WAC.sys.initApp( 'sticky', '*',
			function() {
				WAC.sys.initSubApp( 'usercontrolpanel', 'sticky',
						function( appId ) {
							WAC.usercontrolpanel.init(appId, 'sticky', take,  release);
						}
					);
				completeInit() ;
				syncData();
				// force control to be taken to write
				release();
} ); }, null, eventReceiver );


