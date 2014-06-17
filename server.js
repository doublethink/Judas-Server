// NWEN304 Project
//===================================

// Facebook security
// switch off caching cache-control //res.writeHead(200, "Cache-Control: no-store/no-cache")
// increase data returned by get requests, think park managers.


var mydb = "visits"
  , DATABASE = "judasDB"
  , USERDB = "userDB";

var express = require("express")
  , logfmt = require("logfmt")
  , bodyParser = require('body-parser')
  , http = require('http') // TODO remove?
  , FB = require('fb')
  , Step = require('step')
  , crypto = require('crypto')
  , pg = require('pg')
  , connectionString = process.env.DATABASE_URL
  , client = new pg.Client(connectionString)
  , query;

var testURI = require('./routes/testURI')
  , config = require('./config');

client.connect();


var app = express();
app.set('views', __dirname + '/views'); // TODO I think this is a default - remove?
app.engine('html', require('ejs').renderFile);

app.use(logfmt.requestLogger());
app.use(bodyParser());
app.use(express.static(__dirname + '/views'));



//=============================
// routing

// tests
app.get('/test',          testURI.test);
app.get('/error/:id',     testURI.errorid);
app.get('/matt',          testURI.testMatt);
app.get('/test/:id',      testURI.testid);
// tests using dummy data in arrays
app.get('/pests/spotted', testURI.pestsspotted);
app.get('/pests/:id',     testURI.pestsid);
app.get('/pests/:id/:s',  testURI.pestsidfound);





//============================
// DB backups
// Heroku PG Backups (Free option, daily backup, retained for a month)
// This free option requires making regular manual data backups, to save histical data. 
// A pay for options would give better pgbackups from Heroku, or implement a cloud db, say Cassandra, on Amazon servers. 

//============================
// post /pestspotted
// add pest to database, returns the id

// curl localhost:5000/pestspotted2 -v -d '{"packet": {"position": {"longitude": "22", "latitude": "44", "accuracy": "0.5", "datestamp": "15 May"}, "pest" : "rabbit", "auth": {"uid": "Matt"}}}' -H "Content-Type: application/json"

app.post('/pestspotted', function(req, res) {
  console.log('MATT log notes---> post /pestspotted');

if(authorised(req)){
  console.log('MATT log notes---> Passed authentication.');

  if(!verifyInput_pestspotted(req, res)) return; // 400 error on fail, value missing

  var packet = req.body.packet
    , insertId;

  // create sql INSERT
  var sql_insert = 'INSERT INTO '+DATABASE+
       '(longitude, latitude, accuracy, datestamp, pest, uid) '+
       'VALUES ( '+
        packet.position.longitude+', '+
        packet.position.latitude+', '+
        packet.position.accuracy+', \''+
        packet.position.datestamp+'\', \''+
        packet.pest+'\', \''+
        packet.auth.uid+'\')';
  console.log('MATT log notes---> sql_insert : '+ sql_insert);

  // add to db
  client.query(sql_insert);
  query = client.query('SELECT count(*) FROM '+DATABASE);

  // get most recent inserts id based on row count
  query.on('row', function(row, result){
    insertId = row.count;
  });

  // reply to client with id
  query.on('end', function(row, result){
    console.log('MATT log notes---> result : '+insertId);
//    res.writeHead(200, "Cache-Control: no-store/no-cache"); // TODO test
    res.send(201, '{"id" : "'+insertId+'"}');                  // 201 is success resource created
  });
}
});


app.get('/pestspotted/all', function(req, res){
  res.redirect('/pestspotted/all/text');
});
//=======================================================
// Returns list of all pests spotted. 
// Limited details, can expand on request from team
app.get('/pestspotted/all/:json', function(req, res){
  console.log("MATT log note---> get pestspotted/all");
//  res.writeHead(200, "Cache-Control: no-store/no-cache"); // TODO test

if(authorised(req)){
  console.log('MATT log notes---> Passed authentication.');

  // conduct search
  var rows = [];
  var query = client.query('SELECT * FROM '+DATABASE+';');

  // build result
  query.on('row', function(row, result){ 
    // collect pest name and datetime they were spotted
    rows.push('{userid : '+row.uid+', pest : '+row.pest+', date : '+row.datestamp+'}');
    console.log("row ID: " + row.ID + " pest: " +row.pest);
  });

  // send it back to client
  query.on('end', function(row, result){
    console.log("size : " + rows.length);
		var str = "";
    if(req.param('json') == "json"){
      var first = true;
      for(i = 0; i < rows.length; i++){
        if(!first){ str += ', ' };
        str += '{row : '+(i+1)+', value : '+rows[i] + '}';
        first = false;
      }
      res.json('{packet : [' + str + ']}');
    } else {  
      for(i = 0; i < rows.length; i++){
        str += "row : "+(i+1)+", value : "+rows[i] + "<br>";
      }
      res.send("List of pests in db :<br>" + str +"There are " + rows.length + " rows.");
    }
  });
}
});


app.get('/pestspotted_on/:date', function(req, res){
  res.redirect('/pestspotted_on/' + req.param('date')+'/text');
});
//=======================================================================
// get all pests logged for this day
// Day format must equal DD-MM-YYYY for example /pestspotted_on/04-05-2014
app.get('/pestspotted_on/:date/:json', function(req, res){
  console.log("MATT log note---> get pestspotted/:date");

if(authorised(req)){
  console.log('MATT log notes---> Passed authentication.');

  if(!validateDate(req.param('date'))){
 	return res.send(400, "Invalid date format. Use DD-MM-YYYY."); // 400 Bad Request, syntax.
  } else {
    console.log("MATT log note---> date validated.");

  // format date to match db format
    var split = req.param('date').split('-').reverse();
    var date = split.toString().replace(",","-").replace(",","-"); // odd, needs replace twice
    console.log("MATT log note---> date = "+ date);

  // calc next day
    var nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate()+1);
    console.log("MATT log note---> nextDay = "+ nextDay);

  // create next day string for db search
    var nextDayStr = ""+nextDay.getFullYear();
    var t = new String(nextDay.getMonth()+1);
    nextDayStr += t.length == 2 ? "-"+t : "-0"+t;
    t = new String(nextDay.getDate());
    nextDayStr += t.length == 2 ? "-"+t : "-0"+t;
    console.log("MATT log note---> nextDayStr = "+ nextDayStr);

  // conduct search
    var rows = [];
    var query = client.query('SELECT uid, pest, datestamp FROM '+DATABASE+
        ' WHERE datestamp >= \'' + date + '\''+
            ' AND datestamp < \''+nextDayStr+'\' ;');

  // build result
    query.on('row', function(row, result){ 
      rows.push('{userid : '+row.uid+', pest : '+row.pest+', date : '+row.datestamp+'}');
      console.log('MATT log notes---> added : '+ rows[rows.length-1]);
    });

  // send it back to client
    query.on('end', function(row, result){
      console.log("MATT log note---> size : " + rows.length);
      var str = "";
      if(req.param('json') == "json"){
        var first = true;
        for(i = 0; i < rows.length; i++){
          if(!first){ str += ', ' };
          str += '{row : '+(i+1)+', value : '+rows[i] + '}';
          first = false;
        }
        res.json('{packet : [' + str + ']}');
      } else {
        for(i = 0; i < rows.length; i++){
          str += "row : "+(i+1)+", value : "+rows[i] + "<br>";
        }
        res.send("pests on this day :<br>" + str +"There are " + rows.length + " rows.");
      }
    });
  }
}
});
//======================================================================
// total of a specific pest type logged by this user

app.get('/pestspotted/:user/:pest', function(req, res){
  console.log("MATT log note---> get pestspotted/:user/:pest");

if(authorisedAdmin(req)){
  console.log('MATT log notes---> Passed authentication.');

  // conduct search
  var count;
  var query = client.query('SELECT count(*) FROM '+DATABASE+
      ' WHERE uid = \''+ req.param('user') +'\' AND pest = \''+ req.param('pest') +'\';');

  // build result
  query.on('row', function(row, result){ 
    count = row.count;
  });

  // send it back to client
  query.on('end', function(row, result){
    res.json('{count : ' + count +', request: \'get pestspotted/:user/:pest\'}');
  });
}
});
//=======================================================================
// total noumber of pests logged by this user
// NB: user is case sensitive

app.get('/pestspotted/:user', function(req, res){
  console.log("MATT log note---> get pestspotted/:user");

if(authorisedAdmin(req)){
  console.log('MATT log notes---> Passed authentication.');

  // conduct search
  var count;
  var query = client.query('SELECT count(*) FROM '+DATABASE+
      ' WHERE uid = \''+ req.param('user') +'\';');

  // build result
  query.on('row', function(row, result){ 
    count = row.count;
  });

  // send it back to client
  query.on('end', function(row, result){
    res.json('{count : ' + count +', reqest: \'get pestspotted/:user\'}');
  });
}
});


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








//=============================================================================
//===================== test methods, etc below this point =========================
// keep helpers & server start at bottom...



//======================================
// original test post for pestspotted
//======================================
/* ****************************************************************** 
   test curl, nested jason format -> matches client side post request, hopefully...
   ******************************************************************
curl localhost:5000/pestspotted -v -d '{"packet": {"position": {"longitude": "22", "latitude": "44", "accuracy": "0.5", "datestamp": "15 May"}, "auth": {"uid": "Matt", "accessToken": "possum"}}}' -H "Content-Type: application/json"
*/
app.post('/pestspotted2', function(req, res) {
  if(!verifyInput_pestspotted(req, res)) return;  // 400 error on fail, value missing

	if(authorised(req)){
    // just uses an array
    var newSpot = req.body.packet;
    spots.push(newSpot);

    // create log message
    var record = spots[spots.length-1];
    var resourceId = spots.length-1;
    var text1 = "The user is "+record.auth.uid+", the access token is "+record.auth.accessToken+".";
		var text2 = "Longitude/Latitude/Accuracy is " + record.position.longitude+"/"+record.position.latitude+"/"+record.position.accuracy;

    var result = {"resourceId": resourceId, "text1": text1, "text2": text2 }; 

    console.log(result);

    // feedback to client
    res.send(201, result); // 201 is success resource created
  }else{
    res = setAuthenticateResponse(res);
		res.send(401, "ID has not been recognised."); // 401 Unauthorized
  }
});



//=====================================
// database
// everything happens inside a query.on listener for {row, end, err}.
// outside that, its just variable assignment.
// a query can accept serial sql instructions.
//=====================================
app.get('/db/new', function(req, res){
  console.log("MATT log note---> get db/new");
  var date = new Date();

  client = new pg.Client(connectionString);
  client.connect();

  query = client.query('DROP TABLE '+mydb+'; CREATE TABLE '+mydb+'(date date);');
  console.log("MATT log note---> post query");

  query.on('err', function(err){
    res.send("error : "+err);
  });

  query.on('end', function(result){ client.end(); });

  console.log("db new table query processed.");

  res.send("new db\n");
});


app.get('/db/visits/i', function(req, res){
  console.log("MATT log note---> get db/visits/i");
	var date = new Date();

  client.query('INSERT INTO '+mydb+'(date) VALUES ($1)', [date]);
  var query = client.query('SELECT COUNT(date) AS count FROM '+mydb+' WHERE date = $1', [date]);
  console.log("MATT log note---> post query");

  query.on('row', function(result){
    console.log('MATT log ---> result : '+result.count);
    if(!result){ 
      console.log('MATT !result ---> true');
      return res.send('No data found.'); }
    else { 
      console.log('MATT !result ---> false');
      return res.send('Visits today : ' + result.count); }
  });
});


app.get('/db/visits', function(req, res){
  console.log("MATT log note---> get db/visits");
  var rows = [];
  var query = client.query('SELECT * FROM ' + mydb);

  query.on('row', function(row, result){ 
    rows.push(row.date);
    console.log("MATT log row : " + row.date);
  });

  query.on('err', function(err){
    return res.send("error : "+err);
  });

  query.on('end', function(row, result){ 
    console.log("MATT log note---> size : " + rows.length);
		var str = "";
    for(i = 0; i < rows.length; i++){
      str += "row : "+i+", value : "+rows[i] + "<br>";
    }
    console.log("MATT log note---> value i : " + i);
    return res.send("Database holds :<br>" + str +"There are " + rows.length + " rows.");
  });
});
// end database

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
// helpers
//======================================
function setAuthenticateResponse(res){
  // Challenge Digest scheme is...
  //   source http://technet.microsoft.com/en-us/library/cc780170%28v=ws.10%29.aspx
  // Challenge = “Digest” digest-challenge
  // HTTP Authentication digest-challenge = 1# (
  //   realm=realm | [domain=“domainname”] |
  //   nonce=“nonce-value” | [opaque=“opaque-value”] | [stale=(“true” | “false”)] |
  //   [algorithm=(“MD5” | “MD5-sess” | token] |
  //   [qop=1#(“auth” | “auth-int” | token)] | [auth-parm]
  res.set({'WWW-Authenticate' : 'Digest Realm=\"user@judas.heroku.com\"',
    'qop' : 'auth', // qop Quality Of Protection, auth = authorisation only
    'nonce' : '12345'}); // nonce, unique encoded value generated for this challenge
  return res;	
}

function authorisedAdmin(req){
  if(true) return true; // TODO

  return false;
}

function authorised(req){
  if(true) return true; // TODO

  res = setAuthenticateResponse(res);
  res.send(401, "User ID has not been recognised."); // 401 Unauthorized
  return false;
}

function validateDate(d){
  var date = new String(d);
  // sufficient for now, would need upgrading in production. Leap years, variable days in month.
  var reg = new RegExp('(0[1-9]|[12][0-9]|3[01])[-/.](0[1-9]|1[012])[-/.](19|20)[0-9][0-9]');

  var test = reg.test(date);
    console.log("MATT log note---> date regex result is; " + test);
  if(test){ return true; }
  return false;
}

// Check input for pestspotted
// return boolean on success/fail
function verifyInput_pestspotted(req, res){
  if(
     req.body.packet == undefined ||
     req.body.packet.position == undefined ||
     req.body.packet.position.longitude == undefined ||
     req.body.packet.position.latitude == undefined ||
     req.body.packet.position.accuracy == undefined ||
     req.body.packet.position.datestamp == undefined ||
     req.body.packet.pest == undefined ||
     req.body.packet.auth == undefined ||
     req.body.packet.auth.uid == undefined
    ){
    // input failed, create & send error message
    res.statusCode = 400;
    var packetError = req.body.packet == undefined ? "undefined, please provide a root element." : "";
    var positionError = req.body.packet == undefined || req.body.packet.position == undefined ? "undefined" :
      "\n  longitude: "+req.body.packet.position.longitude+
      "\n  latitude: "+req.body.packet.position.latitude+
      "\n  accuracy: "+req.body.packet.position.accuracy+
      "\n  datestamp: "+req.body.packet.position.datestamp;
		var authError = req.body.packet == undefined || req.body.packet.auth == undefined ? "undefined" :
      "\n  uid: "+req.body.packet.auth.uid;
    var pestError = req.body.packet == undefined || req.body.packet.pest == undefined ? "undefined" :
      req.body.packet.pest;
    
    res.send('Error 400: A value is missing.\n' +  // 400 error, value missing
      "\npacket: "   +packetError+
      "\nposition: " +positionError+
      "\npest: "     +pestError+
      "\nauth: "     +authError);
    return false;
  }
  return true;
}
// end helpers

//======================================
// server start
//======================================
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server

