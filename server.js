// NWEN304 Project
//===================================

// Libraries
var express =           require("express")
  , logfmt =            require("logfmt")
  , bodyParser =        require('body-parser');

// Models
var testURI =           require('./routes/testURI')
  , config =            require('./config')
  , auth   =            require('./routes/authenticate')
  , authenticateFB =    require('./routes/authenticateFB')
  , pests =             require('./routes/pestsdb')
  , management =        require('./routes/management')
  , graph =             require('./routes/fbgraphTest')
  , script_server =     require('./scripts/script_server');

// Set up app
var app = express();
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(logfmt.requestLogger());
app.use(bodyParser());
app.use(express.static(__dirname + '/views'));

// Facebook app id & app secret
if(!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}

//=============================
// ROUTES

//=== Users ===
app.post('/register',               auth.register);// register a user
app.post('/fbtoken_in',             auth.fbtoken_in);// send FBtoken from phone app to server

//=== Pest has been spotted ===
app.post('/pestspotted',            pests.pestspotted);// add pest to database, returns the id
app.get('/pestspotted/:user/:pest', pests.pestspottedUserPest);// total <pest_type> logged by this user
app.get('/pestspotted/:user',       pests.pestspottedUser);// total pests logged by this user

//=== Park Management ===
app.get('/report',                  graph.login); // management.report);// date selector for management report
app.get('/report_builder',          management.report_builder);// park management report

//=== Facebook ===
app.get('/login',                   graph.login);
app.get('/login/callback',          graph.loginCallback);
app.get('/logout',                  authenticateFB.logout);

//=== scripts ===
app.get('/scripts/:script',         script_server.serve);

//=============================
// TESTS
//=== tests, basic ===
app.get('/test',                    testURI.test);
app.get('/fbFeed',                  testURI.fbFeed);
app.get('/fbToken',                 testURI.fbToken);
app.get('/error/:id',               testURI.errorid);
app.get('/matt',                    testURI.testMatt);
app.get('/test/:id',                testURI.testid);
//=== tests using dummy data in arrays ===
app.get('/pests/spotted',           testURI.pestsspotted);
app.get('/pests/:id',               testURI.pestsid);
app.get('/pests/:id/:s',            testURI.pestsidfound);
//=== tests setting up a Postgresql database ===
app.get('/db/new',                  testURI.dbnew);
app.get('/db/visits/i',             testURI.dbvisitsi);
app.get('/db/visits',               testURI.dbvisits);
//=== Return list of all pests spotted ===
app.get('/pestspotted_all',         testURI.pestspottedAll);
app.get('/pestspotted_all/:json',   testURI.pestspottedAllJson);
//=== get all pests logged for this day, day format 24-05-2014 ===
app.get('/pestspotted_on/:date',    testURI.pestspotted_onDate);
app.get('/pestspotted_on/:date/:json', testURI.pestspotted_onDateJson);

//======================================
// server start
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

