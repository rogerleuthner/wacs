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

    if (WAC.anno.wacRect)
    {
        console.warn('WAC.anno.wacRect is already defined');
        return;
    }

    WAC.anno.createRect= function(wac_cnv, x, y)
    {
    	var new_obj = new WAC.anno.wacRect(wac_cnv.getUniqueObjectID(), wac_cnv.ctx, x, y, 100, 100);
    	if((x === null) || (y === null))
    	{
    		wac_cnv._Object.setNewObject(new_obj);
    		new_obj.canvas.style.cursor = 'crosshair';
    	}
    	else
		{
    		wac_cnv._Object.add(new_obj);
		}
    	wac_cnv.sendCommand(new WAC.anno.wacCmd_NewRect(wac_cnv._Object.getID(), x, y));
    	return new_obj;
    };

    WAC.anno.wacRect = WAC.anno.wacGObject.extend({
        constructor: function(id, ctx, x, y, w, h)
        {
            this.base(id, ctx);
            this._type = "WAC.anno.wacRect";
            this._X = x;
            this._Y = y;
            this._W = w;
            this._H = h;
            this._lineColor = "#FFFF00";
            this._fillColor = "#FFFF00";
            this._transparent = false;
            this._opacity = 0.5;
            this.HOT_DISTANCE=10;
            this.dragTL = false;
            this.dragBL = false;
            this.dragTR = false;
            this.dragBR = false;
            this.dragT = false;
            this.dragL = false;
            this.dragR = false;
            this.dragB = false;
            this._x1 = 0;
            this._y1 = 0;
            this._opacity = 0.5;
            WAC.anno.wacUtil.initRectangle(this);
            if(ctx)
            {
            	this.initMenus();
            }
        },

        getObjectData: function()
        {
        	var objectData = this.base();
        	objectData.transparent= this._transparent;
        	objectData.opacity= this._opacity;
        	WAC.anno.wacUtil.getRectangleData(this, objectData);
        	return objectData;
        },

        restoreFromData: function(data)
        {
        	this.base(data);
        	this._transparent = data.transparent;
        	this._opacity = data.opacity;
        	WAC.anno.wacUtil.setRectangleData(this, data);
        },

        initMenus: function()
        {
    		var wac_cnv = WAC.anno.wacUtil.get_wacCanvas(this);
    		if(wac_cnv.menus[this._type] === undefined)
    		{
                var Arguments = {id: "tRectMenu", Base: wac_cnv, Width: 100, ClickEventListener: this.OnMenuItemSelect};
                wac_cnv.menus[this._type] = new CustomContextMenu(Arguments);
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/linewidth16.png', 'Line Width', false, this._type+'.changeLineWidth');
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Line Color', false, this._type+'.changeLineColor');
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Fill Color', false, this._type+'.changeFillColor');
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Opacity', false, this._type+'.changeOpacity');
                wac_cnv.menus[this._type].AddSeparatorItem();

                if((WAC.gisanno !== undefined) || (WAC.gisanno !== undefined)) {
                	wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/layers.png', 'Set Altitude', false, this._type+'.changeAltitude');
                	//wac_cnv.menus[this._type].AddItem(null, 'Fill On/Off', false, this._type+'.transparent');
                	wac_cnv.menus[this._type].AddSeparatorItem();
                }

                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/delete16.png', 'Delete', false, this._type+'.delete');
    		}
        },

        init: function(evt, x, y)
        {
        	WAC.anno.wacUtil.initNullRectangle(this, x, y);
        	if(this.entity === undefined)
                this.sendCommand(new WAC.anno.wacCmd_RectInit(this.getID(), x, y));
        	else
    		{
            	var coords = this.entity.rectangle.coordinates;
            	var vals = coords.getValue(0);
        		this.sendCommand(new WAC.anno.wacCmd_RectInit(this.getID(), x, y,
        				vals.west, vals.east, vals.north, vals.south));
    		}

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
                case 'WAC.anno.wacRect.changeLineWidth':
                    WAC.anno.dialogs.displayEditLineWidthDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineWidth);
                    break;

                case 'WAC.anno.wacRect.changeAltitude':
	                WAC.anno.dialogs.displayEditAltitudeDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._altitude);
	                break;

                case 'WAC.anno.wacRect.changeLineColor':
                    WAC.anno.dialogs.displayEditColorDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineColor, "_lineColor");
                    break;

                case 'WAC.anno.wacRect.changeFillColor':
                    WAC.anno.dialogs.displayEditColorDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._fillColor, "_fillColor");
                    break;

                case 'WAC.anno.wacRect.changeOpacity':
	                WAC.anno.dialogs.displayEditOpacityDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._opacity);
	                break;

                case 'WAC.anno.wacRect.transparent':
                    Base._Object._GUIObject._transparent = !Base._Object._GUIObject._transparent;

                    var cmd = new WAC.anno.wacCmd_SetTransparent(Base._Object._GUIObject.getID(), Base._Object._GUIObject._transparent);
                    Base.sendCommand(cmd);
                    break;

                case 'WAC.anno.wacRect.delete':
                    var cmd = new WAC.anno.wacCmd_RemoveObject(Base._Object.getID(), Base._Object._GUIObject.getID());
                    Base._Object._GUIObject.remove();
                    Base.sendCommand(cmd);
                    break;
            }
            Base.redraw();
        },

        inside: function(x, y)
        {
            return WAC.anno.wacUtil.insideRectangle(this, x, y);
        },
        remove: function()
        {
        	WAC.anno.wacUtil.removeRectangle(this);
        },

        hide: function()
        {
        	this.base();
        	WAC.anno.wacUtil.hideRectangle(this);
        },
        show: function()
        {
        	this.base();
        	WAC.anno.wacUtil.showRectangle(this);
        },
        setOpacity: function(opacity)
        {
        	this._opacity = opacity;
        	WAC.anno.wacUtil.setOpacity(this, opacity);
        },
        draw: function()
        {
            WAC.anno.wacUtil.drawRectangle(this);
        },
        getCoordinates: function()
        {
       	    if(this.self && this.self.drag_coordinates)
       	    {
       	    	return this.self.drag_coordinates;
       	    }
        },

        move: function(evt, dx, dy)
        {
        	if(this.entity === undefined)
        	{
	        	WAC.anno.wacUtil.moveRect(this, dx, dy);
	        	this.sendCommand(new WAC.anno.wacCmd_SetRectPositions(this.getID(), this._X, this._Y,
	        														  this._X+this._W, this._Y+this._H));
        	}
        	else
    		{
            	var c0= { west:this.drag_coordinates.west,   east:this.drag_coordinates.east,
            			 north:this.drag_coordinates.north, south:this.drag_coordinates.south};

            	if((dx !== 0) && (dy !== 0))
            	{
            		var x123 = 123;
            	}
            	WAC.anno.wacUtil.moveRect(this, dx, dy);

            	var c1= { west:this.drag_coordinates.west,   east:this.drag_coordinates.east,
           			 north:this.drag_coordinates.north, south:this.drag_coordinates.south};

	        	this.sendCommand(new WAC.anno.wacCmd_SetRectPositions(this.getID(), c1.west, c1.north, c1.east, c1.south));
    		}
        },

        mouseDown: function(evt, x, y)
        {
           var ne_win  = WAC.anno.wacUtil.getRectangleCoordinateNE(this);
           var nw_win  = WAC.anno.wacUtil.getRectangleCoordinateNW(this);
           var se_win  = WAC.anno.wacUtil.getRectangleCoordinateSE(this);
           var sw_win  = WAC.anno.wacUtil.getRectangleCoordinateSW(this);

            var sqrt_2 = Math.sqrt(2.0);
            this.dragTL = false;
            this.dragBL = false;
            this.dragTR = false;
            this.dragBR = false;
            this.dragT = false;
            this.dragL = false;
            this.dragR = false;
            this.dragB = false;
            if(this.withinHotDistance(x, y, se_win.x, se_win.y))
            {
                this.dragBR = true;
            }
            else if(this.withinHotDistance(x, y, ne_win.x, ne_win.y))
            {
                this.dragTR = true;
            }
            else if(this.withinHotDistance(x, y, nw_win.x, nw_win.y))
            {
                this.dragTL = true;
            }
            else if(this.withinHotDistance(x, y, sw_win.x, sw_win.y))
            {
                this.dragBL = true;
            }
            /*
            else if(Math.abs( x - (nw_win.x+sw_win.x)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.dragL = true;
            }
            else if(Math.abs( y - (sw_win.y+se_win.y)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.dragB = true;
            }
            else if(Math.abs(x - (ne_win.x+se_win.x)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.dragR = true;
            }
            else if(Math.abs(y - (ne_win.y+nw_win.y)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.dragT = true;
            }*/

            this._x1 = x;
            this._y1 = y;
            WAC.anno.wacUtil.setRectCoordinatesCallback(this);
        },
        mouseUp: function(evt, x, y)
        {
            this.dragTL = false;
            this.dragBL = false;
            this.dragTR = false;
            this.dragBR = false;
            this.dragT = false;
            this.dragL = false;
            this.dragR = false;
            this.dragB = false;
            WAC.anno.wacUtil.removeRectCoordinatesCallback(this);
        },
        mouseDrag: function(evt, x, y)
        {
            var me_x = this.getMouseX(evt);
            var me_y = this.getMouseY(evt);
            var dx = me_x - this._x1;
            var dy = me_y - this._y1;
        	//console.log("dx="+dx+", dy="+dy);

            if(this.dragTL)
            {
            	WAC.anno.wacUtil.moveRectVertexNW(this, dx, dy);
            	return true;
            }
            else if(this.dragBL)
            {
            	WAC.anno.wacUtil.moveRectVertexSW(this, dx, dy);
            	return true;
            }
            else if(this.dragTR)
            {
            	WAC.anno.wacUtil.moveRectVertexNE(this, dx, dy);
            	return true;
            }
            else if(this.dragBR)
            {
            	WAC.anno.wacUtil.moveRectVertexSE(this, dx, dy);
            	return true;
            }
            else if(this.dragT)
            {
            	WAC.anno.wacUtil.moveRectSideN(this, dx, dy);
            	return true;
            }
            else if(this.dragL)
            {
            	WAC.anno.wacUtil.moveRectSideW(this, dx, dy);
            	return true;
            }
            else if(this.dragR)
            {
            	WAC.anno.wacUtil.moveRectSideE(this, dx, dy);
            	return true;
            }
            else if(this.dragB)
            {
            	WAC.anno.wacUtil.moveRectSideS(this, dx, dy);
            	return true;
            }
            return false;
        },
        mouseMove: function(evt, x, y)
        {
            var ne_win  = WAC.anno.wacUtil.getRectangleCoordinateNE(this);
            var nw_win  = WAC.anno.wacUtil.getRectangleCoordinateNW(this);
            var se_win  = WAC.anno.wacUtil.getRectangleCoordinateSE(this);
            var sw_win  = WAC.anno.wacUtil.getRectangleCoordinateSW(this);

            //console.log("x="+x+", y="+y+", ne="+ne_win);
            var sqrt_2 = Math.sqrt(2.0);
            if(this.withinHotDistance(x, y, se_win.x, se_win.y))
            {
            	this.canvas.style.cursor = 'se-resize';
            }
            else if(this.withinHotDistance(x, y, ne_win.x, ne_win.y))
            {
                this.canvas.style.cursor = 'ne-resize';
            }
            else if(this.withinHotDistance(x, y, nw_win.x, nw_win.y))
            {
            	this.canvas.style.cursor = 'nw-resize';
            }
            else if(this.withinHotDistance(x, y, sw_win.x, sw_win.y))
            {
            	this.canvas.style.cursor = 'sw-resize';
            }
            /*
            else if(Math.abs( x - (nw_win.x+sw_win.x)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.canvas.style.cursor = 'w-resize';
            }
            else if(Math.abs( y - (sw_win.y+se_win.y)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.canvas.style.cursor = 's-resize';
            }
            else if(Math.abs(x - (ne_win.x+se_win.x)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.canvas.style.cursor = 'e-resize';
            }
            else if(Math.abs(y - (ne_win.y+nw_win.y)/2) <= this.HOT_DISTANCE/sqrt_2)
            {
                this.canvas.style.cursor = 'n-resize';
            }*/
            else
            {
            	this.canvas.style.cursor = 'move';
            }
        }},
    {});

    WAC.anno.wacCmd_NewRect = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_NewRect', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_NewRect', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_NewRect(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            var subobj_id = WAC.anno.wacUtil.get_wacCanvas(gobj).getUniqueObjectID();
            var subobj = new WAC.anno.wacRect(subobj_id, gobj._ctx, null, null, 100, 100);
            gobj.add(subobj);
            gobj._newObject = subobj;
        }},

    {});

    WAC.anno.wacCmd_RectInit = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_RectInit', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
                if(arguments[0].west  !== undefined) this.west  = arguments[0].west;
                if(arguments[0].east  !== undefined) this.east  = arguments[0].east;
                if(arguments[0].north !== undefined) this.north = arguments[0].north;
                if(arguments[0].south !== undefined) this.south = arguments[0].south;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_RectInit', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else if(arguments.length == 7)
            {
                this.base('wacCmd_RectInit', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            	this.west  = arguments[3];
            	this.east  = arguments[4];
            	this.north = arguments[5];
            	this.south = arguments[6];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_RectInit(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj._X = this.x - 20;
            gobj._Y = this.y - 20;
            gobj._W = 20;
            gobj._H = 20;
            gobj._parentObject._newObject = null;
            if(this.west !== undefined)
            {
            	WAC.anno.wacUtil.initRectangleFromCommand(gobj, this);
            }
        }},
    {});

    WAC.anno.wacCmd_MoveRect = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_MoveRect', arguments[0].objID);
                this.dx = arguments[0].dx;
                this.dy = arguments[0].dy;
                if(arguments[0].dwest  !== undefined) this.dwest  = arguments[0].dwest;
                if(arguments[0].deast  !== undefined) this.deast  = arguments[0].deast;
                if(arguments[0].dnorth !== undefined) this.dnorth = arguments[0].dnorth;
                if(arguments[0].dsouth !== undefined) this.dsouth = arguments[0].dsouth;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_MoveRect', arguments[0]);
                this.dx = arguments[1];
                this.dy = arguments[2];
            }
            else if(arguments.length == 7)
            {
                this.base('wacCmd_MoveRect', arguments[0]);
                this.dx = arguments[1];
                this.dy = arguments[2];
                this.dwest = arguments[3];
                this.deast = arguments[4];
                this.dnorth = arguments[5];
                this.dsouth = arguments[6];
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_MoveRect(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            if(gobj.entity === undefined)
            {
	        	WAC.anno.wacUtil.moveRect(gobj, this.dx, this.dy);
            }
            else if(gobj.entity !== undefined)
            {
            	//console.log(this);
            	if(this.dwest === undefined)
            	{
            		var x12345= 12345;
            	}
            	gobj.drag_coordinates.west  += this.dwest;
            	gobj.drag_coordinates.east  += this.deast;
            	gobj.drag_coordinates.north += this.dnorth;
            	gobj.drag_coordinates.south += this.dsouth;
            	//gobj.entity.rectangle.coordinates= gobj.drag_coordinates;
            }
        }},
    {});

    WAC.anno.wacCmd_SetRectPositions = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetRectPositions', arguments[0].objID);
                this.x1 = arguments[0].x1;
                this.y1 = arguments[0].y1;
                this.x2 = arguments[0].x2;
                this.y2 = arguments[0].y2;
            }
            else if(arguments.length == 5)
            {
                this.base('wacCmd_SetRectPositions', arguments[0]);
                this.x1 = arguments[1];
                this.y1 = arguments[2];
                this.x2 = arguments[3];
                this.y2 = arguments[4];
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_SetRectPositions(should be 4)";
            }
        },
        applyCmd: function(gobj)
        {
        	if(gobj.entity === undefined)
        	{
	            gobj._X = this.x1;
	            gobj._Y = this.y1;
	            gobj._W = this.x2-this.x1;
	            gobj._H = this.y2-this.y1;
        	}
        	else
        	{
        		var vals = gobj.drag_coordinates;
            	vals.west  = this.x1;
            	vals.east  = this.x2;
            	vals.north = this.y1;
            	vals.south = this.y2;
       	    	//gobj.drag_coordinates = vals;
       	    	//gobj.entity.rectangle.coordinates =gobj.drag_coordinates;
        	}
        }},
    {});

    WAC.anno.wacCmd_SetTransparent = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetTransparent', arguments[0].objID);
                this.transparent = arguments[0].transparent;
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetTransparent', arguments[0]);
                this.transparent = arguments[1];
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_SetTransparent(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj._transparent = this.transparent;
        }},
    {});
})(this);