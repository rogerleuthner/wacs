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

    if (WAC.anno.wacCommand)
    {
        console.warn('WAC.anno.wacCommand is already defined');
        return;
    }

    WAC.anno.wacCommand = Base.extend({
        constructor: function(cmd_type, obj_id)
        {
            this.cmdType = cmd_type;
            this.objID = obj_id;
        },
        apply: function(tcanvas)
        {
            var gobj = (this.objID === tcanvas._Object.getID()) ? tcanvas._Object : tcanvas._Object.findObjectByID(this.objID);
            this.applyCmd(gobj);
        },
        applyCmd: function(gobj)
        {
        }},
    {});
})(this);
