Wildfly 10 has problems with concurrent websocket request or something after the first load; initializing the widgets fails, 
takes a long time or otherwise doesn't work right so backing off to wilfly 9.0.1 which doesn't manifest the problem
(test case: start a bunch of apps on OWF console, log in to the dashboard, ctrl-r refresh to reset all apps, apps
have problems initializing)

have a thumbnail in the 'accept graphic share' modal in viewer

fix the chat thing so that the attributed user appears before the text; replacing those balloons

should have the name of the picture being edited/viewed in the viewer superimposed in the lower left hand corner

request/release in doc editor interferes with editing

put zoom/pan controls on the GIS since mouse is flakey, with a view reset

slide show viewer with a single slide does not start the anno menu

add event emitting to GIS when action is performed

milsymbols app needs to be revamped - it's buggy as hell with a lot of unused code, particularly with respect to the old
mil sym set

GIS 'search box' for locations to zoom to

make it so that multiple consoles logged into from the same user on the same device either work right or are prohibited
add a check that the same user is logged in to all consoles if there is shared data (e.g. same browser manufacturer, or different
tabs).

standardize file/service naming in the wac-ext-owf project; all stuff referenced in the spring config files should be prefixed with
"WAC" ... or not ??

edit app does not save permanently or throw away edits on cancel

optimize app state message retrieval by stashing in local storage, and only retieving the stack from the server if the 
number of message stashed locally differs from a count returned from the server

email to designated users containing a link; user accounts are short term and the password is the channel name that is included 
in the email; the link contains the user/pass as link parameters, so that every time the user clicks on that link they are 
automatically logged in

convert all drop zones so that they accept desktop files

remove dotted line from outside of slide editor; make the drop zone look similar to other drop zones (maybe make all dropzones the entire f'n app)

channel/user editors need work; 1) integrate with OWF user create; 2) (as noted elsewhere) all 'alert' should be modals
3) need a lot of compacting and user workflow streamlining

version the generated annotation concatenated .js file

slideshow does not start up the annotation layer on the first page of a show, which is a real problem for single page presentations

						
figure out how to force caching of .js resources (especially the required OWF js and others)

perhaps use the includeScript() function to include the required stuff instead of coding it into every index.html
						
////////

Change dynamic menu to use document fragment for efficiency (window.document.getElementById('yourtargetelement').window.document.createDocumentFragment().appendChild( 'p' ))

activity monitor - history: controls on the bottom don't align all the time; might also want to make the layout more flexible (most apps)


/////////// activityMonitor

remove the 'select event show severity'; perhaps replace with a right click menu that allows
drilling into more into.
at the very least, convert it from an alert into a modal

/// INFRA

owf replace or upgrade?

/// ANNOTATE
touch screen friendly (right click menu is a problem)
performance bugs especially apparent in freehand
can kill browser performance by creating text areas with 50k
expand types: Annotator should work on .png etc.
bugs in transparency of text - has disappeared

/// SLIDE SHOW
all popup messages should be modal dialogs and not alerts (slideshow has some)
reset current state at refresh
slide viewer should take images directly crom the desktop as well
presenter needs to retain/respect state; late joiners don't work?
late joiners for slideshow don't get the currently published list or show

////// DOC EDIT
Doesn't scroll with longer documents

////////////////////////////////
unauthenticated upload vetting mechanism

input stream integration mechanism/specification (sensors, simulation streams of various kinds)

mobile: snapgrab, sms blast

message protocol encapsulation

filenames need work in the slide show convert; think it might be upper case suffix doesn't work?

need to be able to save the text of wac edit between sessions - write it to the database.

forms not working consistently ff/chrome
Chat header scrolls away.
need to choose amongst open forms
create entry point where channel id is on the url

rethink channel selector so that content can be removed from login page

drag into any receiver from desktop adds to channel assets

reorganize the css, icons etc
implement variable properties files for distributions (ip of server etc).

sharing of a photo captured from a camera, screenshot portion?
then put the drawing layer on top of it

would like to be able to drag assets in from the desktop directly into receiving areas - the system should first
upload them into assets, then do the normal thing

timeouts need to be synchronized (e.g. web.xml etc.)

authentication exception error (and all user messages) should be i18n/resource message files

logging should probably be uniform and useful for debugging system problems

channel selector needs 'channel editor' functionality; also should probably not set the channel
until a 'switch channel' button is selected

finish up on EXT JS extension to OWF for channel selector; how to share code/app between that one and the app?

might want to reorganize the web apps (w1, w2) so that the default is unsecured, while sensitive
material is kept in a few distinct directories instead of scattered all over and explicitly named
in the web.xml file

convert the channel information app into boots styling; make sure it will run on a mobile device as a
prototype for the reponsive design
