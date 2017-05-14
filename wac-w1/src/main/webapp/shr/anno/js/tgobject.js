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

    if (WAC.anno.wacGObject)
    {
        console.warn('WAC.anno.wacGObject is already defined');
        return;
    }

    WAC.anno.wacGObject = Base.extend({
        constructor: function(id, ctx)
        {
            this._ID = id;
            this._annotationObject = true;
            this._type = "WAC.anno.wacGObject";
            this._lineColor = "#00008B";
            this._fillColor = "#C0C0C0";
            this._highlightColor = "#ff0000";
            this._visible = true;
            this._highlighted = false;
            this._lineWidth = 2;
            this._X = 0;
            this._Y = 0;
            this._W = 0;
            this._H = 0;
            this._parentObject = null;
            this.HOT_DISTANCE=5;
            this._ctx = ctx;
            if(ctx)
            	this.canvas =  WAC.anno.wacUtil.getCanvas(ctx);
            //this.entity = undefined;
        },
        setEntity: function(ent)
        {
        	this.entity = ent;
        },
        getEntity: function()
        {
        	return this.entity;
        },

        getID: function()
        {
            return this._ID;
        },
        getMouseX: function(evt)
        {
        	return WAC.anno.wacUtil.getMouseX(evt);
        },
        getMouseY: function(evt)
        {
        	return WAC.anno.wacUtil.getMouseY(evt);
        },
        mouseEnter: function(evt, x, y)
        {
            this.canvas.style.cursor = 'move';
            return false;
        },
        mouseExit: function(evt, x, y)
        {
            this.canvas.style.cursor = 'auto';
            return false;
        },
        mouseDown: function(evt, x, y)
        {
            return false;
        },
        mouseDrag: function(evt, x, y)
        {
            return false;
        },
        mouseUp: function(evt, x, y)
        {
            return false;
        },
        mouseMove: function(evt, x, y)
        {
            return false;
        },
        mouseDoubleClick: function(evt, x, y)
        {
            return false;
        },
        isVisible: function(evt, x, y)
        {
            return this._visible;
        },
        highlight: function() 
        {
            this._highlighted = true;
        },
        unhighlight: function() 
        {
            this._highlighted = false;
        },
        setVisible: function(value) 
        {
            this._visible = value;
        },
        draw: function(ctx)
        {
        },
        computeDistance: function(x1, y1, x2, y2)
        {
            return Math.sqrt(  (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2) );
        },
        withinHotDistance: function(x1, y1, x2, y2)
        {
        	return (this.computeDistance(x1, y1, x2, y2) <= this.HOT_DISTANCE);
        },
        hide: function()
        {
        	this._visible = false;
        },
        show: function()
        {
        	this._visible = true;
        },
        move: function(evt, dx, dy)
        {
        },
        getObjectData: function()
        {
        	return {
        			id:this._ID,
        			type: this._type,
        			lineWidth:this._lineWidth,
        			lineColor:this._lineColor,
        			fillColor:this._fillColor        			
        	};
        },
        restoreFromData: function(data)
        {
			this._ID = data.id;
			this._type = data.type; 
			this._lineWidth = parseInt(""+data.lineWidth);;
			this._lineColor = data.lineColor;
			this._fillColor = data.fillColor;
        },
        sendCommand: function(cmd)
        {
        	if(this.canvas.self)
        		this.canvas.self.sendCommand(cmd);
        	else if(this._ctx.self)
        		this._ctx.self.sendCommand(cmd);
        }},
    {});

    WAC.anno.wacCmd_SetColor = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetColor', arguments[0].objID);
                this.propName = arguments[0].propName;
                this.color = arguments[0].color;
            }
            else if(arguments.length == 3)
            {
                this.base('wacCmd_SetColor', arguments[0]);
                this.propName = arguments[1];
                this.color = arguments[2];
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_SetColor(should be 3)";
            }
        },
        applyCmd: function(gobj)
        {
        	WAC.anno.wacUtil.setPropertyColor(gobj, this.propName, this.color);
        }}, 
    {});

    WAC.anno.wacCmd_SetLineWidth = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetLineWidth', arguments[0].objID);
                this.lineWidth = parseInt(arguments[0].lineWidth);
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetLineWidth', arguments[0]);
                this.lineWidth = parseInt(arguments[1]);
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_SetLineWidth(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
        	WAC.anno.wacUtil.setLineWidth(gobj, this.lineWidth);
        }}, 
    {});

    WAC.anno.wacCmd_SetAltitude = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetAltitude', arguments[0].objID);
                this.altitude = parseInt(arguments[0].altitude);
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetAltitude', arguments[0]);
                this.altitude = parseInt(arguments[1]);
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_SetLineWidth(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
        	WAC.anno.wacUtil.setAltitude(gobj, this.altitude);
        }}, 
    {});

    WAC.anno.wacCmd_SetOpacity= WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SetOpacity', arguments[0].objID);
                this.opacity = parseFloat(arguments[0].opacity);
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SetOpacity', arguments[0]);
                this.opacity = parseFloat(arguments[1]);
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_SetLineWidth(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
        	gobj.setOpacity(this.opacity);
        }}, 
    {});
})(this);