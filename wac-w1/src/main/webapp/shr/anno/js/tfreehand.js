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

  'use strict';

	var WAC = global.WAC || (global.WAC = { });
    WAC.anno = WAC.anno || { };

    if (WAC.anno.wacFreeHand)
    {
        console.warn('WAC.anno.wacFreeHand is already defined');
        return;
    }

    WAC.anno.createFreeHand = function(wac_cnv, x, y)
    {
    	var new_obj = new WAC.anno.wacFreeHand(wac_cnv.getUniqueObjectID(), wac_cnv.ctx, x, y, 100, 100);
    	if((x === null) || (y === null))
    	{
    		wac_cnv._Object.setNewObject(new_obj);
    		wac_cnv.canvas.style.cursor = 'crosshair';
    	}
    	else
		{
    		wac_cnv._Object.add(new_obj);
		}
    	wac_cnv.sendCommand(new WAC.anno.wacCmd_NewFreeHand(wac_cnv._Object.getID(), x, y));
    };

    WAC.anno.wacFreeHand = WAC.anno.wacGObject.extend({
        constructor: function(id, ctx, x, y, w, h)
        {
            this.base(id, ctx);
            this._type = "WAC.anno.wacFreeHand";
            this._X = x;
            this._Y = y;
            this._W = w;
            this._H = h;
            this._lineWidth = 4;
            this.points = [];
            this.addpoints = false;
            this.HOT_DISTANCE=10;

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
        	objectData.points = this.points;

        	return objectData;
        },

        restoreFromData: function(data)
        {
        	this.base(data);
        	this._X = data.x;
        	this._Y = data.y;
        	this._W = data.w;
        	this._H = data.h;
        	this.points = data.points;
        },

        initMenus: function()
        {
    		var wac_cnv = WAC.anno.wacUtil.get_wacCanvas(this);
    		if(wac_cnv.menus[this._type] === undefined)
    		{
                var Arguments = {id: "tFreeHandMenu", Base: wac_cnv, Width: 100, ClickEventListener: this.OnMenuItemSelect};
                wac_cnv.menus[this._type] = new CustomContextMenu(Arguments);
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/linewidth16.png', 'Line Width', false, this._type+'.changeLineWidth');
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Line Color', false, this._type+'.changeLineColor');
                wac_cnv.menus[this._type].AddSeparatorItem();
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/delete16.png', 'Delete', false, this._type+'.delete');
    		}
        },

        init: function(evt, x, y)
        {
        	this._X = x-10;
        	this._Y = y-10;
        	this._W = 10;
        	this._H = 10;
            this.sendCommand(new WAC.anno.wacCmd_FreeHandInit(this.getID(), x, y));
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
                case 'WAC.anno.wacFreeHand.changeLineWidth':
                    WAC.anno.dialogs.displayEditLineWidthDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineWidth);
                    break;

                case 'WAC.anno.wacFreeHand.changeLineColor':
                    WAC.anno.dialogs.displayEditColorDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineColor, "_lineColor");
                    break;

                case 'WAC.anno.wacFreeHand.delete':
                    var cmd = new WAC.anno.wacCmd_RemoveObject(Base._Object.getID(), Base._Object._GUIObject.getID());
                    Base._Object.remove(Base._Object._GUIObject);
                    Base.sendCommand(cmd);
                    break;
            }
            Base.redraw();
        },
        addPoint: function(x, y)
        {
            this.points.push({x: x, y: y});
            if(x < this._X)
            {
                var dx = this._X - x;
                this._X -= dx;
                this._W += dx;
            }
            else if(x > this._X + this._W)
            {
                var dx = x - this._X - this._W;
                this._W += dx;
            }
            if(y < this._Y)
            {
                var dy = this._Y - y;
                this._Y -= dy;
                this._H += dy;
            }
            else if(y > this._Y + this._H)
            {
                var dy = y - this._Y - this._H;
                this._H += dy;
            }
        },
        remove: function()
        {
        	this._parentObject.remove(this);
        },

        draw: function()
        {
        	if((this._X === null) || (this._Y === null) || (this._W === null) || (this._H === null))
        		return false;

        	if((this.points.length === 0) || this.addpoints)
               this.drawBorder(this._ctx);
            this.drawDrawing(this._ctx);
        },
        drawBorder: function(ctx)
        {
            this._ctx.strokeStyle = this._lineColor;
            this._ctx.fillStyle = this._fillColor;
            this._ctx.lineWidth = 1;
            this._ctx.strokeRect(this._X, this._Y, this._W, this._H);
        },
        drawDrawing: function(ctx)
        {
            if(this.points.length > 0)
            {
                var oldLineWidth = this._ctx.lineWidth;
                this._ctx.lineWidth = this._lineWidth;
                this._ctx.strokeStyle = this._lineColor;
                this._ctx.fillStyle = this._fillColor;
                this._ctx.beginPath();
                this._ctx.moveTo(this.points[0].x, this.points[0].y);
                for(var i = 1; i < this.points.length; i++)
                {
                    this._ctx.lineTo(this.points[i].x, this.points[i].y);
                }
                this._ctx.stroke();
                this._ctx.closePath();
                this._ctx.lineWidth = oldLineWidth;
            }
        },
        inside: function(x, y)
        {
        	if((this._X === null) || (this._Y === null) || (this._W === null) || (this._H === null))
        		return false;

            if(this.points.length > 0)
            {
                for(var i = 0; i < this.points.length; i++)
                {
                    if(Math.sqrt(  (x - this.points[i].x)*(x - this.points[i].x) +
                                   (y - this.points[i].y)*(y - this.points[i].y) ) <= this.HOT_DISTANCE)
                        return true;
                }
                return false;
            }
            else
            {
                return this._X <= x && this._X +this._W >=x &&
                	   this._Y <= y && this._Y +this._H >=y;
            }
        },
        mouseEnter: function(evt, x, y)
        {
            evt.target.style.cursor = 'move';
        },
        mouseExit: function(evt, x, y)
        {
            evt.target.style.cursor = 'auto';
        },
        mouseDown: function(evt, x, y)
        {
            if(this.points.length == 0)
            {
                this.points = [{x:x, y:y}];
                this.addpoints = true;
                return true;
            }
            else
            {
                return false;
            }
        },
        mouseUp: function(evt, x, y)
        {
            this.addpoints = false;
            if(this.addpoints)
            {
                return true;
            }
            else
            {
                return false;
            }
        },
        mouseDrag: function(evt, x, y)
        {
            if(this.addpoints)
            {
                this.addPoint(x, y);
                this.sendCommand(new WAC.anno.wacCmd_AddPointToFreeHand(this.getID(), x, y));
                return true;
            }
            else
            {
                return false;
            }
        },
        move: function(evt, dx, dy)
        {
            this.base(dx, dy);
            for(var i = 0; i < this.points.length; i++)
            {
                this.points[i].x += dx;
                this.points[i].y += dy;
            }
        }},
    {});

    WAC.anno.wacCmd_NewFreeHand = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_NewFreeHand', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_NewFreeHand', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_NewFreeHand(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj.add(new WAC.anno.wacFreeHand(gobj._ctx.canvas.self.getUniqueObjectID(), gobj._ctx, this.x, this.y, 100, 100));
        }},
    {});

    WAC.anno.wacCmd_FreeHandInit = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_FreeHandInit', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_FreeHandInit', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_FreeHandInit(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj._X = this.x - 10;
            gobj._Y = this.y - 10;
            gobj._W = 10;
            gobj._H = 10;
            gobj._parentObject._newObject = null;
        }},
    {});


    WAC.anno.wacCmd_AddPointToFreeHand = WAC.anno.wacCommand.extend({
        constructor: function(id, x, y)
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_AddPointToFreeHand', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_AddPointToFreeHand', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_AddPointToFreeHand(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj.addPoint(this.x, this.y);
        }},
    {});

    WAC.anno.wacCmd_MoveFreeHand = WAC.anno.wacCommand.extend({
        constructor: function(id, dx, dy)
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_MoveFreeHand', arguments[0].objID);
                this.dx = arguments[0].dx;
                this.dy = arguments[0].dy;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_MoveFreeHand', arguments[0]);
                this.dx = arguments[1];
                this.dy = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_MoveFreeHand(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj._X += this.dx;
            gobj._Y += this.dy;
            for(var i = 0; i < gobj.points.length; i++)
            {
                gobj.points[i].x += this.dx;
                gobj.points[i].y += this.dy;
            }
        }},
    {});
})(this);