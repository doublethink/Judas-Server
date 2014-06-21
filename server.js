// NWEN304 Project
//===================================

// todo list
// Facebook security
// park manager security
// remove dodgy data from park manager results

var express = require("express")
  , logfmt = require("logfmt")
  , bodyParser = require('body-parser');

var testURI =     require('./routes/testURI')
  , config =      require('./config')
  , auth   =            require('./routes/authenticate')
  , authenticateFB = require('./routes/authenticateFB')
  , pests =       require('./routes/pestsdb')
  , graph =       require('./routes/fbgraphTest');

var app = express();
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.use(logfmt.requestLogger());
app.use(bodyParser());
app.use(express.static(__dirname + '/views'));

if(!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}

//=============================
// routing
// add pest to database, returns the id
app.post('/pestspotted',                    pests.pestspotted);
// total of a specific pest type logged by this user
app.get('/pestspotted/:user/:pest',         pests.pestspottedUserPest);
// total noumber of pests logged by this user
app.get('/pestspotted/:user',               pests.pestspottedUser);

// get park management report date selector
app.get('/report',                          pests.report);
// get Park Management report
app.get('/report_builder',                  pests.report_builder);

// Facebook stuff
app.get( '/login',                          graph.login);
app.get( '/login/callback',                 graph.loginCallback);
app.get( '/logout',                         authenticateFB.logout);
// getting token from the phone app
app.post('/fbtoken_in',                   auth.fbtoken_in);
//app.post('/fbtoken_out',                  auth.fbtoken_out);

// testing to get fb working... TODO remove once done
var graph2     = require('fbgraph');
var conf = {
    client_id:      config.facebook.appId
  , client_secret:  config.facebook.appSecret
  , scope:          config.facebook.scope
  , redirect_uri:   config.facebook.redirectUri
};

var wallPost = {
  message: "I'm gonna come at you like a spider monkey, chip!"
};

graph2.post("/feed", wallPost, function(err, res) {
  // returns the post id
  console.log(res); // { id: xxxxx}
});

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
// Return list of all pests spotted.
app.get('/pestspotted/all',                 pests.pestspottedAll);
app.get('/pestspotted/all/:json',           pests.pestspottedAllJson);
// get all pests logged for this day, day format 24-05-2014
app.get('/pestspotted_on/:date',            pests.pestspotted_onDate);
app.get('/pestspotted_on/:date/:json',      pests.pestspotted_onDateJson);

//======================================
// server start
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server

