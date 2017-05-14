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

    if (WAC.anno.wacCompositeObject)
    {
        console.warn('WAC.anno.wacCompositeObject is already defined');
        return;
    }

    WAC.anno.wacCompositeObject = WAC.anno.wacGObject.extend({
        constructor: function(id, ctx)
        {
            this.base(id, ctx);
            this._type = "WAC.anno.wacCompositeObject";
            this._GUIObject = null;
            this._Shapes = [];
        },
        findObjectByID: function(id)
        {
            for(var i = 0; i < this._Shapes.length; i++)
            {
                if(this._Shapes[i].getID() === id)
                {
                    return this._Shapes[i];
                }
            }
            return null;
        },
	//this function is to support Cesium GIS only.
        add: function(obj, ind)
        {
        	if(ind === undefined)
        		this._Shapes.splice(this._Shapes.length, 0, obj);
        	else 
        		this._Shapes.splice(ind, 0, obj);
            obj._parentObject = this;
        },
        remove: function(obj)
        {
            for(var i = 0; i < this._Shapes.length; i++)
            {
                if(this._Shapes[i] === obj)
                {
                    this.removeAt(i);
                    obj._parentObject = null;
                }
            }
        },
        removeAt: function(ind)
        {
        	if(this._GUIObject == this._Shapes[ind])
        		this._GUIObject = null;
        	this._Shapes[ind]._parentObject = null;
            this._Shapes.splice(ind, 1);
        },
        indexOf: function(obj)
        {
            for(var i = 0; i < this._Shapes.length; i++)
            {
                if(this._Shapes[i] === obj)
                {
                	return i;
                }
            }
        },
        mouseEnter: function(evt, x, y)
        {
            var res = this.base(evt, x, y);
            if (res == false && this._GUIObject != null)
                res = this._GUIObject.mouseEnter(evt, x, y);
            return (res);
        },
        mouseDown: function(evt, x, y)
        {
            var res = this.base(evt, x, y);
            if (res == false && this._GUIObject != null)
                res = this._GUIObject.mouseDown(evt, x, y);
            return (res);
        },
        mouseDrag: function(evt, x, y)
        {
            var res = this.base(evt, x, y);
            if (res == false && this._GUIObject != null)
                res = this._GUIObject.mouseDrag(evt, x, y);
            return (res);
        },
        mouseUp: function(evt, x, y)
        {
            var res = this.base(evt, x, y);
            if (res == false && this._GUIObject != null)
                res = this._GUIObject.mouseUp(evt, x, y);
            return (res);
        },
        mouseExit: function(evt, x, y)
        {
            var res = this.base(evt, x, y);
            if (res == false && this._GUIObject != null)
            {
                res = this._GUIObject.mouseExit(evt, x, y);
                this._GUIObject = null;
            }
            return (res);
        },
        mouseMove: function(evt, x, y)
        {
            var obj = this.getGUIObject(x, y);
            //if(obj !== null)
            //{
            //    console.log("this="+this._type+",  obj="+obj._type);
            //}
            //else
            //{
            //    console.log("this="+this._type+",  obj="+obj);
            //}
            
            if(obj)
       		{
        		 if(this._GUIObject == null)
    			 {
	                 this._GUIObject = obj;
                     this._GUIObject.mouseEnter(evt, x, y);
                     this._GUIObject.mouseMove(evt, x, y);
    			 }
        		 else if(this._GUIObject && (obj !== this._GUIObject))
                 {
                     this._GUIObject.mouseExit(evt, x, y);
	                 this._GUIObject = obj;
                     this._GUIObject.mouseEnter(evt, x, y);
                     this._GUIObject.mouseMove(evt, x, y);
	             }
	             else if (this._GUIObject != null) this._GUIObject.mouseMove(evt, x, y);
       		}
        	else
    		{
                if(this._GUIObject != null)
                {
                    this._GUIObject.mouseExit(evt, x, y);
                    this._GUIObject = null;
                }
    		}
            //console.log('GUIOBJECT='+this._GUIObject);
        },
        
        mouseDoubleClick: function(evt, x, y)
        {
            var res = this.base(evt, x, y);
            if (res == false && this._GUIObject != null)
                res = this._GUIObject.mouseDoubleClick(evt, x, y);
            return (res);
        },
        keyDown: function(evt, key)
        {
            var res = this.base(evt, key);
            if (res == false && this._GUIObject != null)
                res = this._GUIObject.keyDown(evt, key);
            return (res);
        },

        hide: function()
        {
        	this.base();
        	for(var i = 0; i < this._Shapes.length; i++)
        		this._Shapes[i].hide();
        },
        show: function()
        {
        	this.base();
        	for(var i = 0; i < this._Shapes.length; i++)
        		this._Shapes[i].show();
        },

        draw: function()
        {
            this.base();
            for(var i = 0; i < this._Shapes.length; i++)
            {
                this._Shapes[i].draw();
            }
        },
        
        getGUIObject: function(x, y)
        {   
        	return WAC.anno.wacUtil.getGUIObject(this, x, y);
        }},
     {});
     
     
    WAC.anno.wacCmd_AddObject = WAC.anno.wacCommand.extend({
        constructor: function(id, obj)
        {
            this.base('wacCmd_AddObject', id);
            this.obj = obj;
        },
        applyCmd: function(gobj)
        {
            gobj.add(this.obj);
        }}, 
    {});

    WAC.anno.wacCmd_RemoveObject = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_RemoveObject', arguments[0].objID); //id of container
                this.obj_id = arguments[0].obj_id; //id of the object to be removed
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_RemoveObject', arguments[0]);
                this.obj_id = arguments[1];
            }
            else
            {
                throw "Error:  wrong number of arguments for wacCmd_RemoveObject(should be 2)";
            }
        },
        applyCmd: function(gobj)
        {
            var obj = gobj.findObjectByID(this.obj_id);
            obj.remove();
        }}, 
    {});
})(this);