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

var     app = {};
const ADDED=true;
const DELETED=true;

function init() {
	app.chat_box_container = document.getElementById("chat_box_container");
	app.chat_data_container = document.getElementById("chat_data_container");
    app.message_box_text = document.getElementById("message_box_text");
    app.list_of_users =  document.getElementById("list_of_users");
    app.msg_id = 0;
    // this is needed to track the number of times each user is logged in, since each app is a separate connection
    // regardless of user name, so we can eliminate redundancy in the display
    app.userCnts = {}; // {username1: count, username2: count}

	app.wsApi = WSApi( {
		'service' : 'chatService',
		'target' : WAC.sys.getAppId(),
		'jwt' : WAC.sys.getJWT(),
		'messageHandler' : receiveData,
		'errorHandler' : null,
		// need to publish my existance upon open
		'callback': function( e ) {
			var cmd = {};
			cmd.name = 'register'
			cmd.username = WAC.sys.getUser();
			cmd.data = "";
			app.wsApi.publish( cmd );
		}
	} );

	addUserName( WAC.sys.getUser() );
	syncData();
}


function processKeyPress(myfield,e)
{
	var keycode;
	if (window.event) keycode = window.event.keyCode;
	else if (e) keycode = e.which;
	else return true;
	if (keycode == 13)
	{
	   sendData();
	   return false;
	}
	else
	   return true;
}
function clear()
{
    app.message_box_text.value = "";
    var cont = document.getElementById( 'chat_data_container' );
    while ( cont.firstChild ) {
    	cont.removeChild( cont.firstChild );
    }
}

/* the design of the chat backend is such that each app instance, even of the
 * same user name, has a separate session.  this results in redundancy in the user
 * list if the user has multiple chat apps (e.g. multiple desktops with chat app
 * in each).  rather than try to really 'fix' this, hack it into submission by
 * just eliminating redundancy in the display
 */

// increment count of or add user to our userCnts
function incOrAdd( user ) {
	var keys = Object.keys( app.userCnts );
	var i = keys.length;
	while( i-- ) {
		if ( keys[ i ] === user ) {
			app.userCnts[ user ] += 1;
			return ! ADDED;
		}
	}
	// didn't find and increment, so add
	app.userCnts[ user ] = 1;
	return ADDED;
}

// decrement count of or remove (if 0) from userCnts
function decOrDel( user ) {
	var keys = Object.keys( app.userCnts );
	var i = keys.length;
	while( i-- ) {
		if ( keys[ i ] === user ) {
			app.userCnts[ user ] -= 1;
			if ( app.userCnts === 0 ) {
				delete app.userCnts[ user ];
				return DELETED;
			}
			return ! DELETED;
		}
	}
}

function addUserName(str)
{
	if ( incOrAdd( str ) === ADDED ) {
		app.list_of_users.appendChild(document.createTextNode(str));
		app.list_of_users.appendChild(document.createElement("br"));
		app.list_of_users.scrollTop = app.list_of_users.scrollHeight;
	}
	// else, already there so do nothing else as we incremented as side effect
}
function removeUserName(str)
{
	if ( decOrDel( str ) === DELETED ) {
		var iterator = app.list_of_users.childNodes;
		var ind = 0;
		for(ind=0; ind < iterator.length; ind++)
		{
			var child = iterator[ind];
			if(child.data === str)
			{
				app.list_of_users.removeChild(child);
				app.list_of_users.removeChild(iterator[ind]);
			}
		}
	}
	// else, do nothing as we decremented the user
 }
function addText(user_name, str)
{
    var div1 = document.createElement("div");
    div1.appendChild(document.createTextNode(str));
    var div2 = document.createElement("div");
    div2.appendChild(document.createTextNode(user_name));
    if(app.msg_id === 0)
    {
        div1.setAttribute("class", "chat-box-left");
        div2.setAttribute("class", "chat-box-name-left");
        app.msg_id=1;
    }
    else if(app.msg_id === 1)
    {
        div1.setAttribute("class", "chat-box-right");
        div2.setAttribute("class", "chat-box-name-right");
        app.msg_id=0;
    }
    app.chat_data_container.appendChild(div1);
    app.chat_data_container.appendChild(div2);
    app.chat_box_container.scrollTop = app.chat_box_container.scrollHeight;
 }
function sendData()
{
	if(app.message_box_text.value.trim() === '') {
		return;
	}

	var cmd = {};
	cmd.name = 'setmessage';
	cmd.data = app.message_box_text.value;
	cmd.username=WAC.sys.getUser();

    addText(cmd.username, cmd.data);
    app.message_box_text.value = '';
    app.wsApi.publish(JSON.stringify(cmd));
}

// ignore everthing except for chat messages (for initialization only)
function recieveTalkOnly( str ) {
	var cmd = JSON.parse(str);

	if(cmd.name === "setmessage")
   	{
   		addText(cmd.username, cmd.data);
   	}
	// else, ignore
}

function receiveData(str)
{
	var cmd = JSON.parse(str);

	if(cmd.name === "register")
	{
		if(cmd.username instanceof Array)
		{
			var i = 0;
			for(i = 0; i < cmd.username.length; i++)
			{
				addUserName(cmd.username[i]);
			}
		}
		else
		{
			addUserName(cmd.username);
		}
	}
	else if(cmd.name === "unregister")
   	{
		removeUserName(cmd.username);
   	}
	else if(cmd.name === "setmessage")
   	{
   		addText(cmd.username, cmd.data);
   	}
}

function handleStaticState( data ) {
	var key;
	data = JSON.parse( data );
	if ( data !== null ) {
		for( var i = 0, len = data.length, e; e = data[ i ]; i++ ) {
			key = Object.keys(e)[0];
	   		addText( key, e[ key ] );
		}
	}
}

function handleMessageState( data ) {
	data = JSON.parse( data );
	for( var i = 0; i < data.length; i++ ) {
		recieveTalkOnly( data[ i ] );
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

function eventReceiver( e ) {
	var o = JSON.parse( e );
	switch( o.op ) {
		case WAC.sys.STATESAVE:
			WAC.wst.update( o.data, WAC.sys.getAppId(), '*', getState() );
			break;
		case WAC.sys.STATESET:
			clear();
			// since this is a snapshot, it should only have static state (no messages at this point, unless it has
			// been mutated since storing)
			WAC.wst.getAppHead( handleStaticState );
			break;
	}
}

/*
[{user:message}, ...]
 */
function getState() {
	var state = [];
	var cit = app.chat_data_container.childNodes;
	for( var i = 0; i < cit.length; ) {
		var o = {};
		o[ cit[ (i+1) ].innerText ] = cit[ i ].innerText
		state.push( o );
		i+=2;
	}
	return JSON.stringify( state );
}

function refresh() {
	location.reload();
}

function part1init() {
	WAC.sys.initApp( 'chat', '*', init );
	SlideInMenu.build();
	SlideInMenu.setButtons( [{label: 'Reset', icon: '/wac-w1/shr/mnu/img/glyphicons_081_refresh.png', callback: refresh}]);
}

WAC.sys.WACInit( part1init, null, eventReceiver );
