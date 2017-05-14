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

/*
 * The ClickEventListener should have three arguments
 */

function CustomContextMenu(Arguments) {
    this.Version = '2.1';
	this.xLeft = 0;
    this.yTop = 0;

	var Base = Arguments.Base ? Arguments.Base : document.documentElement;
	var Width = Arguments.Width ? Arguments.Width : 100;
	var FontColor = Arguments.FontColor ? Arguments.FontColor : 'black';
	var HoverFontColor = Arguments.HoverFontColor ? Arguments.HoverFontColor : 'white';
	var HoverBackgroundColor = Arguments.HoverBackgroundColor ? Arguments.HoverBackgroundColor : '#008080';
	var ClickEventListener = Arguments.ClickEventListener ? Arguments.ClickEventListener : function( row, obj, base ){ return false; };

    var ContextMenuDiv = document.createElement('div');
    var ContextMenuTable = document.createElement('table');
    var Index = 0;
    var EventHandlers = new Array();

	//Style Context Menu div.
    ContextMenuDiv.id = Arguments.id ? Arguments.id : 'ContextMenu';
    ContextMenuDiv.style.position = 'absolute';
    ContextMenuDiv.style.backgroundColor = 'white';
    //ContextMenuDiv.style.border = '1px outset white';

    ContextMenuDiv.style.boxShadow = '0px 0px 4px #005050, 0px 4px 8px #005050';

    ContextMenuDiv.style.textAlign = 'left';
	ContextMenuDiv.style.visibility = 'hidden';
	ContextMenuDiv.style.width = (Width + 11) + 'px';

	//Styles Context Menu table.
	ContextMenuTable.id = 'ContextMenuTable';
	ContextMenuTable.style.width = (Width + 10) + 'px';
	ContextMenuTable.border = 0;
	ContextMenuTable.cellPadding = 0;
	ContextMenuTable.cellSpacing = 0;

	//Append Context Menu table into Context Menu div.
	ContextMenuDiv.appendChild(ContextMenuTable);

	//Public method for adding Context Menu Items.

	// imgSrc - item icon
	// itemText - item text label
	// isDisabled - is the menu item disabled
	// commandName - string or function handed to the global click handler
	// myHandler - if defined then function used to handle clicks instead of the global handler passed in menu constructor
	//             NOTE that myHandler should be defined with three arguments (row, object, base)

	this.AddItem = function(imgSrc, itemText, isDisabled, commandName, myHandler ) {
        var Img = new Image();
		var Tr = ContextMenuTable.insertRow(Index++);
	    Tr.style.backgroundColor = 'white';
	    Tr.style.color = isDisabled ? 'gray' : FontColor;
	    Tr.style.cursor = 'default';

	    var TdLeft = Tr.insertCell(0);
	    TdLeft.style.width = '25px';
	    TdLeft.style.height = '25px';
	    TdLeft.style.textAlign = 'center';
	    TdLeft.style.verticalAlign = 'middle';
	    TdLeft.style.backgroundColor = 'rgba(00,80,80,0.2)';

//	    var TdCenter = Tr.insertCell(1);
//	    TdCenter.style.width = 10 + 'px';
//	    TdCenter.style.height = 25 + 'px';
//	    TdCenter.innerHTML = '&nbsp;';
//	    TdCenter.style.borderTop = '2px solid white';
//	    TdCenter.style.borderBottom = '2px solid white';

	    var TdRight = Tr.insertCell(1);
	    TdRight.style.width = (Width - 25) + 'px';
	    TdRight.style.height = '25px';
	    TdRight.style.padding = '2px';
	    TdRight.style.fontStyle = isDisabled ? 'italic' : 'normal';
	    TdRight.innerHTML = itemText ? itemText : '&nbsp;';


		if(imgSrc) {
	        Img.id = 'Img';
	        Img.src = imgSrc;
	        Img.style.width = '16px';
	        Img.style.height = '16px';
	        Img.disabled = isDisabled;

	        TdLeft.appendChild(Img);
	    } else {
	        TdLeft.innerHTML = '&nbsp;';
	    }

	    //Register events.
	    if(!isDisabled) {
	    	// support handler per menu item
	    	if ( typeof myHandler === 'function' ) {
				WireUpEventHandler(Tr, 'click', function() {
					myHandler(Tr, {CommandName: commandName, Text: itemText, IsDisabled: isDisabled, ImageUrl: Img ? Img.src : ''}, Base);
				});
	    	} else {
				WireUpEventHandler(Tr, 'click', function() {
					ClickEventListener(Tr, {CommandName: commandName, Text: itemText, IsDisabled: isDisabled, ImageUrl: Img ? Img.src : ''}, Base);
				});
	    	}

			WireUpEventHandler(Tr, 'mouseover', function(){ MouseOver(Tr, TdLeft, TdRight); });
	        WireUpEventHandler(Tr, 'mouseout', function(){ MouseOut(Tr, TdLeft, TdRight); });

	    } else {
			WireUpEventHandler(Tr, 'click', function(){ return false; });
	        WireUpEventHandler(TdRight, 'selectstart', function(){ return false; });
	    }
	};

	//Public method for adding Separator Menu Items.
	this.AddSeparatorItem = function() {
	    var Tr = ContextMenuTable.insertRow(Index++);
	    Tr.style.cursor = 'default';

	    var TdLeft = Tr.insertCell(0);
	    TdLeft.style.width = '25px';
	    TdLeft.style.height = '1px';
	    TdLeft.style.backgroundColor = 'rgba(00,80,80,0.2)';

//	    var TdCenter = Tr.insertCell(1);
//	    TdCenter.style.width = 10 + 'px';
//	    TdCenter.style.height = '3px';
//	    TdCenter.style.backgroundColor = 'white';

	    var TdRight = Tr.insertCell(1);
	    TdRight.style.width = (Width - 25) + 'px';
	    TdRight.style.height = '1px';
	    TdRight.style.backgroundColor = 'gray';
	};

	this.AddInputItem = function() {
	    var Tr = ContextMenuTable.insertRow(Index++);
	    Tr.style.cursor = 'default';

	    var TdLeft = Tr.insertCell(0);
	    TdLeft.style.width = '25px';
	    TdLeft.style.height = '1px';
	    TdLeft.style.backgroundColor = 'rgba(00,80,80,0.2)';

//	    var TdCenter = Tr.insertCell(1);
//	    TdCenter.style.width = 10 + 'px';
//	    TdCenter.style.height = '1px';
//	    TdCenter.style.backgroundColor = 'white';

	    var TdRight = Tr.insertCell(1);
	    TdRight.style.width = (Width - 25) + 'px';
	    TdRight.style.height = '1px';
	    TdRight.style.backgroundColor = 'gray';

	    var i = document.createElement( 'input' );
	    i.setAttribute( 'type', 'text' );
	    i.setAttribute( 'style','width:100%;')

	    TdRight.appendChild( i );
	};

	//Public method for displaying Context Menu.
	this.Display = function(e) {
	    e = e ? e : window.event;

	    this.xLeft = e.clientX;
		if(this.xLeft + ContextMenuDiv.offsetWidth > window.innerWidth) {
			this.xLeft = window.innerWidth - ContextMenuDiv.offsetWidth;
		}

		this.yTop = e.clientY;
		if(this.yTop + ContextMenuDiv.offsetHeight > window.innerHeight) {
			this.yTop = window.innerHeight - ContextMenuDiv.offsetHeight;
		}

	    ContextMenuDiv.style.visibility = 'hidden';
	    ContextMenuDiv.style.left = this.xLeft + 'px';
        ContextMenuDiv.style.top = this.yTop + 'px';
        ContextMenuDiv.style.visibility = 'visible';

        return false;
	};

	//Public method to hide context Menu.
	this.Hide = function() {
		ContextMenuDiv.style.visibility='hidden';
	};

	//Public method Dispose.
	this.Dispose = function() {
	    while(EventHandlers.length > 0) {
	        DetachEventHandler(EventHandlers.pop());
	    }
	    document.body.removeChild(ContextMenuDiv);
	};

	//Public method GetTotalItems.
	this.GetTotalItems = function() {
	    return ContextMenuTable.getElementsByTagName('tr').length;
	};

	//Mouseover event handler
	var MouseOver = function(Tr, TdLeft, TdRight) {
	     Tr.style.color = HoverFontColor;
	     Tr.style.backgroundColor = HoverBackgroundColor;
	};

	//Mouseout event handler
	var MouseOut = function(Tr, TdLeft, TdRight) {
	     Tr.style.color = FontColor;
	     Tr.style.backgroundColor = 'white';
	};

	//Private method to wire up event handlers.
	var WireUpEventHandler = function(Target, Event, Listener) {
	    //Register event.
	    if(Target.addEventListener) {
			Target.addEventListener(Event, Listener, false);
	    } else if(Target.attachEvent) {
			Target.attachEvent('on' + Event, Listener);
	    } else {
			Event = 'on' + Event;
			Target.Event = Listener;
		}

	    //Collect event information through object literal.
	    var EVENT = { Target: Target, Event: Event, Listener: Listener };
	    EventHandlers.push(EVENT);
	};

	//Private method to detach event handlers.
	var DetachEventHandler = function(EVENT)
	{
	    if(EVENT.Target.removeEventListener) {
			EVENT.Target.removeEventListener(EVENT.Event, EVENT.Listener, false);
	    } else if(EVENT.Target.detachEvent) {
	        EVENT.Target.detachEvent('on' + EVENT.Event, EVENT.Listener);
	    } else {
			EVENT.Event = 'on' + EVENT.Event;
			EVENT.Target.EVENT.Event = null;
	    }
	};

	//Add Context Menu div on the document.
	document.body.appendChild(ContextMenuDiv);

	//Register events.
	WireUpEventHandler(Base, 'click', this.Hide);
	WireUpEventHandler(ContextMenuDiv, 'contextmenu', function(){ return false; });
};