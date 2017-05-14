DOM4J cannot be cast ... to DOM4J persistence unit startup errors
----
Solved by making the hibernate jars 'provided' and ALSO doing some bogus edit to the standalone.xml file
+ the jenkins built version DOES NOT work, it has to be built locally


MISC
----
New setups need to run "mvn install" on the parent before the wac-build can be used, as it needs to install the parent pom in your repo cache

Individual .war's have to be marked as "deployable" for individual deployment scenarios; drill down into the target directory, right click on the
.war file, and say 'mark as deployable'.  they can then be handled in the add/remove menu just as for the .ear (don't try and deploy .ear and .wars
at the same time).

to add a new maven module, manually create it where you want it and then use 'import maven projects' to get it into the workspace.  if you
create through eclipse it will put it in the wrong directory (up).

had to create a new 'ejb' containing project as the wac-wapi is a .war file which doesn't offer dependencies to those modules that need
to directly reference ejb's.  so shared ejb's need to go into the wac-ejb module; perhaps the wac-wapi should be the wac-api or wac-rest,
and the wac-ejb should be a wac-wapi .ejb module.  manual editing of the org.eclipse.wst.common.component may be required

Eclipse/wildfly .ear/.war deploy plugin deploys static and/or java (after compiling) resources directly to the expanded JBOSS .war file
(for example, to:
C:\dev\MP\wac\.metadata\.plugins\org.jboss.ide.eclipse.as.core\WildFly_8.x1404397020406\deploy\wac.ear\wac-ws-1.0-SNAPSHOT.war\index.html)
when a change is made in the ide to the source file.

changed the Wildfly 9-> Overview -> Server State Detectors -> Startup Poller/Shutdown Poller to "Management Service" from "Web" to eliminate log errors:
"Unable to retrieve a list of remote deployment scanners"

ECLIPSE/WILDFLY DEBUGGING DRASTICALLY SLOWS DOWN (TTFB in seconds)
------------------------------------------------------------------
fixed eclipse debug slowdown by removing users/AppData/Local/Eclipse


DEBUGGING - CANT FIND SOURCE
----------------------------
If attaching the source files fails, you may need to set the source directory in the JBOSS Launch Configuration rather than the 'attach sources' that comes up
when a breakpoint is hit.  Do this by: double click server, select "open launch configuration" link, "Source" tab, then attach the sources as you
find them in the project directory.

Not sure why this happens, it might only be applicable to the instrumented servlet 3.0 stuff ...

Also had problems with using jdk 1.8 instead of 1.7 - could not get this to work with breakpoints/finding sources.


WRONG (FULL MAVEN NAMES) DEPLOYMENT CONTEXT NAMES
-------------------------------------------------
(e.g. /wac-wapi-1.0-SNAPSHOT when it should be /wac-wapi)
if the .ear is deploying w/o respecting the deployment context names as given in the application .xml (generated from the .pom), then you may need to turn on 'build automatically' if you have shut that off; doing so should cause the contexts to be named correctly.


GRUNT-MAVEN BUILD STATIC PROJECTS WILL NOT SHOW UP PROPERLY IN ECLIPSE AUTODEPLOYMENT
-------------------------------------------------------------------------------------
If a modules static content is created by a grunt build, the IDE-deployment will not work properly as eclipse is not getting it's deployed copy
from the target/ directory.  One workaround is to mark the generated .war in the target directory for deployment and use that.
OTHERWISE, might just completely separate the front and back end work and use grunt watch when editing the front end modules, not
deploying them in the .ear.  In this case, might want to remove the deploy from the eclipse wtp so there isn't a double deployment
tried, and the fe modules can call into the be code.


JS BUILD SETUP
--------------
npm install -g yo grunt-cli bower
npm install -g generator-angular
yo angular

WILDFLY CONFIG
--------------
Deploy the JDBC drivers as a 'deployment', then you can choose the driver from the options presented while creating
a datasource with the wildfly management console.

Sample wildfly config file found in this directory.

Client-side changes are automatically hot deployed if the modules are deployed individually (not the .ear).

Support hot deploy of server-side changes:
Add this param to enable hot deploy  auto-deploy-exploded="true"
Changes are as below:
        <subsystem xmlns="urn:jboss:domain:deployment-scanner:1.0">
            <deployment-scanner name="default" path="deployments" scan-enabled="true" scan-interval="5000" relative-to="jboss.server.base.dir"    auto-deploy-exploded="true" deployment-timeout="60"/>
        </subsystem>
Unfortunately this redeploys after every change; otherwise only static file changes will appear immediately after they are made.  So if static file changes are exclusively being made, probably best to remove that.		


I would recommend you to bypass redeployment if you are working lots on static content and just configure file handler to serve your custom path directly from disk.
just add handler like this in undertow subsystem
    <file name="static-content" path="/path/on/disk/for/static/content" />
and then under host you can just add it like this:
      <location name="/static" handler="static-content" />
