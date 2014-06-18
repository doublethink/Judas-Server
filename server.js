// NWEN304 Project
//===================================

// Facebook security
// increase data returned by get requests, think park managers.



var express = require("express")
  , logfmt = require("logfmt")
  , bodyParser = require('body-parser');
//  , http = require('http') // TODO remove?

var testURI =     require('./routes/testURI')
  , config =      require('./config')
  , authenticateFB = require('./routes/authenticateFB')
  , pests =       require('./routes/pestsdb');

var app = express();
app.set('views', __dirname + '/views'); // TODO I think this is a default - remove?
app.engine('html', require('ejs').renderFile);

app.use(logfmt.requestLogger());
app.use(bodyParser());
app.use(express.static(__dirname + '/views'));

if(!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}

//=============================
// routing
//app.get('/',                               './views/index');
// add pest to database, returns the id
app.post('/pestspotted',                    pests.pestspotted);
// Return list of all pests spotted.
app.get('/pestspotted/all',                 pests.pestspottedAll);
app.get('/pestspotted/all/:json',           pests.pestspottedAllJson);
// get all pests logged for this day, day format 24-05-2014
app.get('/pestspotted_on/:date',            pests.pestspotted_onDate);
app.get('/pestspotted_on/:date/:json',      pests.pestspotted_onDateJson);
// total of a specific pest type logged by this user
app.get('/pestspotted/:user/:pest',         pests.pestspottedUserPest);
// total noumber of pests logged by this user
app.get('/pestspotted/:user',               pests.pestspottedUser);

// Facebook stuff
app.get( '/login',                          authenticateFB.index);
app.get( '/login/callback',                 authenticateFB.loginCallback);
app.get( '/logout',                         authenticateFB.logout);

app.post('/fbtoken_in',                   authenticate.fbtoken_in);
app.post('/fbtoken_out',                  authenticate.fbtoken_out);

//=============================
// tests
app.get('/test',                        testURI.test);
app.get('/error/:id',                   testURI.errorid);
app.get('/matt',                        testURI.testMatt);
app.get('/test/:id',                    testURI.testid);
// tests using dummy data in arrays
app.get('/pests/spotted',               testURI.pestsspotted);
app.get('/pests/:id',                   testURI.pestsid);
app.get('/pests/:id/:s',                testURI.pestsidfound);
// tests setting up a Postgresql database
app.get('/db/new',                      testURI.dbnew);
app.get('/db/visits/i',                 testURI.dbvisitsi);
app.get('/db/visits',                   testURI.dbvisits);

//======================================
// server start
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server

