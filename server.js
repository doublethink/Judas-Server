// NWEN304 Project
//===================================

// Facebook security
// switch off caching cache-control //res.writeHead(200, "Cache-Control: no-store/no-cache")
// increase data returned by get requests, think park managers.



var express = require("express")
  , logfmt = require("logfmt")
  , bodyParser = require('body-parser')
  , http = require('http') // TODO remove?
//  , FB = require('fb')
//  , Step = require('step')
//  , crypto = require('crypto')
//  , pg = require('pg')
//  , connectionString = process.env.DATABASE_URL
//  , client = new pg.Client(connectionString)
  , query;

var testURI = require('./routes/testURI')
  , config = require('./config')
  , pests = require('./routes/pestsdb');

//client.connect();


var app = express();
app.set('views', __dirname + '/views'); // TODO I think this is a default - remove?
app.engine('html', require('ejs').renderFile);

app.use(logfmt.requestLogger());
app.use(bodyParser());
app.use(express.static(__dirname + '/views'));



//=============================
// routing
// add pest to database, returns the id
app.post('/pestspotted',                    pests.pestspotted);
// Return list of all pests spotted.
app.get('/pestspotted/all',                 pests.pestspottedAll);
app.get('/pestspotted/all/:json',           pests.pestspottedAllJson);
// get all pests logged for this day
// Day format must equal DD-MM-YYYY for example /pestspotted_on/04-05-2014
app.get('/pestspotted_on/:date',            pests.pestspotted_onDate);
app.get('/pestspotted_on/:date/:json',      pests.pestspotted_onDateJson);
// total of a specific pest type logged by this user
app.get('/pestspotted/:user/:pest',         pests.pestspottedUserPest);
// total noumber of pests logged by this user
app.get('/pestspotted/:user',               pests.pestspottedUser);

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


//=======================================================================
// accept and store the FB response token
// pre-requisite: body contains the Facebook authResponse token
// NB: not sure this is sufficient to be sure we are communicating with the phone app.
// tested post content -> {"authResponse" : {"accessToken": "letMeInToo", "expiresIn": "00:01:00", "signedRequest": "signedByMatt", "userID": "Bob"}}

app.post('/fbtoken_in', function(req, res){
  console.log("MATT log note---> post login");

  // FBtoken is the Facebook authResponse token
  // https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/
  var FBtoken = req.body.authResponse;

if(FBtoken == null){
  res.send(401, "User token has not been recieved."); // 401 Unauthorized
} else {

  var insert;

  // create sql INSERT
  var sql_insert = 'INSERT INTO '+USERDB+
       '(uid, FBtoken) '+
       'VALUES ( \''+
        FBtoken.userID+'\', \''+
        JSON.stringify(FBtoken) +'\')';
  console.log('MATT log notes---> sql_insert : '+ sql_insert);

  // add to db
  client.query(sql_insert);
  query = client.query('SELECT count(*) FROM '+USERDB);

  // get most recent inserts id based on row count
  query.on('row', function(row, result){
    insertId = row.count;
  });

  // reply to client with id
  query.on('end', function(row, result){
    console.log('MATT log notes---> data inserted');
    console.log('MATT log notes---> result : '+insertId);
    res.send(201, '{"id" : "'+insertId+'"}');                  // 201 is success resource created
  });
}
});


//=====================================================================
// respond with the Facebook authResponse token
// pre-requisite: Body contains json {"userID": "xxx"}
// prerequisite: userID value matches the userID in the token
// tested post content -> {"userID": "Matt"}

app.post('/fbtoken_out', function(req, res){
  console.log("MATT log note---> post login");

  var FBuserID = req.body.userID
    , FBtoken;

if(FBuserID == null){
  res.send(401, "UserID has not been recieved."); // 401 Unauthorized
} else {

  var insert;

  // create sql SELECT
  var sql = 'SELECT * FROM '+USERDB+
       ' WHERE uid = \''+ FBuserID +'\';';
  console.log('MATT log notes---> sql : '+ sql);

  // retrieve from db
  query = client.query(sql);

  // get most recent inserts id based on row count
  query.on('row', function(row, result){
    FBtoken = row.fbtoken;  // column name is lowercase out of db
    console.log('MATT log notes---> FBtoken : '+ FBtoken);

    // little point in checking the userID, but sets up conditional for something stronger
    if(FBtoken == undefined){
      return res.send(401, "UserID does not exist in the db."); // 401 Unauthorized
    }
    if(FBtoken.userID != FBuserID){
      return res.send(401, "UserID does not match the stored token."); // 401 Unauthorized
    }
  });

  // reply to client with id
  query.on('end', function(row, result){
    console.log('MATT log notes---> returning data');
    res.json(202, FBtoken);                  // 202 request accepted
  });
}
});








//======================================
// restful interfaces
//======================================

  /*====== POST ======*/

// test curl for authenticating user
// curl --request POST "localhost:5000/user" --data "userId=Matt&password=stuff"
app.post('/user', function(req,res){
/* 
ref RFC2831 Digest SASL Authentication for steps to implement
  NB: not a great security protocol, but gets basic securtity in place that can be upgraded later.
  using qop = 'auth'
  1. User has not recently authenticated
  2. User has already authenticated and knows {userId, realm, qop and nonce}
*/
  var error;
  console.log("Authenticating user.")
  if(req.body.userId == null || req.body.password == null){
    error = "No user or password supplied.";
  }else{
    for (i in users){
      //console.log("userId : " + users[i].userId);
      //console.log("password : " + users[i].password);
      if(req.body.userId == users[i].userId && req.body.password == users[i].password){
        var success = "Supplied user and password match.";
        console.log(success);
        res.send(200, success);
			  return;
      }
    }
  }

  var error = error || "Supplied user and password failed.";
  console.log(error);
  res = setAuthenticateResponse(res)
  res.send(401, error); // 401 Unauthorized
});
// end rest



//======================================
// server start
//======================================
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server

