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

'use strict';

var WAC = WAC || {};

WAC.anno = WAC.anno || { };

WAC.anno.dialogs = WAC.anno.dialogs || { };

WAC.anno.dialogs = (function()
{
	var wac_canvas = null;
	var gobject = null;

	    function createCanvasObject()
		{
			var cnv = document.createElement("canvas");
			cnv.setAttribute("id", "waccanvas");
			cnv.setAttribute("class", "coveringCanvas");
			cnv.style.width  = "90%";
			cnv.style.height = "90%";
			document.body.appendChild(cnv);
		};

	    function createEditTextDialog()
		{
			var div1 = document.createElement("div");
			div1.setAttribute("id", "overlayEditText");
			div1.setAttribute("class", "overlay");
			document.body.appendChild(div1);

			var div2 = document.createElement("div");
			div2.setAttribute("id", "divEditText");
			div2.setAttribute("class", "overlayDivEdit");
			div1.appendChild(div2);

			var form1 = document.createElement("div");
			form1.setAttribute("id", "formEditText");
			form1.setAttribute("class", "overlayForm");
			div2.appendChild(form1);

			var ta1 = document.createElement("textarea");
			ta1.setAttribute("id", "inputTextArea");
			ta1.style.width  = "200px";
			ta1.style.height = "100px";
			ta1.value = "some text";
			form1.appendChild(ta1);

			form1.appendChild(document.createElement("br"));

			var inp1 = document.createElement("button");
			inp1.setAttribute("id", "buttonEditTextOK");
			inp1.setAttribute("class", "btn btn-primary");
			inp1.value = "OK";
			inp1.appendChild(document.createTextNode("OK"));
			inp1.onclick = function(evt)
	        {
	            var overlay = document.getElementById("overlayEditText");
	            var field =  document.getElementById("inputTextArea");

	            WAC.anno.wacUtil.setText(gobject, field.value);
	            overlay.style.visibility = 'hidden';
	       	    wac_canvas.redraw();

	            var cmd = new WAC.anno.wacCmd_SetText(gobject.getID(), field.value);
	            wac_canvas.sendCommand(cmd);
	        };
			form1.appendChild(inp1);

			var inp2 = document.createElement("button");
			inp2.setAttribute("id", "buttonEditTextCancel");
			inp2.setAttribute("class", "btn btn-warning");
			inp2.value = "Cancel";
			inp2.appendChild(document.createTextNode("Cancel"));
			inp2.onclick =  function()
			{
				document.getElementById("overlayEditText").style.visibility = 'hidden';
			};

			form1.appendChild(inp2);
		};

        function displayEditTextDialog(wacCanvas, gobj, initial_value)
        {
        	wac_canvas = wacCanvas;
        	gobject = gobj;
            var overlay = document.getElementById("overlayEditText");
            var field =  document.getElementById("inputTextArea");
            field.focus();
            field.value = initial_value;
            overlay.style.visibility = 'visible';
        };

		function createEditFontDialog()
		{
			var div1 = document.createElement("div");
			div1.setAttribute("id", "overlayEditFont");
			div1.setAttribute("class", "overlay");
			document.body.appendChild(div1);

			var div2 = document.createElement("div");
			div2.setAttribute("id", "divEditFont");
			div2.setAttribute("class", "overlayDivFont");
			div1.appendChild(div2);

			var form1 = document.createElement("div");
			form1.setAttribute("id", "formEditFont");
			form1.setAttribute("class", "overlayForm");
			div2.appendChild(form1);

			var sel0 = document.createElement("select");
			sel0.setAttribute("name", "fontname");
			sel0.setAttribute("id", "inputFontFamily");
			form1.appendChild(sel0);

			var opt = document.createElement("option");
			opt.setAttribute("value", "sans-serif");
			opt.appendChild(document.createTextNode("sans-serif"));
			sel0.appendChild(opt);

			var opt0 = document.createElement("option");
			opt0.setAttribute("value", "Arial");
			opt0.appendChild(document.createTextNode("Arial"));
			sel0.appendChild(opt0);

			var opt1 = document.createElement("option");
			opt1.setAttribute("value", "Courier New");
			sel0.appendChild(opt1);
			opt1.appendChild(document.createTextNode("Courier New"));

			var opt2 = document.createElement("option");
			opt2.setAttribute("value", "Times New Roman");
			opt2.appendChild(document.createTextNode("Times New Roman"));
			sel0.appendChild(opt2);

			var opt3 = document.createElement("option");
			opt3.setAttribute("value", "Verdana");
			opt3.appendChild(document.createTextNode("Verdana"));
			sel0.appendChild(opt3);


			var sel1 = document.createElement("select");
			sel1.setAttribute("name", "fontsize");
			sel1.setAttribute("id", "inputFontSize");
			form1.appendChild(sel1);

			var opt0 = document.createElement("option");
			opt0.setAttribute("value", "10");
			opt0.appendChild(document.createTextNode("10"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "14");
			opt0.appendChild(document.createTextNode("14"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "20");
			opt0.appendChild(document.createTextNode("20"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "26");
			opt0.appendChild(document.createTextNode("26"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "32");
			opt0.appendChild(document.createTextNode("32"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "48");
			opt0.appendChild(document.createTextNode("48"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "64");
			opt0.appendChild(document.createTextNode("64"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "72");
			opt0.appendChild(document.createTextNode("72"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "86");
			opt0.appendChild(document.createTextNode("86"));
			sel1.appendChild(opt0);

			opt0 = document.createElement("option");
			opt0.setAttribute("value", "140");
			opt0.appendChild(document.createTextNode("140"));
			sel1.appendChild(opt0);


			var inp0 = document.createElement("input");
			inp0.setAttribute("type", "checkbox");
			inp0.setAttribute("id", "inputFontIsBold");
			inp0.setAttribute("name", "bold");
			inp0.setAttribute("value", "bold");
			form1.appendChild(inp0);
			form1.appendChild(document.createTextNode("bold"));

			var inp1 = document.createElement("input");
			inp1.setAttribute("type", "checkbox");
			inp1.setAttribute("id", "inputFontIsItalic");
			inp1.setAttribute("name", "italic");
			inp1.setAttribute("value", "italic");
			form1.appendChild(inp1);
			form1.appendChild(document.createTextNode("italic"));

			form1.appendChild(document.createElement("br"));

			var inp2 = document.createElement("button");
			inp2.setAttribute("id", "buttonEditFontOK");
			inp2.setAttribute("class", "btn btn-primary");
			inp2.value = "OK";
			inp2.appendChild(document.createTextNode("OK"));
			inp2.onclick = function(evt)
	        {
	            var overlay = document.getElementById("overlayEditFont");
	            var field =  document.getElementById("inputEditFont");
	            var cnv = document.getElementById("waccanvas");
	            var tcnv = cnv.self;
	            var inputFontFamily   = document.getElementById("inputFontFamily");
	            var inputFontSize     = document.getElementById("inputFontSize");
	            var inputFontIsBold   = document.getElementById("inputFontIsBold");
	            var inputFontIsItalic = document.getElementById("inputFontIsItalic");
	            tcnv._Object._GUIObject.fontFamily = document.getElementById("inputFontFamily").value;
	            tcnv._Object._GUIObject.fontSize   = document.getElementById("inputFontSize").value;
	            tcnv._Object._GUIObject.isBold   = document.getElementById("inputFontIsBold").checked;
	            tcnv._Object._GUIObject.isItalic = document.getElementById("inputFontIsItalic").checked;
	            tcnv._Object._GUIObject.computeSize();
	            overlay.style.visibility = 'hidden';

	            tcnv.ctx.clearRect(cnv.clientLeft, cnv.clientTop, cnv.clientWidth, cnv.clientHeight);
	            tcnv._Object.draw(tcnv.ctx);

	            var cmd = new WAC.anno.wacCmd_SetFont(tcnv._Object._GUIObject.getID(),
	                                         tcnv._Object._GUIObject.isItalic,
	                                         tcnv._Object._GUIObject.isBold,
	                                         tcnv._Object._GUIObject.fontSize,
	                                         tcnv._Object._GUIObject.fontFamily);
	            tcnv.sendCommand(cmd);
	        }

			form1.appendChild(inp2);

			var inp3 = document.createElement("button");
			inp3.setAttribute("id", "buttonEditFontCancel");
			inp3.setAttribute("class", "btn btn-warning");
			inp3.value = "Cancel";
			inp3.appendChild(document.createTextNode("Cancel"));
			inp3.onclick =  function()
            {
                document.getElementById("overlayEditFont").style.visibility = 'hidden';
            };
			form1.appendChild(inp3);

		};

        function displayEditFontDialog(gobj)
        {
            var overlay = document.getElementById("overlayEditFont");

            var inputFontFamily   = document.getElementById("inputFontFamily");
            var inputFontSize     = document.getElementById("inputFontSize");
            var inputFontIsBold   = document.getElementById("inputFontIsBold");
            var inputFontIsItalic = document.getElementById("inputFontIsItalic");

            inputFontFamily.value = gobj.fontFamily;
            inputFontSize.value = gobj.fontSize;
            inputFontIsBold.checked = gobj.isBold;
            inputFontIsItalic.checked = gobj.isItalic;

            overlay.style.visibility = 'visible';
        };


		function createEditLineWidthDialog()
		{
			var div1 = document.createElement("div");
			div1.setAttribute("id", "overlayEditLineWidth");
			div1.setAttribute("class", "overlay");
			document.body.appendChild(div1);

			var div2 = document.createElement("div");
			var div2 = document.createElement("div");
			div2.setAttribute("id", "divEditLineWidth");
			div2.setAttribute("class", "overlayDiv");
			div1.appendChild(div2);


			div2.appendChild(document.createTextNode("Select Line Width"));
			var inp0 = document.createElement("input");
			inp0.setAttribute("class", "slider");
			inp0.setAttribute("type", "range");
			inp0.setAttribute("id", "lineWidth");
			inp0.setAttribute("min", "1");
			inp0.setAttribute("max", "20");
			inp0.oninput=function(evt)
			{
	            var slider =  document.getElementById("lineWidth");
	            var outp =  document.getElementById("lineWidthId");
	            outp.value = slider.value;
			};
			div2.appendChild(inp0);


			var outp0 = document.createElement("input");
			outp0.setAttribute("type", "number");
			outp0.setAttribute("id", "lineWidthId");
			outp0.setAttribute("class", "numb");
			outp0.setAttribute("min", "1");
			outp0.setAttribute("max", "20");
			outp0.oninput=function(evt)
			{
	            var slider =  document.getElementById("lineWidth");
	            var outp =  document.getElementById("lineWidthId");
	            slider.value = outp.value;
	            outp.value = slider.value;
	        };
			div2.appendChild(outp0);
			div2.appendChild(document.createElement("br"));

			var inp1 = document.createElement("button");
			inp1.setAttribute("id", "buttonEditLineWidthOK");
			inp1.setAttribute("class", "btn btn-primary");
			inp1.value = "OK";
			inp1.appendChild(document.createTextNode("OK"));
			inp1.onclick=function(evt)
	        {
	            var overlay = document.getElementById("overlayEditLineWidth");
	            var slider =  document.getElementById("lineWidth");

	            WAC.anno.wacUtil.setLineWidth(gobject, slider.value);

	            overlay.style.visibility = 'hidden';
	            wac_canvas.redraw();

	            var cmd = new WAC.anno.wacCmd_SetLineWidth(gobject.getID(), slider.value);
	            wac_canvas.sendCommand(cmd);
	        };

			div2.appendChild(inp1);

			var inp2 = document.createElement("button");
			inp2.setAttribute("id", "buttonEditLineWidthCancel");
			inp2.setAttribute("class", "btn btn-warning");
			inp2.value = "Cancel";
			inp2.appendChild(document.createTextNode("Cancel"));
			inp2.onclick = function()
            {
                document.getElementById("overlayEditLineWidth").style.visibility = 'hidden';
            };
			div2.appendChild(inp2);

		};

        function displayEditLineWidthDialog(wacCanvas, gobj, initial_value)
        {
        	wac_canvas = wacCanvas;
        	gobject = gobj;
            var overlay = document.getElementById("overlayEditLineWidth");
            var slider =  document.getElementById("lineWidth");
            var outp =  document.getElementById("lineWidthId");
            slider.value = initial_value;
            outp.value = initial_value;
            overlay.style.visibility = 'visible';
        };

		function createEditColorDialog()
		{
			var div1 = document.createElement("div");
			div1.setAttribute("id", "overlayEditColor");
			div1.setAttribute("class", "overlay");
			document.body.appendChild(div1);

			var div2 = document.createElement("div");
			div2.setAttribute("id", "divEditColor");
			div2.setAttribute("class", "overlayDivColor");
			div1.appendChild(div2);

			div2.appendChild(document.createTextNode("Click to select color"));
			var inp0 = document.createElement("input");
			inp0.setAttribute("type", "color");
			inp0.setAttribute("class", "color");
			inp0.setAttribute("id", "inputEditColor");
			inp0.setAttribute("name", "favcolor");
			div2.appendChild(inp0);
			div2.appendChild(document.createElement("br"));
			div2.appendChild(document.createElement("br"));

			var inp1 = document.createElement("button");
			inp1.setAttribute("id", "buttonEditColorOK");
			inp1.setAttribute("class", "btn btn-primary");
			inp1.value = "OK";
			inp1.appendChild(document.createTextNode("OK"));
			inp1.onclick=function(evt)
	        {
	            var overlay = document.getElementById("overlayEditColor");
	            var field =  document.getElementById("inputEditColor");
	            var cnv = document.getElementById("waccanvas");
	            var button = evt.target;

	            WAC.anno.wacUtil.setPropertyColor(gobject, button.propName, field.value);

	            overlay.style.visibility = 'hidden';
	            wac_canvas.redraw();

	            var cmd = new WAC.anno.wacCmd_SetColor(gobject.getID(), button.propName, gobject[button.propName]);
	            wac_canvas.sendCommand(cmd);
	        };
			div2.appendChild(inp1);

			var inp2 = document.createElement("button");
			inp2.setAttribute("id", "buttonEditColorCancel");
			inp2.setAttribute("class", "btn btn-warning");
			inp2.value = "Cancel";
			inp2.appendChild(document.createTextNode("Cancel"));
			inp2.onclick = function()
            {
                document.getElementById("overlayEditColor").style.visibility = 'hidden';
            };
			div2.appendChild(inp2);

		};

        function displayEditColorDialog(wacCanvas, gobj, initial_value, propName)
        {
        	wac_canvas = wacCanvas;
        	gobject = gobj;
            var field =  document.getElementById("inputEditColor");
            if(initial_value[0] === '#')
                field.value = initial_value; //.substring(1);
            else
                field.value = '#' + initial_value;

            var buttonOK = document.getElementById('buttonEditColorOK');
            buttonOK.propName = propName;

            var overlay = document.getElementById("overlayEditColor");
            overlay.style.visibility = 'visible';
        };


		function createEditAltitudeDialog()
		{
			var div1 = document.createElement("div");
			div1.setAttribute("id", "overlayEditAltitude");
			div1.setAttribute("class", "overlay");
			document.body.appendChild(div1);

			var div2 = document.createElement("div");
			var div2 = document.createElement("div");
			div2.setAttribute("id", "divEditAltitude");
			div2.setAttribute("class", "overlayDiv");
			div1.appendChild(div2);


			div2.appendChild(document.createTextNode("Select Altitude (meters)"));
			var inp0 = document.createElement("input");
			inp0.setAttribute("type", "range");
			inp0.setAttribute("id", "lineAltitude");
			inp0.setAttribute("min", "0");
			inp0.setAttribute("max", "5000");
			inp0.setAttribute("class", "slider");
			inp0.oninput=function(evt)
			{
	            var slider =  document.getElementById("lineAltitude");
	            var outp =  document.getElementById("lineAltitudeValue");
	            outp.value = slider.value;
			};
			div2.appendChild(inp0);

//			var outp0 = document.createElement("output");
//			outp0.setAttribute("id", "lineAltitudeValue");
//			outp0.setAttribute("style", "text-align: center;");
//			div2.appendChild(outp0);
			var outp0 = document.createElement("input");
			outp0.setAttribute("type", "number");
			outp0.setAttribute("id", "lineAltitudeValue");
			outp0.setAttribute("min", "0");
			outp0.setAttribute("max", "5000");
			outp0.setAttribute("class", "numb");
			outp0.oninput=function(evt)
			{
	            var slider =  document.getElementById("lineAltitude");
	            var outp =  document.getElementById("lineAltitudeValue");
	            slider.value = outp.value;
	            outp.value = slider.value;
	        };
			div2.appendChild(outp0);
			div2.appendChild(document.createElement("br"));

			var inp1 = document.createElement("button");
			inp1.setAttribute("id", "buttonEditAltitudeOK");
			inp1.setAttribute("class", "btn btn-primary");
			inp1.value = "OK";
			inp1.appendChild(document.createTextNode("OK"));
			inp1.onclick=function(evt)
	        {
	            var overlay = document.getElementById("overlayEditAltitude");
	            var slider =  document.getElementById("lineAltitude");

	            WAC.anno.wacUtil.setAltitude(gobject, parseInt(slider.value));

	            overlay.style.visibility = 'hidden';
	            wac_canvas.redraw();

	            var cmd = new WAC.anno.wacCmd_SetAltitude(gobject.getID(), slider.value);
	            wac_canvas.sendCommand(cmd);
	        };

			div2.appendChild(inp1);

			var inp2 = document.createElement("button");
			inp2.setAttribute("id", "buttonEditAltitudeCancel");
			inp2.setAttribute("class", "btn btn-warning");
			inp2.value = "Cancel";
			inp2.appendChild(document.createTextNode("Cancel"));
			inp2.onclick = function()
            {
                document.getElementById("overlayEditAltitude").style.visibility = 'hidden';
            };
			div2.appendChild(inp2);

		};

        function displayEditAltitudeDialog(wacCanvas, gobj, initial_value)
        {
        	wac_canvas = wacCanvas;
        	gobject = gobj;
            var overlay = document.getElementById("overlayEditAltitude");
            var slider =  document.getElementById("lineAltitude");
            var outp =  document.getElementById("lineAltitudeValue");
            slider.value = initial_value;
            outp.value = initial_value;
            overlay.style.visibility = 'visible';
        };


		function createEditOpacityDialog()
		{
			var div1 = document.createElement("div");
			div1.setAttribute("id", "overlayEditOpacity");
			div1.setAttribute("class", "overlay");
			document.body.appendChild(div1);

			var div2 = document.createElement("div");
			var div2 = document.createElement("div");
			div2.setAttribute("id", "divEditOpacity");
			div2.setAttribute("class", "overlayDiv");
			div1.appendChild(div2);


			div2.appendChild(document.createTextNode("Select Opacity"));
			var inp0 = document.createElement("input");
			inp0.setAttribute("type", "range");
			inp0.setAttribute("id", "lineOpacity");
			inp0.setAttribute("min", "1");
			inp0.setAttribute("max", "255");
			inp0.setAttribute("class", "slider");
			inp0.oninput=function(evt)
			{
	            var slider =  document.getElementById("lineOpacity");
	            var outp =  document.getElementById("lineOpacityValue");
	            var v1 = Math.round(10000.0 * slider.value/255.0);
	            outp.value = v1/10000;
			};
			div2.appendChild(inp0);

			var outp0 = document.createElement("input");
			outp0.setAttribute("type", "number");
			outp0.setAttribute("id", "lineOpacityValue");
			outp0.setAttribute("min", "0.0");
			outp0.setAttribute("max", "1.0");
			outp0.setAttribute("class", "numb");
			outp0.oninput=function(evt)
			{
	            var slider =  document.getElementById("lineOpacity");
	            var outp =  document.getElementById("lineOpacityValue");
	            slider.value = outp.value*255.0;
	            var v1 = Math.round(outp.value*10000);

	            outp.value = v1/10000;
	        };
			div2.appendChild(outp0);
			div2.appendChild(document.createElement("br"));


			var inp1 = document.createElement("button");
			inp1.setAttribute("id", "buttonEditOpacityOK");
			inp1.setAttribute("class", "btn btn-primary");
			inp1.value = "OK";
			inp1.appendChild(document.createTextNode("OK"));
			inp1.onclick=function(evt)
	        {
	            var overlay = document.getElementById("overlayEditOpacity");
	            var slider =  document.getElementById("lineOpacity");

	            gobject.setOpacity(parseInt(slider.value)/255.0);

	            overlay.style.visibility = 'hidden';
	            wac_canvas.redraw();

	            var cmd = new WAC.anno.wacCmd_SetOpacity(gobject.getID(), gobject._opacity);
	            wac_canvas.sendCommand(cmd);
	        };

			div2.appendChild(inp1);

			var inp2 = document.createElement("button");
			inp2.setAttribute("id", "buttonEditOpacityCancel");
			inp2.setAttribute("class", "btn btn-warning");
			inp2.value = "Cancel";
			inp2.appendChild(document.createTextNode("Cancel"));
			inp2.onclick = function()
            {
                document.getElementById("overlayEditOpacity").style.visibility = 'hidden';
            };
			div2.appendChild(inp2);

		};

        function displayEditOpacityDialog(wacCanvas, gobj, initial_value)
        {
        	wac_canvas = wacCanvas;
        	gobject = gobj;
            var overlay = document.getElementById("overlayEditOpacity");
            var slider =  document.getElementById("lineOpacity");
            var outp =  document.getElementById("lineOpacityValue");
            slider.value = initial_value*255;
            outp.value = initial_value;
            overlay.style.visibility = 'visible';
        };

        return {
        	createEditTextDialog:createEditTextDialog,
        	displayEditTextDialog:displayEditTextDialog,
        	createEditFontDialog:createEditFontDialog,
        	displayEditFontDialog:displayEditFontDialog,
        	createEditLineWidthDialog:createEditLineWidthDialog,
        	displayEditLineWidthDialog:displayEditLineWidthDialog,
        	createEditColorDialog:createEditColorDialog,
        	displayEditColorDialog:displayEditColorDialog,
        	createEditAltitudeDialog:createEditAltitudeDialog,
        	createEditOpacityDialog:createEditOpacityDialog,
        	displayEditAltitudeDialog:displayEditAltitudeDialog,
        	displayEditOpacityDialog:displayEditOpacityDialog
        };
})();