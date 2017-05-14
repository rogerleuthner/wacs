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

    if (WAC.anno.wacLine)
    {
        console.warn('WAC.anno.wacGObject is already defined');
        return;
    }

    WAC.anno.createLine = function(wac_cnv, x1, y1, x2, y2)
    {
    	var new_obj = new WAC.anno.wacLine(wac_cnv.getUniqueObjectID(), wac_cnv.ctx, x1, y1, x2, y2, true);
    	if((x1 === null) || (y1 === null) || (x2 === null) || (y2 === null))
    	{
    		wac_cnv._Object.setNewObject(new_obj);
    		new_obj.canvas.style.cursor = 'crosshair';
    	}
    	else
		{
    		wac_cnv._Object.add(new_obj);
		}

    	wac_cnv.sendCommand(new WAC.anno.wacCmd_NewLine(wac_cnv._Object.getID(), x1, y1));
    };

    WAC.anno.wacLine = WAC.anno.wacGObject.extend({
        constructor: function(id, ctx, x1, y1, x2, y2, hasArrow)
        {
            this.base(id, ctx);
            this._type = "WAC.anno.wacLine";
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.hasArrow = hasArrow;
            this._lineWidth= 2;
            this._lineColor = "#00008B";
            this._fillColor = "#00008B";
            this.HOT_DISTANCE=5;
            this.dragBegin= false;
            this.dragEnd= false;

            WAC.anno.wacUtil.initLine(this);
            if(ctx)
            {
            	this.initMenus();
            }
        },

        getObjectData: function()
        {
        	var objectData = this.base();
        	objectData.hasArrow = this.hasArrow;
        	WAC.anno.wacUtil.getLineData(this, objectData);
        	return objectData;
        },

        restoreFromData: function(data)
        {
        	this.base(data);
        	this.hasArrow = data.hasArrow;
        	WAC.anno.wacUtil.setLineData(this, data);
        },

        initMenus: function()
        {
    		var wac_cnv = WAC.anno.wacUtil.get_wacCanvas(this);
    		if(wac_cnv.menus[this._type] === undefined)
    		{
                var Arguments = {id: "tLineMenu", Base: wac_cnv, Width: 100, ClickEventListener: this.OnMenuItemSelect};
                wac_cnv.menus[this._type] = new CustomContextMenu(Arguments);
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/linewidth16.png', 'Line Width', false, this._type+'.changeLineWidth');
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/rainbow16.png', 'Line Color', false, this._type+'.changeLineColor');
                wac_cnv.menus[this._type].AddSeparatorItem();
                if((WAC.gisanno !== undefined) || (WAC.gisanno !== undefined)) {
                	wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/layers.png', 'Set Altitude', false, this._type+'.changeAltitude');
                }
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/right-arrow.png', 'Arrow On/Off', false, this._type+'.arrow');
            	wac_cnv.menus[this._type].AddSeparatorItem();
                wac_cnv.menus[this._type].AddItem('/wac-w1/shr/anno/images/delete16.png', 'Delete', false, this._type+'.delete');
    		}
        },
        init: function(evt, x, y)
        {
        	WAC.anno.wacUtil.initNullLine(this, x, y);
        	if(this.entity === undefined)
        		this.sendCommand(new WAC.anno.wacCmd_LineInit(this.getID(), x, y));
        	else
    		{
            	var positions = this.entity.polyline.positions;
            	var vals = positions.getValue(0);
            	var v1 = vals[0];
            	var v2 = vals[1];
        		this.sendCommand(new WAC.anno.wacCmd_LineInit(this.getID(), x, y,
        				v1.x, v1.y, v1.z, v2.x, v2.y, v2.z));
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
                case 'WAC.anno.wacLine.changeLineWidth':
                    WAC.anno.dialogs.displayEditLineWidthDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineWidth);
                    break;

                case 'WAC.anno.wacLine.changeAltitude':
	                WAC.anno.dialogs.displayEditAltitudeDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._altitude);
	                break;

                case 'WAC.anno.wacLine.changeLineColor':
                	WAC.anno.dialogs.displayEditColorDialog(Base, Base._Object._GUIObject, Base._Object._GUIObject._lineColor, "_lineColor");
                    break;

                case 'WAC.anno.wacLine.arrow':
                    WAC.anno.wacUtil.setArrowOnOff(Base._Object._GUIObject);

                    var cmd = new WAC.anno.wacCmd_SetHasArrow(Base._Object._GUIObject.getID(), Base._Object._GUIObject.hasArrow);
                    Base.sendCommand(cmd);
                    break;

                case 'WAC.anno.wacLine.delete':
                    var cmd = new WAC.anno.wacCmd_RemoveObject(Base._Object.getID(), Base._Object._GUIObject.getID());
                    Base._Object._GUIObject.remove();
                    Base.sendCommand(cmd);
                    break;
            }
            Base.redraw();
        },
        remove: function()
        {
        	WAC.anno.wacUtil.removeLine(this);
        },
        hide: function()
        {
        	this.base();
        	WAC.anno.wacUtil.hideLine(this);
        },
        show: function()
        {
        	this.base();
        	WAC.anno.wacUtil.showLine(this);
        },

        draw: function()
        {
        	WAC.anno.wacUtil.drawLine(this);
        },

        inside: function(x, y)
        {
            return WAC.anno.wacUtil.insideLine(this, x, y);
        },
        getPositions: function()
        {
       	    if(this.self && this.self.drag_positions)
       	    {
       	    	return this.self.drag_positions;
       	    }
        },
        mouseEnter: function(evt, x, y)
        {
        	this.base(evt, x, y);
        	//WAC.anno.wacUtil.setLineColor(this, "#FF0000");
            this.draw();
        },
        mouseExit: function(evt, x, y)
        {
        	this.base(evt, x, y);
        	//WAC.anno.wacUtil.setLineColor(this, "#00008B");
            this.draw();
        },

        move: function(evt, dx, dy)
        {
        	if(this.entity === undefined)
        	{
	        	WAC.anno.wacUtil.moveLine(this, dx, dy);
	        	this.sendCommand(new WAC.anno.wacCmd_MoveLine(this.getID(), this.x1, this.y1, this.x2, this.y2));
        	}
        	else
    		{
            	var positions0 = this.entity.polyline.positions;
            	var vals0 = positions0.getValue(0);
            	var v01 = vals0[0].clone();
            	var v02 = vals0[1].clone();

            	WAC.anno.wacUtil.moveLine(this, dx, dy);

	        	var positions1 = this.entity.polyline.positions;
            	var vals1 = positions1.getValue(0);
            	var v11 = vals1[0].clone();
            	var v12 = vals1[1].clone();

        		this.sendCommand(new WAC.anno.wacCmd_MoveLine(this.getID(), v11.x, v11.y, v11.z, v12.x, v12.y, v12.z));
    		}
        },
        mouseDown: function(evt, x, y)
        {
            var vertices = WAC.anno.wacUtil.getLineVertices(this);
            if(this.withinHotDistance(x, y, vertices[0].x, vertices[0].y))
            {
                this.dragBegin = true;
                this.dragEnd = false;
            }
            else if(this.withinHotDistance(x, y, vertices[1].x, vertices[1].y))
            {
                this.dragBegin = false;
                this.dragEnd= true;
            }
            else
            {
                this.dragBegin = false;
                this.dragEnd   = false;
            }
            WAC.anno.wacUtil.setLineGetPositionsCallback(this);
        },
        mouseUp: function(evt, x, y)
        {
        	WAC.anno.wacUtil.removeLineGetPositionsCallback(this);
            this.dragBegin = false;
            this.dragEnd= false;
        },
        mouseDrag: function(evt, x, y)
        {
            if(this.dragBegin)
            {
            	var dx = x - this.x1;
            	var dy = y - this.y1;
            	if(this.entity === undefined)
           		{
                	WAC.anno.wacUtil.setLineBeginPosition(this, x, y);
            		this.sendCommand(new WAC.anno.wacCmd_MoveLine(this.getID(), this.x1, this.y1, this.x2, this.y2));
           		}
            	else
            	{
                	var positions0 = this.entity.polyline.positions;
                	var vals0 = positions0.getValue(0);
                	var v01 = vals0[0].clone();
                	var v02 = vals0[1].clone();
                	WAC.anno.wacUtil.setLineBeginPosition(this, x, y);
                	var positions1 = this.entity.polyline.positions;
                	var vals1 = positions1.getValue(0);
                	var v11 = vals1[0].clone();
                	var v12 = vals1[1].clone();

            		this.sendCommand(new WAC.anno.wacCmd_MoveLine(this.getID(), v11.x, v11.y, v11.z, v12.x, v12.y, v12.z));
            	}
                return true;
            }
            else if(this.dragEnd)
            {
            	var dx = x - this.x2;
            	var dy = y - this.y2;
            	if(this.entity === undefined)
           		{
            		WAC.anno.wacUtil.setLineEndPosition(this, x, y);
            		this.sendCommand(new WAC.anno.wacCmd_MoveLine(this.getID(), this.x1, this.y1, this.x2, this.y2));
           		}
            	else
        		{
                	var positions0 = this.entity.polyline.positions;
                	var vals0 = positions0.getValue(0);
                	var v01 = vals0[0].clone();
                	var v02 = vals0[1].clone();
                	WAC.anno.wacUtil.setLineEndPosition(this, x, y);
                	var positions1 = this.entity.polyline.positions;
                	var vals1 = positions1.getValue(0);
                	var v11 = vals1[0].clone();
                	var v12 = vals1[1].clone();

            		this.sendCommand(new WAC.anno.wacCmd_MoveLine(this.getID(), v11.x, v11.y, v11.z, v12.x, v12.y, v12.z));
        		}
                return true;
            }
            return false;
        },
        mouseMove: function(evt, x, y)
        {
            var vertices = WAC.anno.wacUtil.getLineVertices(this);
            if(this.withinHotDistance(x, y, vertices[0].x, vertices[0].y))
            {
                this.canvas.style.cursor = 'nw-resize';
            }
            else if(this.withinHotDistance(x, y, vertices[1].x, vertices[1].y))
            {
            	this.canvas.style.cursor = 'ne-resize';
            }
            else
            {
            	this.canvas.style.cursor = 'move';
            }
        }},
    {});

    WAC.anno.wacCmd_NewLine = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_NewLine', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_NewLine', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_NewLine(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
        	if((this.x === null) || (this.y === null))
        	{
                var subobj_id = WAC.anno.wacUtil.get_wacCanvas(gobj).getUniqueObjectID();
                var subobj = new WAC.anno.wacLine(subobj_id, gobj._ctx, null, null, null, null, true);
                gobj.add(subobj);
                gobj._newObject = subobj;

        	}
        	else
        	{
                gobj.add(new WAC.anno.wacLine(WAC.anno.wacUtil.get_wacCanvas(gobj).getUniqueObjectID(), gobj._ctx, this.x, this.y, this.x+100, this.y+100, true));
        	}
        }},
    {});


    WAC.anno.wacCmd_LineInit = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_LineInit', arguments[0].objID);
                this.x = arguments[0].x;
                this.y = arguments[0].y;
                if(arguments[0].x1 !== undefined) this.x1 = arguments[0].x1;
                if(arguments[0].y1 !== undefined) this.y1 = arguments[0].y1;
                if(arguments[0].z1 !== undefined) this.z1 = arguments[0].z1;
                if(arguments[0].x2 !== undefined) this.x2 = arguments[0].x2;
                if(arguments[0].y2 !== undefined) this.y2 = arguments[0].y2;
                if(arguments[0].z2 !== undefined) this.z2 = arguments[0].z2;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_LineInit', arguments[0]);
                this.x = arguments[1];
                this.y = arguments[2];
            }
            else if(arguments.length == 9)
        	{
                this.base('wacCmd_LineInit', arguments[0]);
            	this.x = arguments[1];
            	this.y = arguments[2];

            	this.x1 = arguments[3];
            	this.y1 = arguments[4];
            	this.z1 = arguments[5];
            	this.x2 = arguments[6];
            	this.y2 = arguments[7];
            	this.z2 = arguments[8];
        	}
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_LineInit(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
            gobj.x1 = this.x - 10;
            gobj.y1 = this.y - 10;
            gobj.x2 = this.x;
            gobj.y2 = this.y;
            gobj._parentObject._newObject = null;
            if(this.x1 !== undefined)
            {
            	WAC.anno.wacUtil.initLineFromCommand(gobj, this);
            }
        }},
    {});

    WAC.anno.wacCmd_MoveLine = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_MoveLine', arguments[0].objID);
                this.x1 = arguments[0].x1;
                this.y1 = arguments[0].y1;
                if(arguments[0].z1 !== undefined) this.z1 = arguments[0].z1;

                this.x2 = arguments[0].x2;
                this.y2 = arguments[0].y2;
                if(arguments[0].z2 !== undefined) this.z2 = arguments[0].z2;
            }
            else if(arguments.length == 5)
            {
                this.base('wacCmd_MoveLine', arguments[0]);
                this.x1 = arguments[1];
                this.y1 = arguments[2];
                this.x2 = arguments[3];
                this.y2 = arguments[4];
            }
            else if(arguments.length == 7)
            {
                this.base('wacCmd_MoveLine', arguments[0]);
                this.x1 = arguments[1];
                this.y1 = arguments[2];
                this.z1 = arguments[3];
                this.x2 = arguments[4];
                this.y2 = arguments[5];
                this.z2 = arguments[6];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_MoveLine(should be 5)";
            }
        },
        applyCmd: function(gobj)
        {
            if(gobj.entity === undefined)
            {
	            gobj.x1 = this.x1;
	            gobj.y1 = this.y1;
	            gobj.x2 = this.x2;
	            gobj.y2 = this.y2;
            }
            else if(gobj.entity !== undefined)
            {
            	gobj.drag_positions[0].x = this.x1;
            	gobj.drag_positions[0].y = this.y1;
            	gobj.drag_positions[0].z = this.z1;

            	gobj.drag_positions[1].x = this.x2;
            	gobj.drag_positions[1].y = this.y2;
            	gobj.drag_positions[1].z = this.z2;
            }
        }},
    {});


    WAC.anno.wacCmd_SetHasArrow = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetHasArrow', arguments[0].objID);
                this.hasArrow = arguments[0].hasArrow;
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetHasArrow', arguments[0]);
                this.hasArrow = arguments[1];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_SetHasArrow(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
        	WAC.anno.wacUtil.setLineHasArrow(gobj, this.hasArrow);
        }},
    {});
})(this);