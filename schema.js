// run using
// heroku run:detached node schema.js [--app <name of app>]


//============================
function createDummyData(createTable){
  // create initial dummy data
  createTable += 'INSERT INTO '+DATABASE+
     '(longitude, latitude, accuracy, datestamp, pest, uid) '+
     'VALUES ('+
     '22, 33, 0.4,'+
     '\'2014-05-03\''+          // dates must be in single quotes...
      ', \'possum\', \'Matt\');';

  createTable += 'INSERT INTO '+DATABASE+
     '(longitude, latitude, accuracy, datestamp, pest, uid) '+
     'VALUES ('+
			'22, 33, 0.4,'+
     '\'2014-05-04\''+
      ', \'house cat\', \'Matt\');';

  createTable += 'INSERT INTO '+DATABASE+
     '(longitude, latitude, accuracy, datestamp, pest, uid) '+
     'VALUES ('+
     '22.5, 33.5, 0.5,'+
     '\'2014-05-05\''+
      ', \'stoat\', \'Matt\');';
  return createTable;
}

//============================
// pestspotted table

var DATABASE = "judasDB";

var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

// create pest spotted table
var createTable = ''+
  'CREATE TABLE '+DATABASE+' ('+
  'ID        SERIAL  PRIMARY KEY, '+
  'longitude real    NOT NULL, '+
  'latitude  real    NOT NULL, '+
  'accuracy  real, '+
  'datestamp date    NOT NULL, '+ 
  'pest      varchar NOT NULL, '+
  'uid       varchar NOT NULL '+
  ');';

// add dummy data
createTable += createDummyData(createTable);

//client.query('DROP TABLE '+ DATABASE +';');
query = client.query(createTable);

query.on('end', function(result) { client.end(); });


//===============================
// basic table, kept for referance
/*
var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

//client.query('DROP TABLE visits');
query = client.query('CREATE TABLE visits (date date)');

query.on('end', function(result) { client.end(); });
*/

/* gives access to pg sql interface
heroku pg:psql --app "judas" 
// pestspotted db
// recreate table with uid as Foriegn key
DROP TABLE judasdb;
CREATE TABLE judasdb(ID SERIAL PRIMARY KEY, longitude real NOT NULL, latitude real NOT NULL, accuracy real, datestamp date NOT NULL, pest varchar NOT NULL, uid varchar references userdb(uid));
INSERT INTO judasdb(longitude, latitude, accuracy, datestamp, pest, uid) 
VALUES (22, 33, 0.4, '2014-05-03', 'possum', 'Matt');


DROP TABLE judas2db;
CREATE TABLE judas2db(ID SERIAL PRIMARY KEY, longitude real NOT NULL, latitude real NOT NULL, accuracy real, datestamp date NOT NULL, pest varchar NOT NULL, uid varchar references userdb(uid));
INSERT INTO judas2db(longitude, latitude, accuracy, datestamp, pest, uid) 
VALUES (22, 33, 0.4, '2014-05-03', 'possum', 'Matt');
INSERT INTO judas2db(longitude, latitude, accuracy, datestamp, pest, uid) 
VALUES (174.775, -41.3049, 34.45, '2014-05-03', 'possum', '1384121193');



//userdb
DROP TABLE userdb;
CREATE TABLE userdb(uid varchar PRIMARY KEY, email varchar, admin boolean, details JSON, fbtoken JSON);
INSERT INTO userdb (uid, email, admin, details, fbtoken) 
VALUES ('Matt', 'matt@test.com', 'true', '{"first": "Matt", "second": "Citizen"}', '{"accessToken": "letMeIn", "expiresIn": "00:01:00", "signedRequest": "signedByMatt", "userID": "Matt"}');
INSERT INTO userdb (uid, email, admin, details, fbtoken) 
VALUES ('Stephen', 'stephen@test.com', 'true', '{"first": "Stephen", "second": "Citizen"}', '{"accessToken": "letMeInMatt", "expiresIn": "00:02:00", "signedRequest": "signedByMatt", "userID": "Stephen"}');
INSERT INTO userdb (uid, email, admin, details, fbtoken) 
VALUES ('Bob', 'bob@test.com', 'false', '{"first": "Matt", "second": "Citizen"}', '{"accessToken": "letMeInYouGuys", "expiresIn": "00:03:00", "signedRequest": "signedByMatt", "userID": "Bob"}');
INSERT INTO userdb (uid, email, admin, details, fbtoken) 
VALUES ('1384121193', 'stephen@test.com', 'true', '{"first": "Stephen", "second": "Citizen"}', '{"accessToken": "letMeInMatt", "expiresIn": "00:02:00", "signedRequest": "signedByMatt", "userID": "1384121193"}');
INSERT INTO userdb (uid, email, admin, details, fbtoken) 
VALUES ('undefined673ddc106fed47b1', 'stephen@test.com', 'true', '{"first": "Stephen", "second": "Citizen"}', '{"accessToken": "letMeInMatt", "expiresIn": "00:02:00", "signedRequest": "signedByMatt", "userID": "undefined673ddc106fed47b1"}');
INSERT INTO userdb (uid, email, admin, details, fbtoken) 
VALUES ('undefined49D929C2-7D1A-4E1F-BC52-EF0BDB2752A1', 'tammy@test.com', 'true', '{"first": "Tammy", "second": "Citizen"}', '{"accessToken": "letMeInMatt", "expiresIn": "00:02:00", "signedRequest": "signedByMatt", "userID": "undefined49D929C2-7D1A-4E1F-BC52-EF0BDB2752A1"}');


//FB app-secret
DROP TABLE fbconfig;
CREATE TABLE fbconfig(appid varchar PRIMARY KEY, appsecret varchar);
INSERT INTO fbconfig (appid, appsecret) 
VALUES ('724664727600591', '68914e65743a43fae4fae9a258920c0e');


*/
