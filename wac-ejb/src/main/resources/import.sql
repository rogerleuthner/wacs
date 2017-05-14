
-- make built-in OWF accounts functional
insert into wac_user (id, active, username, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'testAdmin1', 'testAdmin1@softoutfit.com', 'TestAdmin', 'OWF', 'B', '404-333-3333', LOCALTIMESTAMP);
insert into wac_user (id, active, username, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'testUser1', 'testUser1@softoutfit.com', 'TestUser', 'OWF', 'B', '404-333-3333', LOCALTIMESTAMP);

-- the default channel, required for system bootstrap
insert into wac_channel (id, active, name, description, created) values (-1, 'true', 'WAC Bootstrap', 'WAC Bootstrap into which users are grouped into before channel selection.  Not a real channel, just a placeholder.', LOCALTIMESTAMP);

-- bootstrap user, and access to the default channel.  do not delete this user without first ensuring a replacement with equivalent roles exists.
insert into wac_user (id, active, username, hashword, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'root', '65c1b1bf8fdc5d730730c5818c5e2964b948a870df76197e378695b852c760a1', 'NO@EMAIL', 'WAC', 'Administrator', 'c0!!ab0rat3', '000-000-0000', LOCALTIMESTAMP);
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', -1, (select id from wac_user where username = 'root' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', -1, (select id from wac_user where username = 'root' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', -1, (select id from wac_user where username = 'root' ));

-- sample setup of users in various roles

-- channel controller
insert into wac_user (id, active, username, hashword, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'channelController', '894738e14c4cd5903c92dcfd5d2d6d436114c11262b0eb3970fa90ed945f1634', 'rleuthner2@softoutfit.com', 'Channel', 'Controller', 'B', '404-333-3333', LOCALTIMESTAMP);
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', -1, (select id from wac_user where username = 'channelController' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_CONTROLLER', -1, (select id from wac_user where username = 'channelController' ));

-- channel user
insert into wac_user (id, active, username, hashword, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'channelUser', '894738e14c4cd5903c92dcfd5d2d6d436114c11262b0eb3970fa90ed945f1634', 'rleuthner3@softoutfit.com', 'Channel', 'User', 'B', '404-333-3333', LOCALTIMESTAMP);
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', -1, (select id from wac_user where username = 'channelUser' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_USER', -1, (select id from wac_user where username = 'channelUser' ));

-- SAMPLE/TEST DATA
insert into wac_channel( id, active, created, name, description ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'Guardian Angel', 'Operation to oversee distribution of relief supplies in Northern Oregon Flood Disaster' );
insert into wac_channel( id, active, created, name, description ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'Jemez Mountain Fires', 'Fires burning in Jemez Mountains are threatening homes.  Firefighting, relief and evacuation support.' );
insert into wac_channel( id, active, created, name, description ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'Wright-Patt Sandhill Threat', 'Terrorist are threatening Wright-Patterson Airforce Base Attacks.  Coordinated efforts to investigate, mitigate and provide proactive defensive measures.' );

-- sample users
insert into wac_user (id, active, username, hashword, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'rleuthner', '894738e14c4cd5903c92dcfd5d2d6d436114c11262b0eb3970fa90ed945f1634', 'rleuthner@softoutfit.com', 'WAC', 'Creator', 'B', '000-000-0000', LOCALTIMESTAMP);
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', -1, (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', -1, (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', -1, (select id from wac_user where username = 'rleuthner' ));

insert into wac_user (id, active, username, hashword, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'wesley', '894738e14c4cd5903c92dcfd5d2d6d436114c11262b0eb3970fa90ed945f1634', 'wesley@softoutfit.com', 'WAC', 'Creator', 'B', '000-000-0000', LOCALTIMESTAMP);
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', -1, (select id from wac_user where username = 'wesley' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', -1, (select id from wac_user where username = 'wesley' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', -1, (select id from wac_user where username = 'wesley' ));


-- and access to sample channels
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Jemez Mountain Fires' ), (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Jemez Mountain Fires' ), (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Wright-Patt Sandhill Threat' ), (select id from wac_user where username = 'rleuthner' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Wright-Patt Sandhill Threat' ), (select id from wac_user where username = 'rleuthner' ));

-- spiral III users
insert into wac_user (id, active, username, hashword, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'kbarrera', '3e78928b00589f5814aecaeca0c9b2eb763b721cddce0be7de2426bf49628554', 'kristen.barrera.4@us.af.mil', 'Kristen', 'Barrera', 'B', '404-333-3333', LOCALTIMESTAMP);
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', -1, (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', -1, (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', -1, (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Jemez Mountain Fires' ), (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Jemez Mountain Fires' ), (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Wright-Patt Sandhill Threat' ), (select id from wac_user where username = 'kbarrera' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Wright-Patt Sandhill Threat' ), (select id from wac_user where username = 'kbarrera' ));

insert into wac_user (id, active, username, hashword, email, first, last, middle, phone, created ) values (nextval('hibernate_sequence'), 'true', 'demo1', 'e2d2937008c8ba69742860f76d0bf6283d65a1be38f28cbd4e566aaffb90b861', 'demo1@us.af.mil', 'Demo', 'One', 'B', '404-333-3333', LOCALTIMESTAMP);
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', -1, (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', -1, (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', -1, (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'WAC_SUPER', (select id from wac_channel where name = 'Guardian Angel' ), (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Jemez Mountain Fires' ), (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Jemez Mountain Fires' ), (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_ADMIN', (select id from wac_channel where name = 'Wright-Patt Sandhill Threat' ), (select id from wac_user where username = 'demo1' ));
insert into wac_role ( id, active, created, access, chan_id, user_id ) values ( nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 'ROLE_USER', (select id from wac_channel where name = 'Wright-Patt Sandhill Threat' ), (select id from wac_user where username = 'demo1' ));


-- example insertion of default asset data
--insert into wac_file(id, active, created, lock, description, name, path, type, chan_id, user_id) values (nextval('hibernate_sequence'), true, LOCALTIMESTAMP, 0, 'Sample Form', 'GuardianAngel.html', '../../UPLOADS/-1/', 'MISSION_SHARE', -1, (select id from wac_user where username = 'rleuthner'));



