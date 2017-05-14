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

var WAC = WAC || (WAC = { });
WAC.anno = WAC.anno || { };

if (WAC.anno.wacUtil)
{
    console.warn('WAC.anno.wacCommand is already defined');
}

WAC.anno.wacUtil =  (function() 
{
	function get_wacCanvas(gobj)
	{
		return gobj.canvas.self;
	}

    function inside(obj, x, y)
    {
        var res = false;
        if (!obj.isVisible())
            return (false);
            
        if(obj._Shapes)
        {
	        for (var i = 0; i < obj._Shapes.length; i++)
	            if (obj._Shapes[i].inside(x, y))
	                return true;
        }
        else
    	{
        	res = obj.inside(x, y);
    	}
        return (res);
    }

    function getGUIObject(composite_obj, x, y)
    {
    	var obj=null;
    	
    	if(composite_obj._Shapes)
    	{
	        for (var i = composite_obj._Shapes.length - 1; i >= 0; i--)
	        {
	            var obj1 = composite_obj._Shapes[i];
	            if ((inside(obj1, x, y) == true)/* && obj1.isActive()*/)
	                obj = obj1;
	            if (obj != null) break;
	        }
    	}
        if ((obj == null) && composite_obj.inside && (composite_obj.inside(x, y) == true))
            obj = composite_obj;
        
        return (obj);
    }

    function getMouseX(evt)
    {
        var target = evt.target || evt.srcElement;
        var rect = target.getBoundingClientRect();
        var mouseX = (evt.clientX - rect.left)/target.self._scaleFactorX;
        return mouseX;
    }
    
    function getMouseY(evt)
    {
        var target = evt.target || evt.srcElement;
        var rect = target.getBoundingClientRect();
        var mouseY = (evt.clientY - rect.top)/target.self._scaleFactorY;
        return mouseY;
    }

    function getCanvas(ctx)
    {
    	return ctx.canvas;
    }
    
    //functions for the line object
    function moveLine(line, dx, dy)
    {
        line.x1 += dx;
        line.y1 += dy;
        line.x2 += dx;
        line.y2 += dy;
    }
    function setLineBeginPosition(line, x, y)
    {
        line.x1 = x;
        line.y1 = y;
    }
    function setLineEndPosition(line, x, y)
    {
        line.x2 = x;
        line.y2 = y;
    }

    function getLineVertices(line)
    {
    	return [{x:line.x1, y:line.y1}, {x:line.x2, y:line.y2}];
    }
    function drawLine(line)
    {
    	if((line.x1 === null) || (line.y1 === null) || (line.x2 === null) || (line.y2 === null))
    		return false;
    	
        line._ctx.strokeStyle = line._lineColor;
        line._ctx.fillStyle = line._lineColor;
        line._ctx.translate(line.x1, line.y1);
        var angle = Math.atan2(line.y2-line.y1, line.x2-line.x1);
        line._ctx.rotate(angle);
        var length = Math.sqrt((line.y2-line.y1)*(line.y2-line.y1) + (line.x2-line.x1)*(line.x2-line.x1));
        var arrowLength = line.hasArrow ? 10.0:0;
        
        line._ctx.beginPath();
        line._ctx.moveTo(0, 0);
        line._ctx.lineTo(length-arrowLength, 0);
        line._ctx.lineWidth = line._lineWidth;
        line._ctx.closePath();
        line._ctx.stroke();

        if(line.hasArrow)
        {
            var arrowRatio = 0.5;

            var endX = length;
            var waisting = 0.5;
            var waistX = endX - arrowLength * 0.5;
            var waistY = arrowRatio * arrowLength * 0.5 * waisting;
            var arrowWidth = arrowRatio * arrowLength;
            var veeX = endX - line._lineWidth * 0.5 / arrowRatio;

            line._ctx.beginPath();
            line._ctx.moveTo(veeX - arrowLength, -arrowWidth);
            line._ctx.quadraticCurveTo(waistX, -waistY, endX, 0.0);
            line._ctx.quadraticCurveTo(waistX, waistY, veeX - arrowLength, arrowWidth);
            // end of arrow is pinched in
            line._ctx.lineTo(veeX - arrowLength * 0.75, 0.0);
            line._ctx.lineTo(veeX - arrowLength, -arrowWidth);
            line._ctx.closePath();
            line._ctx.fill();
            line._ctx.lineWidth = line._lineWidth;;
            line._ctx.stroke();
        }
        line._ctx.rotate(-angle);
        line._ctx.translate(-line.x1, -line.y1);
    }
    
    function setLineColor(line, col)
    {
    	line._lineColor = col;
    }
    function hideLine(line)
    {
    	
    }
    function showLine(line)
    {
    	
    }
    function insideLine(line, x, y)
    {
    	if((line.x1 === null) || (line.y1 === null) || (line.x2 === null) || (line.y2 === null))
    		return false;
        return insideLineSegment(line, line.x1, line.y1, line.x2, line.y2, x, y);
    }

    function insideLineSegment(line, x1, y1, x2, y2, x, y)
    {
        if(!line.isVisible())
            return(false);
        
        /* First we check if the segment is almost vertical or almost horizontal and the mouse pointer is somewhere around. */
        if(((Math.abs(x1 - x2)< line.HOT_DISTANCE) && 
            (y < Math.max(y1, y2)) && (y > Math.min(y1, y2)) && 
            (Math.abs(x -(x1+x2)/2) < line.HOT_DISTANCE)) 
            ||
           ((Math.abs(y1- y2)< line.HOT_DISTANCE) && 
           (x < Math.max(x1, x2)) && (x > Math.min(x1, x2)) && 
           (Math.abs(y - y1) < line.HOT_DISTANCE)))
        {
            return(true);
        }
        else if((x <= Math.max(x1, x2)+line.HOT_DISTANCE) && 
                (x >= Math.min(x1, x2)-line.HOT_DISTANCE) && 
                (y <= Math.max(y1, y2)+line.HOT_DISTANCE) && 
                (y >= Math.min(y1, y2)-line.HOT_DISTANCE))
        {
            var d = (Math.abs((x-x1)*(y2-y1) -(y-y1)*(x2-x1))/ Math.sqrt(((y2-y1)*(y2-y1) +(x2-x1)*(x2-x1))));
            if(d < line.HOT_DISTANCE)
                return(true);
        }
        return(false);
    }

    function initNullLine(line, x, y)
    {
    	line.x1 = x-10;
    	line.y1 = y-10;
    	line.x2 = x;
    	line.y2 = y;
    }
    
    function initLine(line)
    {
    }

    function initNullRectangle(rect, x, y)
    {
    	rect._X = x-20;
    	rect._Y = y-20;
    	rect._W = 20;
    	rect._H = 20;
    }
    function initRectangle(rect)
    {
    }

    function insideRectangle(r, x, y)
    {
    	if((r._X === null) || (r._Y === null) || (r._W === null) || (r._H === null))
    		return false;
        var res = ((r._X <= x) && (r._Y <= y) && (r._X + r._W >= x) && (r._Y+r._H >= y));
        return res;
    }
    function hideRectangle(rect)
    {
    	
    }
    function showRectangle(rect)
    {
    	
    }
    function drawRectangle(r)
    {
    	if((r._X === null) || (r._Y === null) || (r._W === null) || (r._H === null))
    		return false;

    	if(!r._transparent)
        {
    		var fc = r._fillColor;
        	if(fc[0] === '#')
    		   fc = fc.substring(1);
	    	var c_r = parseInt(fc.substring(0, 2), 16);
	    	var c_g = parseInt(fc.substring(2, 4), 16);
	    	var c_b = parseInt(fc.substring(4, 6), 16);

            r._ctx.fillStyle = "rgba("+c_r+", "+c_g+", " + c_b+", "+r._opacity+")";
            r._ctx.fillRect(r._X, r._Y, r._W, r._H);
        }
        r._ctx.lineWidth = r._lineWidth;
        r._ctx.strokeStyle = r._lineColor;
        r._ctx.strokeRect(r._X, r._Y, r._W, r._H);
    }
    function getRectangleCoordinateNE(rect)
    {
    	return {x:rect._X+rect._W, y:rect._Y};
    }
    function getRectangleCoordinateNW(rect)
    {
    	return {x:rect._X, y:rect._Y};
    }
    function getRectangleCoordinateSE(rect)
    {
    	return {x:rect._X+rect._W, y:rect._Y+rect._H};
    }
    function getRectangleCoordinateSW(rect)
    {
    	return {x:rect._X, y:rect._Y+rect._H};
    }

    function moveRect(rect, dx, dy)
    {
        rect._X += dx;
        rect._Y += dy;
    }
    function setRectPositionNE(rect, x, y)
    {
    }
    function setRectPositionNW(rect, x, y)
    {
    }
    function setRectPositionSE(rect, x, y)
    {
    }
    function setRectPositionSW(rect, x, y)
    {
    }

    function moveRectVertexNE(rect, dx, dy)
    {
    	if((rect._W + dx < 10) && (rect._H - dy < 10))
    		return true;

    	if(rect._W + dx < 10)
    		dx = 0;
    	if(rect._H - dy < 10)
    		dy = 0;

    	rect._x1 += dx;
        rect._y1 += dy;
    	          	
        rect._W += dx;
        rect._Y += dy;
        rect._H -= dy;
        
        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        
        //console.log("rect(NE): [ x="+rect._X+", y="+rect._Y+", w="+rect._W+", h="+rect._H+"]");
        return true;
    }
    function moveRectVertexNW(rect, dx, dy)
    {
    	if((rect._W - dx < 10) && (rect._H - dy < 10))
    		return true;

    	if(rect._W - dx < 10)
    		dx = 0;
    	if(rect._H - dy < 10)
    		dy = 0;
    	
    	rect._x1 += dx;
        rect._y1 += dy;
    	
        rect._X += dx;
        rect._Y += dy;
        rect._W -= dx;
        rect._H -= dy;

        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        
        //console.log("rect(NW): [ x="+rect._X+", y="+rect._Y+", w="+rect._W+", h="+rect._H+"]");
        return true;
    }
    function moveRectVertexSE(rect, dx, dy)
    {
    	if((rect._W + dx < 10) && (rect._H + dy < 10))
    		return true;

    	if(rect._W + dx < 10)
    		dx = 0;
    	if(rect._H + dy < 10)
    		dy = 0;

    	rect._x1 += dx;
        rect._y1 += dy;
    	          	
    	rect._W += dx;
        rect._H += dy;
        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        //console.log("rect(SE): [ x="+rect._X+", y="+rect._Y+", w="+rect._W+", h="+rect._H+"]");
        return true;
    }
    function moveRectVertexSW(rect, dx, dy)
    {
       	if((rect._W - dx < 10) && (rect._H + dy < 10))
    		return true;

    	if(rect._W - dx < 10)
    		dx = 0;
    	if(rect._H + dy < 10)
    		dy = 0;
    	
    	rect._x1 += dx;
        rect._y1 += dy;
    	
        rect._X += dx;
        rect._W -= dx;
        
    	rect._H += dy;
        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        //console.log("rect(SW): [ x="+rect._X+", y="+rect._Y+", w="+rect._W+", h="+rect._H+"]");
        return true;
    }

    function moveRectSideN(rect, dx, dy)
    {
    	if(rect._H - dy < 10)
    		return true;

    	rect._x1 += dx;
        rect._y1 += dy;
    	          	
        rect._Y += dy;
        rect._H -= dy;
        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        return true;
    }
    function moveRectSideW(rect, dx, dy)
    {
    	if(rect._W - dx < 10)
    		return true;
    	rect._x1 += dx;
        rect._y1 += dy;
    	          	
        rect._X += dx;
        rect._W -= dx;
        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        return true;
    }
    function moveRectSideS(rect, dx, dy)
    {
    	if(me_y - rect._Y < 10)
    		return true;
    	
    	rect._x1 += dx;
        rect._y1 += dy;
    	          	
        rect._H += dy;
        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        return true;
    }
    function moveRectSideE(rect, dx, dy)
    {
    	if(me_x - rect._X < 10)
    		return true;
    	rect._x1 += dx;
        rect._y1 += dy;
    	          	
        rect._W += dx;
        rect.sendCommand(new WAC.anno.wacCmd_SetRectPositions(rect.getID(), rect._X, rect._Y, 
        		rect._X+rect._W, rect._Y+rect._H));
        return true;
    }

    function setLineGetPositionsCallback(line)
    {
    }
    function removeLineGetPositionsCallback(line)
    {
    }
    function setRectCoordinatesCallback(rect)
    {
    }
    function removeRectCoordinatesCallback(rect)
    {
    }
    
    function setLineWidth(line, wid)
    {
    	line._lineWidth = wid;
    }
    function setPropertyColor(gobj, propName, value)
    {
        if(value[0] === '#')
        	gobj[propName] = value;
        else
        	gobj[propName] = '#' + value;
    }

    function setArrowOnOff(line)
    {
    	line.hasArrow = !line.hasArrow;
    }
    function removeLine(line)
    {
    	line._parentObject.remove(line);
    }
    function removeRectangle(rect)
    {
    	rect._parentObject.remove(rect);
    }
    
	function getLineData(line, result)
	{
		result.x1 = line.x1;
		result.y1 = line.y1;
		result.x2 = line.x2;
		result.y2 = line.y2;
		return result;
	}
	
	function setLineData(line, data)
	{
		line.x1 = data.x1;
		line.y1 = data.y1;
		line.x2 = data.x2;
		line.y2 = data.y2;
	}
	
	function getRectangleData(rect, result)
	{
		result.x=rect._X; 
		result.y=rect._Y;
		result.w=rect._W;
		result.h=rect._H;
		return result;
	}
	
	function setRectangleData(rect, data)
	{
		rect._X = data.x; 
		rect._Y = data.y;
		rect._W = data.w;
		rect._H = data.h;
	}
	
	function setAltitude(gobj, altitude)
    {
    }
	function setOpacity(gobj, opacity)
    {
    }

	function setLineHasArrow(gobj, hasArrow)
	{
		gobj.hasArrow = hasArrow;
	}

	function setText(gobj, txt)
	{
        gobj.setText(txt);
	}
	
	function applyExtraFormatting(gobj_data)
	{
		return gobj_data;
	}
	
	function unapplyExtraFormatting(gobj_data)
	{
		return gobj_data;
	}

	return {
		get_wacCanvas:get_wacCanvas,
		inside:inside,
		getGUIObject:getGUIObject,
		getMouseX:getMouseX,
		getMouseY:getMouseY,
		getCanvas:getCanvas,
		moveLine:moveLine,
		setLineBeginPosition:setLineBeginPosition,
		setLineEndPosition:setLineEndPosition,
		getLineVertices:getLineVertices,
		hideLine:hideLine,
		showLine:showLine,
	    drawLine:drawLine,
	    setLineColor:setLineColor,
	    insideLine:insideLine,
	    insideLineSegment:insideLineSegment,
	    initLine:initLine,
	    initRectangle:initRectangle,
	    insideRectangle:insideRectangle,
		hideRectangle:hideRectangle,
		showRectangle:showRectangle,
	    drawRectangle:drawRectangle,
	    getRectangleCoordinateNE:getRectangleCoordinateNE,
	    getRectangleCoordinateNW:getRectangleCoordinateNW,
	    getRectangleCoordinateSE:getRectangleCoordinateSE,
	    getRectangleCoordinateSW:getRectangleCoordinateSW,
	    moveRect:moveRect,
	    setRectPositionNE:setRectPositionNE,
	    setRectPositionNW:setRectPositionNW,
	    setRectPositionSE:setRectPositionSE,
	    setRectPositionSW:setRectPositionSW,
	    moveRectVertexNE:moveRectVertexNE,
	    moveRectVertexNW:moveRectVertexNW,
	    moveRectVertexSE:moveRectVertexSE,
	    moveRectVertexSW:moveRectVertexSW,
	    moveRectSideN:moveRectSideN,
	    moveRectSideW:moveRectSideW,
	    moveRectSideS:moveRectSideS,
	    moveRectSideE:moveRectSideE,
	    setLineGetPositionsCallback:setLineGetPositionsCallback,
	    removeLineGetPositionsCallback:removeLineGetPositionsCallback,
	    setRectCoordinatesCallback:setRectCoordinatesCallback,
	    removeRectCoordinatesCallback:removeRectCoordinatesCallback,
	    initNullLine:initNullLine,
	    initNullRectangle:initNullRectangle,
	    setLineWidth:setLineWidth,
	    setArrowOnOff:setArrowOnOff,
	    setPropertyColor:setPropertyColor,
	    removeLine:removeLine,
	    removeRectangle:removeRectangle,
	    getLineData:getLineData,
	    setLineData:setLineData,
	    getRectangleData:getRectangleData,
	    setRectangleData:setRectangleData,
	    setAltitude:setAltitude,
	    setOpacity:setOpacity,
	    setLineHasArrow:setLineHasArrow,
	    setText:setText,
	    applyExtraFormatting:applyExtraFormatting,
	    unapplyExtraFormatting:unapplyExtraFormatting
	};

})();