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

  var wsapi;

    if (WAC.anno.wacCanvas)
    {
        console.warn('WAC.anno.wacCanvas is already defined');
        return;
    }

    WAC.anno.wacCanvas = function (canvas)
    {
        this.type = "WAC.anno.wacCanvas";
        this.canvas = canvas;
        var cvs = canvas;

        this.canvas.self = this;
		if(this.canvas.getContext)
		{
		    this.ctx = this.canvas.getContext("2d");
	        this.canvas.onmousedown = function(evt)
	        {
	            this.self.onMouseDown(evt);
	        };
	        this.canvas.onmousemove = function(evt)
	        {
	            this.self.onMouseMove(evt);
	        };
	        this.canvas.onmouseup = function(evt)
	        {
	            this.self.onMouseUp(evt);
	        };
	        this.canvas.onclick = function(evt)
	        {
	            this.self.onMouseUp(evt);
	        };
	        this.canvas.ondblclick = function(evt)
	        {
	        	this.self.onLeftMouseDoubleClick(evt);
	        };
	        this.canvas.oncontextmenu = function(evt)
	        {
	            this.self.onContextMenu(evt);
	            return false;
	        };
		}
		else
		{
		    this.ctx = this.canvas;
		}
        this._Object = new WAC.anno.wacContainerObject(0, this.ctx);
        this._isMousePressed  = false;
        this.__objectID = 1;
		this._scaleFactorX = 1;
		this._scaleFactorY = 1;
		this._rightClickX = null;
		this._rightClickY = null;
        this.menus = {};
        this.menu_displayed = false;
        this.getUniqueObjectID = function()
        {
        	this.getLargestObjectID(this._Object);
            return(this.__objectID++);
        };

        this.getLargestObjectID = function(obj)
        {
        	if((obj === undefined) || (obj === null))
        		return;
        	if(obj._ID >= this.__objectID)
        		this.__objectID = obj._ID+1;
        	if((obj._Shapes !== undefined) && (obj._Shapes !== null))
    		{
        		for(var i = 0; i < obj._Shapes.length; i++)
        		{
        			this.getLargestObjectID(obj._Shapes[i]);
        		}
    		}
        }
        this.onContextMenu = function(evt)
        {
    		this._rightClickX = this._getMouseX(evt);
    		this._rightClickY = this._getMouseY(evt);

            if(this._Object._GUIObject !== null)
            {
                this.displayMenu(this._Object._GUIObject._type, evt);
                //this._Object._GUIObject.canvas.style.cursor = 'auto';
            }
            else
                this.displayMenu("WAC.anno.wacCanvas", evt);
        };

        this.displayMenu=function(menu_name, evt)
        {
            var mn = this.menus[menu_name];
            if(mn === undefined || mn === null)
            	return;

            this.menu_displayed = true;
            if(this.canvas.getContext)
            {
            	this.menus[menu_name].Display(evt);
            }
            else
            {
            	this.menus[menu_name].Display(evt);
            }
        };

        this._getMouseX = function(evt)
        {
            return WAC.anno.wacUtil.getMouseX(evt);
        };

        this._getMouseY = function(evt)
        {
            return WAC.anno.wacUtil.getMouseY(evt);
        };

        this.hideMenus = function()
        {
            this.menu_displayed = false;
        	for(var menu in this.menus)
        		if(this.menus.hasOwnProperty(menu))
        			this.menus[menu].Hide();
        }
        this.onMouseDown = function(evt)
        {
        	var m_d = this.menu_displayed;
        	this.hideMenus();
            if((evt.which !== undefined && evt.which === 1) ||
               this.canvas.scene)
            {
                var x = this._getMouseX(evt);
                var y = this._getMouseY(evt);
                if(x && y)
                {
	                this._isMousePressed = true;
	                if(m_d)
	                {
		                var obj = this._Object.getGUIObject(x, y);
		                if((obj === undefined) || (obj === null))
		            	{
		                	if(this._Object._GUIObject !== null)
		                		this._Object._GUIObject.canvas.style.cursor = 'auto';
		                	this._Object._GUIObject = null;
		                    this._Object._CurrentSelectedObject = null;
		                    this._Object._SelectedObjects = [];
		                    return;
		            	}
	                }
	                this._Object.mouseDown(evt, x, y);
                }
            }
            if(this._Object._GUIObject !== null)
        	{
            	//prevents globe from rotating when we are dragging an object
            	if(this.canvas.scene)
            		this.canvas.scene.screenSpaceCameraController.enableInputs = false;
        	}
        };

        this.onMouseMove = function(evt)
        {
        	if(this.menu_displayed === true)
        		return;
        	var me_x = this._getMouseX(evt);
        	var me_y = this._getMouseY(evt);
            if(me_x === undefined || me_y === undefined)
            {
            	return;
            }
        	var me_x1 = this._getMouseX(evt);
        	var me_y1 = this._getMouseY(evt);

            if(this._isMousePressed)
            {
            	var pos={x:me_x, y:me_y};
                if(this._Object._GUIObject !== null)  //draw lasso
                {
                    this._Object.mouseDrag(evt, me_x, me_y);
                    //console.log("here");
                }
                else
                {
/*                	if(this.canvas.scene)
                	{
                		if(this.canvas.scene.screenSpaceCameraController.enableInputs === false)
            			{
                            //this._Object.mouseMove(evt, me_x, me_y);
                            //this._Object.mouseDown(evt, me_x, me_y);
                            console.log("GUIOBJECT="+this._Object._GUIObject);
                            if(this._Object._GUIObject !== null)  //draw lasso
                            {
                                this._Object.mouseDrag(evt, me_x, me_y);
                            }
            			};
                	}*/
                }
                if(this.ctx.clearRect)
                {
                    var target = evt.target || evt.srcElement;
                    if(target)
                    {
                        var rect = target.getBoundingClientRect();
                        this.ctx.clearRect(rect.left, rect.top, (rect.width+window.scrollX)/this._scaleFactorX, (rect.height+window.scrollY)/this._scaleFactorY);
                    }
                }
                //console.log("redrawing object");
                this._Object.draw(this.ctx);
            }
            else
            {
                this._Object.mouseMove(evt, me_x, me_y);
            }
        };

        this.onMouseUp = function(evt)
        {
            var me_x = this._getMouseX(evt);
            var me_y = this._getMouseY(evt);
            if(me_x === undefined || me_y === undefined)
            {
            	return;
            }

            if((evt.which != undefined && evt.which == 1) || this.canvas.scene)
            {
                if(this._isMousePressed && this._Object._GUIObject === null)
                {
                }
                else
                {
                    this._Object.mouseUp(evt, me_x, me_y);
                }
                this._isMousePressed = false;
            }
            else
            {
                this._Object.mouseUp(evt, me_x, me_y);
            }

            this.redraw();

            if(this._Object._GUIObject !== null)
        	{
            	//allows globe to rotating when we are dragging
            	if(this.canvas.scene)
            		this.canvas.scene.screenSpaceCameraController.enableInputs = true;
        	}
        };

        this.onLeftMouseDoubleClick= function(evt)
        {
        	var me_x = this._getMouseX(evt);
        	var me_y = this._getMouseY(evt);
            if(me_x === undefined || me_y === undefined)
            {
            	return;
            }

        	if(this._Object._GUIObject !== null)
        	{
        		this._Object._GUIObject.mouseDoubleClick(evt, me_x, me_y);
        	}
        };

        this.sendCommand = function(cmd)
        {
            this.wsapi.publish(cmd);
        };

        this.receiveCommand = function(cmd_obj)
        {
        	if(cmd_obj === undefined)
        		return;
        	if(cmd_obj === null)
        		return;

        	//console.log(cmd_obj);

            var new_cmd = new WAC.anno[cmd_obj.cmdType](cmd_obj);
            new_cmd.apply(this);

            this.redraw()
        };

        this.redraw = function()
        {
//            if(this.ctx.clearRect)
//            {
//                var target = evt.target || evt.srcElement;
//                if(target)
//                {
//                	var rect = target.getBoundingClientRect();
//                	this.ctx.clearRect(rect.left, rect.top, rect.width, rect.height);
//                }
//            }
//            this._Object.draw(this.ctx);

            if(this.canvas.getContext)
        		this.ctx.clearRect(this.canvas.clientLeft, this.canvas.clientTop, this.canvas.clientWidth/this._scaleFactorX, this.canvas.clientHeight/this._scaleFactorY);
            this._Object.draw(this.ctx);
            //var objectsData = this.saveObjects();
            //console.log(objectsData);
        };

        this.clear= function()
        {
        	for(var i = this._Object._Shapes.length-1; i >= 0; i--)
        	{
        		if(this._Object._Shapes[i]._annotationObject === true)
        			this._Object._Shapes[i].remove();
        	}
        	this.sendCommand(new WAC.anno.wacCmd_Clear(this._Object.getID()));
        }

        this.testSaveRestoreObjects = function()
        {
    		var objectData = this.saveObjects();

    		var str = JSON.stringify(objectData);
    		console.log(str);
    		objectData = JSON.parse(str);
    		console.log(objectData);
    		this.restoreObjects(objectData, true);
        }

        this.saveObjects = function()
        {
    		var objectData = [];
    		for(var i = 0; i < this._Object._Shapes.length; i++)
    		{
    			objectData[i] =
    				WAC.anno.wacUtil.applyExtraFormatting(this._Object._Shapes[i].getObjectData(), this.ctx);
    		}

    		return objectData;
        }
        this.restoreObjects = function(objectData, generate_new_ids)
        {
        	//console.log(objectData);
    		for(var i = 0; i < objectData.length; i++)
    		{
    			objectData[i] = WAC.anno.wacUtil.unapplyExtraFormatting(objectData[i], this.ctx);
    			var obj_type = objectData[i].type;
    			var gobj = null;
    			if(generate_new_ids)
    				gobj = eval("new "+obj_type+"("+this.getUniqueObjectID()+", null, null, null, null, null);");
    			else
    				gobj = eval("new "+obj_type+"("+objectData[i].id+", null, null, null, null, null);");

    			gobj._ctx = this.ctx;
    			gobj.canvas =  WAC.anno.wacUtil.getCanvas(this.ctx);
    			gobj.initMenus();
    			gobj.restoreFromData(objectData[i]);
    			this._Object.add(gobj);
    			//gobj.hide(); // hide them or else they show up before anno layer turned on
    		}
        }
        this.sendObjectsData = function()
        {
        	var data = this.saveObjects();
        	//console.log(data);
        	//this.sendCommand(new WAC.anno.wacCmd_SendObjectsData(this._Object.getID(), data));
        }
    };

    WAC.anno.wacCmd_Clear = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_Clear', arguments[0].objID);
            }
            else if(arguments.length == 1)
            {
                this.base('wacCmd_Clear', arguments[0]);
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_Clear(should be 1)";
            }
        },
        applyCmd: function(gobj)
        {
        	var wac_canvas = WAC.anno.wacUtil.get_wacCanvas(gobj);
        	for(var i = wac_canvas._Object._Shapes.length-1; i >= 0; i--)
        	{
        		if(wac_canvas._Object._Shapes[i]._annotationObject === true)
            		wac_canvas._Object._Shapes[i].remove();
        	}

        }},
    {});

    WAC.anno.wacCmd_SendObjectsData = WAC.anno.wacCommand.extend({
        constructor: function()
        {
            if((arguments.length == 1) && (typeof arguments[0] === 'object'))
            {
                this.base('wacCmd_SendObjectsData', arguments[0].objID);
                this.data = arguments[0].data;
            }
            else if(arguments.length == 2)
            {
                this.base('wacCmd_SendObjectsData', arguments[0]);
                this.data = arguments[1];
            }
            else
            {
                throw "Error:  wrong number of arguments for WAC.anno.wacCmd_Clear(should be 1)";
            }
        },
        applyCmd: function(gobj)
        {
        	var wac_canvas = WAC.anno.wacUtil.get_wacCanvas(gobj);
        	wac_canvas.restoreObjects(this.data);
        }},
    {});

})(this);