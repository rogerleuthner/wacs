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

    if (WAC.anno.wacContainerObject)
    {
        console.warn('WAC.anno.wacContainerObject is already defined');
        return;
    }

    WAC.anno.wacContainerObject = WAC.anno.wacCompositeObject.extend({
        constructor: function(id, ctx)
        {
            this.base(id, ctx);
            this._type = "WAC.anno.wacContainerObject";
            this._SelectedObjects = [];
            this._CurrentSlectedObject = null;
            this._GUIObject = null;
            this._newObject = null;
            this._x1 = -1;
            this._y1 = -1;
        },
        setNewObject: function(gobj)
        {
        	this._newObject = gobj;
        	this.add(this._newObject);
        },
        remove: function(obj)
        {
        	this.base(obj);
            for(var i = 0; i < this._SelectedObjects.length; i++)
            {
                if(this._SelectedObjects[i] === obj)
                {
                    this._SelectedObjects.splice(i, 1);
                }
            }
        },

        mouseDown: function(e, x, y)
        {
        	if(this._newObject !== null)
        	{
        		this._newObject.init(e, x, y);
        		this.draw();
        		this.mouseMove(e, x, y);
        		this._GUIObject = this._newObject;
        		this._GUIObject.mouseMove(e, x, y);
        		this._newObject = null;
        	}
            this._x1 = x;
            this._y1 = y;
            //console.log("wacContainer::MouseMove: _x1="+this._x1+",  y1="+this._y1);
            if (this._GUIObject !== null)
            {
                if (e.ctrlKey === true)
                    if (this._SelectedObjects.indexOf(this._GUIObject) !== -1)
                        this._CurrentSelectedObject = this._GUIObject;
                    else
                    {
                        this._SelectedObjects.push(this._GUIObject);
                        this._CurrentSelectedObject = null;
                    }
                else
                {
                    if (this._SelectedObjects.indexOf(this._GUIObject) !== -1)
                        this._CurrentSelectedObject = this._GUIObject;
                    else
                    {
                        this._CurrentSelectedObject = null;
                        this._SelectedObjects = [];
                        if (this._GUIObject != null)
                            this._SelectedObjects.push(this._GUIObject);
                    }
                }
            }
            else if (e.ctrlKey === false)
            {
                this._SelectedObjects = [];
                this._CurrentSelectedObject = null;
            }

            if (this._GUIObject !== null)
            {
                //this.remove(this._GUIObject);
                //this.add(this._GUIObject);
                return this._GUIObject.mouseDown(e, x, y);
            }
            return false; //this.super.mouseDown(e, x, y);
        },

        mouseDrag: function(evt, x, y)
        {
        	//console.log("x="+x+", y="+y);
            var me_x = this.getMouseX(evt);
            var me_y = this.getMouseY(evt);
            
            if(this._SelectedObjects.length === 1)
            {
            	//console.log("me_x="+me_x+", me_y="+me_y);
                var res = this._SelectedObjects[0].mouseDrag(evt, me_x, me_y);
                if(res === false)
                {
                    var dx = me_x - this._x1;
                    var dy = me_y - this._y1;
                    this.moveSelectedObjects(evt, dx, dy);
                    if(this._SelectedObjects[0]._type === 'WAC.anno.wacRect')
                    {
                    	//this.sendCommand(new WAC.anno.wacCmd_MoveRect(this._SelectedObjects[0].getID(), dx, dy));
                    }
                    else if(this._SelectedObjects[0]._type === 'WAC.anno.wacLine')
                    {
                        //this.sendCommand(new WAC.anno.wacCmd_MoveLine(this._SelectedObjects[0].getID(), dx, dy, dx, dy));
                    }
                    else if(this._SelectedObjects[0]._type === 'WAC.anno.wacFreeHand')
                        this.sendCommand(new WAC.anno.wacCmd_MoveFreeHand(this._SelectedObjects[0].getID(), dx, dy));
                    else if(this._SelectedObjects[0]._type === 'WAC.anno.wacNote')
                        this.sendCommand(new WAC.anno.wacCmd_MoveRect(this._SelectedObjects[0].getID(), dx, dy));
                    this._x1 = me_x;
                    this._y1 = me_y;
                }
            }
            else
            {
                this.moveSelectedObjects(evt, me_x - this._x1, me_y - this._y1);
                this._x1 = me_x;
                this._y1 = me_y;
            }
        },
        mouseUp: function(e, x, y)
        {
            if (this._GUIObject !== null)
            {
                if (e.ctrlKey === true)
                {
                    if ((this._GUIObject === this._CurrentSelectedObject) && (this._CurrentSelectedObject !== null)
                            &&  (this._SelectedObjects !== null) && (this._SelectedObjects.indexOf(this._CurrentSelectedObject) !== -1))
                    {
                        if ((Math.abs(x - this._x1) < 3) && (Math.abs(y - this._y1) < 3))
                            this._SelectedObjects.splice(this._SelectedObjects.indexOf(this._CurrentSelectedObject), 1);
                        //alignToGrid();
                    }
                }
                else
                {
                    if ((Math.abs(x - this._x1) < 3) && (Math.abs(y - this._y1) < 3))
                    {
                        this._SelectedObjects = [];
                        if (this._GUIObject != null)
                            this._SelectedObjects.push(this._GUIObject);
                    }
                    //alignToGrid();
                }
            }

            this._CurrentSelectedObject = null;

            if (this._GUIObject !== null)
            {
                //this.remove(this._GUIObject);
                //this.add(this._GUIObject);
                return this._GUIObject.mouseUp(e, x, y);
            }
            return false; //this.super.mouseDown(e, x, y);
        },
        mouseMove: function(evt, x, y)
        {
            var res = (this._newObject === null) ? this.base(evt, x, y) : false;
            return res;
        },

        moveSelectedObjects: function(e, dx, dy)
        {
            for(var i = 0; i < this._SelectedObjects.length; i++)
            {
                this._SelectedObjects[i].move(e, dx, dy);
            }
        }},
    {});
})(this);