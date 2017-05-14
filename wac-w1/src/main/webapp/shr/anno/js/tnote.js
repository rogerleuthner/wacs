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

(function(global) {
	const TEXT_DEFAULT = '(edit with double click)';
  'use strict';

  var WAC = global.WAC || (global.WAC = { });
  WAC.anno = WAC.anno || { };

    if (WAC.anno.wacNote)
    {
        console.warn('WAC.anno.wacNote is already defined');
        return;
    }

    WAC.anno.createText = function(wac_cnv, x, y)
    {
    	var new_obj = new WAC.anno.wacNote(wac_cnv.getUniqueObjectID(), wac_cnv.ctx, TEXT_DEFAULT, x, y);
    	if((x === null) || (y === null))
    	{
    		wac_cnv._Object.setNewObject(new_obj);
    		wac_cnv.canvas.style.cursor = 'crosshair';
    	}
    	else
		{
    		wac_cnv._Object.add(new_obj);
		}
    	wac_cnv.sendCommand(new WAC.anno.wacCmd_NewText(wac_cnv._Object.getID(), x, y));
    };

    WAC.anno.wacNote = WAC.anno.wacGObject.extend({
        constructor: function(id, ctx, txt, x, y)
        {
            this.base(id, ctx);
            this._type = "WAC.anno.wacNote";
            this._X = x;
            this._Y = y;
            this._alignment = "left";
            this._hasBorder = false;
            this._transparent = true;
            this._lineColor = "#000000";
            this._textColor = "#000000";
            this._fillColor = "#FFFFFF";
            this.lines={};
            this.margin_top    = 3;
            this.margin_bottom = 3;
            this.margin_left   = 3;
            this.margin_right  = 3;

            this.isItalic = false;
            this.isBold = true;
            this.fontSize = 14;
            this.fontFamily = "sans-serif";
            this.fontHeightCoeff = 1.0;
            this.setText(txt);

            if(ctx)
            	this.initMenus();
        },

        getObjectData: function()
        {
        	var objectData = this.base();
        	objectData.x=this._X;
        	objectData.y=this._Y;
        	objectData.w=this._W;
        	objectData.h=this._H;
        	objectData.alignment=this._alignment;
        	objectData.hasBorder = this._hasBorder;
        	objectData.transparent = this._transparent;
        	objectData.textColor = this._textColor;
        	objectData.lines=this.lines;
        	objectData.txt=this.txt;
        	objectData.font={};
        	objectData.font.isItalic=this.isItalic;
        	objectData.font.isBold=this.isBold;
        	objectData.font.fontSize=this.fontSize;
        	objectData.font.fontFamily=this.fontFamily;

        	return objectData;
        },

        restoreFromData: function(objectData)
        {
        	this.base(objectData);
        	this._X = objectData.x;
        	this._Y = objectData.y;
        	this._W = objectData.w;
        	this._H = objectData.h;
        	this._alignment = objectData.alignment;
        	this._hasBorder = objectData.hasBorder;
        	this._transparent = objectData.transparent;
        	this._textColor = objectData.textColor;
        	this.lines = objectData.lines;
        	this.txt = objectData.txt;
        	this.isItalic = objectData.font.isItalic;
        	this.isBold = objectData.font.isBold;
        	this.fontSize = objectData.font.fontSize;
        	this.fontFamily = objectData.font.fontFamily;
        },

        initMenus: function()
        {
    		var wac_cnv = WAC.anno.wacUtil.get_wacCanvas(this);
    		if(wac_cnv.menus[this._type] === undefined)
    		{
                var Arguments = {id: "tNoteMenu", Base: wac_cnv, Width: 100, ClickEventListener: this.OnMenuItemSelect};
                wac_cnv.menus[this._type] = new CustomContextMenu(Arguments);
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/edit16.png', 'Edit', false, this._type+'.edit');
	            wac_cnv.menus[this._type].AddItem(null, 'Font ... ', false, this._type+'.font');
	            wac_cnv.menus[this._type].AddSeparatorItem();
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Text Color', false, this._type+'.textColor');
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Border Color', false, this._type+'.borderColor');
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Fill Color', false, this._type+'.fillColor');
	            wac_cnv.menus[this._type].AddSeparatorItem();
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/linewidth16.png', 'Line Width', false, this._type+'.changeLineWidth');
	            wac_cnv.menus[this._type].AddSeparatorItem();
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/alignleft16.png', 'Align Left', false, this._type+'.alignLeft');
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/aligncenter16.png', 'Align Center', false, this._type+'.alignCenter');
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/alignright16.png', 'Align Right', false, this._type+'.alignRight');
	            wac_cnv.menus[this._type].AddSeparatorItem();
	            wac_cnv.menus[this._type].AddItem(null, 'Border Toggle', false, this._type+'.border');
	            wac_cnv.menus[this._type].AddItem(null, 'Transparent Toggle', false, this._type+'.transparent');
	            wac_cnv.menus[this._type].AddSeparatorItem();
	            wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/delete16.png', 'Delete', false, this._type+'.delete');
    		}
        },

        init: function(evt, x, y)
        {
        	this._X = x-10;
        	this._Y = y-10;
        	this.setText( TEXT_DEFAULT );
            this.sendCommand(new WAC.anno.wacCmd_NoteInit(this.getID(), x, y));
        },
        OnMenuItemSelect: function(Sender, EventArgs, Base)
        {
        	var cmd_name = EventArgs.CommandName;
        	var menu_name = cmd_name.substr(0, cmd_name.lastIndexOf("."));
        	var menu_x = Base.menus[menu_name].xLeft;
        	var menu_y = Base.menus[menu_name].yTop;
        	var sfx = Base._scaleFactorX;
        	var sfy = Base._scaleFactorY;
        	Base.hideMenus();
            switch(EventArgs.CommandName)
            {
                case 'WAC.anno.wacNote.edit':
                	WAC.anno.dialogs.displayEditTextDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject.txt);
                    break;

                case 'WAC.anno.wacNote.font':
                	WAC.anno.dialogs.displayEditFontDialog(Base._Object._GUIObject);
                    break;

                case 'WAC.anno.wacNote.textColor':
                	WAC.anno.dialogs.displayEditColorDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._textColor, "_textColor");
                    break;
                case 'WAC.anno.wacNote.borderColor':
                    WAC.anno.dialogs.displayEditColorDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineColor, "_lineColor");
                    break;

                case 'WAC.anno.wacNote.fillColor':
                    WAC.anno.dialogs.displayEditColorDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._fillColor, "_fillColor");
                    break;

                case 'WAC.anno.wacNote.changeLineWidth':
                    WAC.anno.dialogs.displayEditLineWidthDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineWidth);
                    break;

                case 'WAC.anno.wacNote.alignLeft':
                    Base._Object._GUIObject._alignment = 'left';

                    var cmd = new WAC.anno.wacCmd_SetTextAlignment(Base._Object._GUIObject.getID(),
                                                          Base._Object._GUIObject._alignment);
                    Base.sendCommand(cmd);
                    break;

                case 'WAC.anno.wacNote.alignCenter':
                    Base._Object._GUIObject._alignment = 'center';

                    var cmd = new WAC.anno.wacCmd_SetTextAlignment(Base._Object._GUIObject.getID(),
                                                          Base._Object._GUIObject._alignment);
                    Base.sendCommand(cmd);
                    break;

                case 'WAC.anno.wacNote.alignRight':
                    Base._Object._GUIObject._alignment = 'right';

                    var cmd = new WAC.anno.wacCmd_SetTextAlignment(Base._Object._GUIObject.getID(),
                                                          Base._Object._GUIObject._alignment);
                    Base.sendCommand(cmd);
                    break;

                case 'WAC.anno.wacNote.border':
                    Base._Object._GUIObject._hasBorder = !Base._Object._GUIObject._hasBorder;

                    var cmd = new WAC.anno.wacCmd_SetTextBorder(Base._Object._GUIObject.getID(),
                                                       Base._Object._GUIObject._hasBorder);
                    Base.sendCommand(cmd);
                    break;

                case 'WAC.anno.wacNote.transparent':
                    Base._Object._GUIObject._transparent = !Base._Object._GUIObject._transparent;

                    var cmd = new WAC.anno.wacCmd_SetTransparent(Base._Object._GUIObject.getID(),
                                                        Base._Object._GUIObject._transparent);
                    Base.sendCommand(cmd);
                    break;

                case 'WAC.anno.wacNote.delete':
                    var cmd = new WAC.anno.wacCmd_RemoveObject(Base._Object.getID(), Base._Object._GUIObject.getID());
                    Base._Object.remove(Base._Object._GUIObject);
                    Base.sendCommand(cmd);
                    break;
            }
            Base.redraw();
        },

        inside: function(x, y)
        {
        	if((this._X === null) || (this._Y === null) || (this._W === null) || (this._H === null))
        		return false;
            var res = ((this._X <= x) && (this._Y <= y) && (this._X + this._W >= x) && (this._Y+this._H >= y));
            return res;
        },

        setText: function(txt)
        {
            this.txt = txt;
            if(txt === null)
            	this.lines= [];
            else
            	this.lines = txt.split("\n");
            this.computeSize();
        },
        computeSize: function()
        {
        	if(this._ctx === undefined) return;
        	if(this._ctx === null) return;

            this._ctx.font = this.getFontString();
            var w = 0;
            var h = 0;
            for(var i = 0; i < this.lines.length; i++)
            {
                var metrics = this._ctx.measureText(this.lines[i]);
                if(w < metrics.width)
                    w = metrics.width;
                h += metrics.height;
            }
            this._W = w + this.margin_left + this.margin_right;
            this._H = this.fontSize * this.fontHeightCoeff * this.lines.length + this.margin_top + this.margin_bottom;
        },

        remove: function()
        {
        	this._parentObject.remove(this);
        },

        draw: function()
        {
        	if((this._X === null) || (this._Y === null) || (this._W === null) || (this._H === null))
        		return false;

        	this.drawBorder();
            this.fillArea();
            this.drawText();
        },
        drawBorder: function()
        {
            if(this._hasBorder)
            {
                this._ctx.strokeStyle = this._lineColor;
                this._ctx.fillStyle = this._lineColor;
                this._ctx.lineWidth = this._lineWidth;
                this._ctx.beginPath();
                this._ctx.strokeRect(this._X, this._Y, this._W, this._H);
                this._ctx.closePath();
            }
        },
        fillArea: function()
        {
            if(!this._transparent)
            {
                this._ctx.fillStyle = this._fillColor;
                this._ctx.fillRect(this._X, this._Y, this._W, this._H);
            }
        },
        drawText: function()
        {
            this._ctx.font = this.getFontString();
            this._ctx.color = this._textColor;
            this._ctx.beginPath();
            for(var i = 0; i < this.lines.length; i++)
            {
                this._ctx.strokeStyle = this._textColor;
                this._ctx.fillStyle = this._textColor;
                var metrics = this._ctx.measureText(this.lines[i]);
                if(this._alignment === 'left')
                {
                    this._ctx.fillText(this.lines[i], this._X + this.margin_left,
                                       this._Y + (i+1)*this.fontSize * this.fontHeightCoeff );
                    //this._ctx.strokeText(this.lines[i], this._X + this.margin_left,
                    //                     15+this._Y + this.margin_top + i*this.fontSize * this.fontHeightCoeff );
                }
                else if(this._alignment === 'right')
                {
                    this._ctx.fillText(this.lines[i], this._X + this.margin_left + this._W - metrics.width - this.margin_right,
                                       this._Y + (i+1)*this.fontSize * this.fontHeightCoeff );
                    //this._ctx.strokeText(this.lines[i], this._X + this.margin_left + this._W - metrics.width,
                    //                     15+this._Y + this.margin_top + i*this.fontSize * this.fontHeightCoeff );
                }
                else if(this._alignment === 'center')
                {
                    this._ctx.fillText(this.lines[i], this._X + this.margin_left + (this._W - metrics.width)/2 - this.margin_right,
                                       this._Y + (i+1)*this.fontSize * this.fontHeightCoeff );
                    //this._ctx.strokeText(this.lines[i], this._X + this.margin_left + (this._W - metrics.width)/2,
                    //                     15+this._Y + this.margin_top + i*this.fontSize * this.fontHeightCoeff );
                }
            }
            this._ctx.closePath();
        },
        getFontStyle: function()
        {
            return this.isItalic ? 'italic' : 'normal';
        },
        getFontWeight: function()
        {
            return this.isBold ? 'bold' : 'normal';
        },
        setFontSize: function(size)
        {
            this.fontSize = size;
        },
        setFontFamily: function(family)
        {
            this.fontFamily = family;
        },
        getFontString: function()
        {
            var str = this.getFontStyle() + " " + this.getFontWeight() + " " + this.fontSize+"px " + this.fontFamily;
            return str;
        },
        move: function(evt, dx, dy)
        {
            this._X += dx;
            this._Y += dy;
        },
        mouseDoubleClick: function(evt, x, y)
        {
        	//WAC.anno.dialogs.displayEditTextDialog(wac_canvas, this, this.txt);

			var ta,cont,that,myx,myy,cancel,save,wac_canvas;

	    	function cleanup() {
	    		save.removeEventListener( 'click', saveAction );
	    		cancel.removeEventListener( 'click', cancelAction );
	            save.remove();
	            cancel.remove();
	            ta.remove();
	    		ta = save = cancel = null;
	    	}

        	function saveAction() {
	            WAC.anno.wacUtil.setText( that, ta.value );
	            wac_canvas.sendCommand( new WAC.anno.wacCmd_SetText( that.getID(), ta.value ) );
	            cleanup();
                wac_canvas.redraw();
        	}

        	function cancelAction() {
    			cleanup();
                wac_canvas.redraw(); // otherwise need to click on image
        	}

			if ( document.getElementById( 'tnoteEdit' ) === null ) {
	    		cont = document.getElementById( 'canContainer' );
	    		if ( cont === null ) {
	    			alert( 'Can not double click edit, no "canContainer" div found' );
	    			return;
	    		}
				ta = document.createElement('textarea');
	    		that = this;
	    		myx = evt.clientX-30;
	    		myy = evt.clientY-20;
	    		cancel = document.createElement('button');
	        	save = document.createElement('button');
	        	wac_canvas = this._ctx.canvas.self;

	        	ta.id = 'tnoteEdit';
	        	ta.style.width=(this._W+40) + 'px';
	        	ta.style.height=(this._H+20) + 'px';
	        	ta.style.left =  myx + 'px';
	        	ta.style.top = myy + 'px';
	        	ta.className = 'teInPlace';

	        	cancel.style.left = (myx+36) + 'px';
	        	cancel.style.top = (myy-23)  + 'px';
	        	cancel.innerHTML = 'Cancel';
	        	cancel.className = 'teCancelBtn teInPlace btn';
	        	cancel.addEventListener( 'click', cancelAction );

	        	save.style.width='40px';
	        	save.style.left = (myx-5) + 'px';
	        	save.style.top = (myy-23) + 'px';
	        	save.innerHTML = 'Save';
	        	save.className = 'btn btn-primary teInPlace';
	        	save.addEventListener( 'click', saveAction );

	        	cont.insertBefore( ta, wac_canvas.parentNode );
	        	cont.insertBefore( cancel, ta );
	        	cont.insertBefore( save, ta );

	        	// if this is default starting text, delete that since
	        	// it's garbage; focus() works after container is added
	        	// and is required to get cursor at text end
        		ta.focus();
	        	if ( this.txt === TEXT_DEFAULT ) {
	        		ta.value = '';
	        	} else {
	        		ta.value = this.txt;
	        	}
			}

            return (true);
        },
        highlight: function()
        {
            //this.lineColor = "#ff0000";
            this.drawBorder();
        },
        unhighlight: function(ctx)
        {
            //this.lineColor = "#00ff00";
            this.drawBorder();
        }},
    {});

    WAC.anno.wacCmd_NewText = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_NewText', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_NewText', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_NewText(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj.add(new WAC.anno.wacNote(gobj._ctx.canvas.self.getUniqueObjectID(), gobj._ctx, TEXT_DEFAULT, this.x, this.y));
        }},
    {});

    WAC.anno.wacCmd_NoteInit = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_NoteInit', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_NoteInit', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_NoteInit(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj._X = this.x;
            gobj._Y = this.y;
            gobj.setText( TEXT_DEFAULT );
            gobj._parentObject._newObject = null;
        }},
    {});

    WAC.anno.wacCmd_SetText = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetText', arguments[0].objID);
                this.txt = arguments[0].txt;
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetText', arguments[0]);
                this.txt = arguments[1];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_SetText(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj.setText(this.txt);
        }},
    {});

    WAC.anno.wacCmd_SetTextBorder = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetTextBorder', arguments[0].objID);
                this.hasBorder = arguments[0].hasBorder;
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetTextBorder', arguments[0]);
                this.hasBorder = arguments[1];
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_SetTextBorder(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj._hasBorder = this.hasBorder;
        }},
    {});

    WAC.anno.wacCmd_SetTextAlignment = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetTextAlignment', arguments[0].objID);
                this.alignment = arguments[0].alignment;
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetTextAlignment', arguments[0]);
                this.alignment = arguments[1];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_SetTextAlignment(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj._alignment = this.alignment;
        }},
    {});

    WAC.anno.wacCmd_SetFont = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetFont', arguments[0].objID);
                this.isItalic  = arguments[0].isItalic;
                this.isBold    = arguments[0].isBold;
                this.fontSize  = arguments[0].fontSize;
                this.fontFamily= arguments[0].fontFamily;
            }
            else if(arguments.length == 5)
            {
                this.base('wacCmd_SetFont', arguments[0]);
                this.isItalic  = arguments[1];
                this.isBold    = arguments[2];
                this.fontSize  = arguments[3];
                this.fontFamily= arguments[4];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_SetTextAlignment(should be 5)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj.isItalic = this.isItalic;
            gobj.isBold = this.isBold;
            gobj.fontSize = this.fontSize;
            gobj.fontFamily = this.fontFamily;
            gobj.setText(gobj.txt);
        }},
    {});


    WAC.anno.wacCmd_MoveText = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_MoveText', arguments[0].objID);
                this.dx = arguments[0].dx;
                this.dy = arguments[0].dy;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_MoveText', arguments[0]);
                this.dx = arguments[1];
                this.dy = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_MoveText(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj.move(null, dx, dy);
        }},
    {});
})(this);

