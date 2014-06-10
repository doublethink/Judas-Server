// NWEN304 Project
//===================================


var mydb = "visits";
var DATABASE = "judasDB";

var express = require("express");
var logfmt = require("logfmt");
var pg = require('pg')
  , connectionString = process.env.DATABASE_URL
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();


// npm install body-parser
var bodyParser = require('body-parser');
var http = require('http'); // TODO remove?

var app = express();
app.set('views', __dirname + '/views'); // TODO I think this is a default - remove?
app.engine('html', require('ejs').renderFile);

app.use(logfmt.requestLogger());
app.use(bodyParser());

//============================
// set up db for pests spotted
//============================
app.get('/pestspotteddb/new', function(req,res){
  // create pest spotted table
  var sql_ct = ''+
   'DROP TABLE '+DATABASE+'; '+   // comment the DROP TABLE out if the table does not yet exist
   'CREATE TABLE '+DATABASE+' ('+
   'ID        SERIAL  PRIMARY KEY, '+
   'longitude real    NOT NULL, '+
   'latitude  real    NOT NULL, '+
   'accuracy  real, '+
   'datestamp varchar    NOT NULL, '+  // dates stored as strings
   'pest      varchar NOT NULL, '+
   'uid       varchar NOT NULL '+
   ');';
  // create initial dummy data
  sql_ct += 'INSERT INTO '+DATABASE+
     '(longitude, latitude, accuracy, datestamp, pest, uid) '+
     'VALUES ('+
     '22, 33, 0.4,'+
     '2014-05-04'+
      ', \'possum\', \'Matt\');';
/*
  sql_ct += 'INSERT INTO '+DATABASE+
     '(longitude, latitude, accuracy, datestamp, pest, uid) '+
     'VALUES ('+
			'22, 33, 0.4,'+
      new Date(2014, 5, 4, 5,10,0,0).toString()+
      ', \'house cat\', \'Matt\');';

  sql_ct += 'INSERT INTO '+DATABASE+
     '(longitude, latitude, accuracy, datestamp, pest, uid) '+
     'VALUES ('+
     '22.5, 33.5, 0.5,'+
      new Date(2014, 5, 4, 5,21,0,0).toString()+
      ', \'stoat\', \'Matt\');';
*/
	client = new pg.Client(connectionString);
  client.connect();

  query = client.query(sql_ct);

  query.on('end', function(err, result){
	  console.log("db new table query processed.");
    return res.send("new pestspotted db\n");
  });
});

// test get only, returns list of pests spotted. no details.
app.get('/pestspotted/all', function(req, res){
  console.log("MATT log note---> get pestspotted/all");
  var rows = [];
  var query = client.query('SELECT * FROM '+DATABASE+';');

  query.on('row', function(row, result){ 
    rows.push('{pest : '+row.pest+', date : '+row.datestamp+'}');
    console.log("row ID: " + row.ID + " pest: " +row.pest);
  });
  
  query.on('end', function(row, result){
    console.log("size : " + rows.length);
		var str = "";
    for(i = 0; i < rows.length; i++){
      str += "row : "+i+", value : "+rows[i] + "<br>";
    }
    res.send("List of pests in db :<br>" + str +"There are " + rows.length + " rows.");
  });
});



//=================================
// app get all results for this day
//=================================
app.get('/pestspotted/:date', function(req, res){
  console.log("MATT log note---> get pestspotted/:date");
  console.log("MATT log note---> date = "+ req.param('date'));

  if(!validateDate(req.param('date'))){
		return res.send(400, "Invalid date format. Use DD-MM-YYYY."); // 400 Bad Request, syntax.

  } else {
    console.log("MATT log note---> date validated.");
    var rows = [];
    var query = client.query('SELECT ID, pest, datestamp FROM '+DATABASE+
          ' WHERE datestamp >= ' + new Date(2014, 6, 4, 0,0,0,0)+' ;');
    console.log("MATT log note---> ####### HELLO");

    query.on('row', function(row, result){ 
      rows.push('{pest : '+row.pest+', date : '+row.datestamp+'}');
      console.log("row ID: " + row.ID + " pest: " +row.pest);
    });
  
    query.on('end', function(row, result){
      console.log("size : " + rows.length);
		  var str = "";
      for(i = 0; i < rows.length; i++){
        str += "row : "+i+", value : "+rows[i] + "<br>";
      }
      res.send("pests on this day :<br>" + str +"There are " + rows.length + " rows.");
    });
  }
});

//============================
// app post for pestspotted[2]
//============================
// curl localhost:5000/pestspotted2 -v -d '{"packet": {"position": {"longitude": "22", "latitude": "44", "accuracy": "0.5", "datestamp": "15 May"}, "auth": {"uid": "Matt", "accessToken": "possum"}}}' -H "Content-Type: application/json"

app.post('/pestspotted2', function(req, res) {
  if(!verifyInput_pestspotted(req, res)) return; // 400 error on fail, value missing

	if(!authorised(true)){ // TODO replace true with req
    res = setAuthenticateResponse(res);
		res.send(401, "User ID has not been recognised."); // 401 Unauthorized
  }else{
   //var newSpot = req.body.packet;
    var packet = req.body.packet;
    // create sql INSERT
    var sql_insert = 'INSERT INTO '+DATABASE+
     '(longitude, latitude, accuracy, datestamp, '+
//     'pest, '+
     'uid) '+
     'VALUES ( '+
     packet.position.longitude+', '+
      packet.position.latitude+', '+
      packet.position.accuracy+', '+
      packet.position.datestamp+', '+
//      packet.pest+', '+
      packet.auth.uid+
      ')';

    console.log('sql_insert : '+ sql_insert);

    // submit DB insert
    query = client.query(sql_insert);
    //query = client.query(LASTVAL());

    query.on('row', function(result){ // result should == _id
      console.log('result : '+result); // TODO revise the 2 log thing
/*      // create log note
      var resourceId = result;
      var text1 = "The user is "+packet.auth.uid+", reporting a "+packet.pest+".";
		  var text2 = "Longitude/Latitude/Accuracy is " + packet.position.longitude+"/"+packet.position.latitude+"/"+packet.position.accuracy;

      var response = {"resourceId": resourceId, "text1": text1, "text2": text2 }; 
      console.log(response + "\n"+sql_insert);
*/
      if(!result){ 
        return res.send('No data found.'); }
      else { 
        // feedback to client
        res.send(201, result); // 201 is success resource created
    	}
		});
  }
});

//=============================================================================
//===================== test methods, etc below this point =========================
// NB: keep helpers & server start at bottom...


//====================================
// dummy data
//====================================

var spots = [
  { position: { longitude : 174.7777222, latitude : -41.288889, accuracy: 0.0005, datestamp : '2014-04-20 1300'}, auth: {uid: 'Matt', accessToken : 'Possum'}},
  { position: { longitude : 174.7777222, latitude : -41.288889, accuracy: 0.0005, datestamp : '2014-04-20 1300'}, auth: {uid: 'Fred', accessToken : 'Stoat'}},
];

var pests = [
  {name : 'Possum', colour : 'grey', danger : 'eats trees', found : 'look in trees'},
  {name : 'Stoat', colour : 'black and white', danger : 'eats eggs', found : 'around tree bottoms'}
];

var users = [ 
	{userId : 'Matt', name : 'Matt Stevens', password : 'stuff'},
	{userId : 'Fred', name : 'Freddy Mercury', password : 'f'},
	{userId : 'Mike', name : 'Mike the Plumber', password : '56tygh'}
];
// end dummy data

//======================================
// original test post for pestspotted
//======================================
/* ****************************************************************** 
   test curl, nested jason format -> matches client side post request, hopefully...
   ******************************************************************
curl localhost:5000/pestspotted -v -d '{"packet": {"position": {"longitude": "22", "latitude": "44", "accuracy": "0.5", "datestamp": "15 May"}, "auth": {"uid": "Matt", "accessToken": "possum"}}}' -H "Content-Type: application/json"
*/
app.post('/pestspotted', function(req, res) {
  // TODO check for valid json?
  if(!verifyInput_pestspotted(req, res)) return;  // 400 error on fail, value missing

  var authorised = true; // TODO check user authentication

	if(authorised){
    // add to db (TODO just an array for now)
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
  /*==== GET ====*/
/* this appears to serve index.html from /views, without a get... */
app.use(express.static(__dirname + '/views'));

app.get('/matt', function(req, res) {
  res.statusCode = 502;
  res.setHeader("Set-Cookie", ["type=ninja", "language=javascript"]);

  ////...node.js method, write, write then end.
  ////...is not parsed as html text (set Content-Type = text/html)
  //res.setHeader("Content-Type", "text/html");
  //res.write('Matt testing...<br>');
  //res.end('Last testing text.');

  ////...sends files. Filepath, relative is ./views or views, absolute is /views
  ////...parses at html (set Content-Type = text/html)
  res.sendfile('./views/test.html');

  ////...not working, hangs up
  //res.render('./views/test.html', function(err, html){ 'I am a render.' });
  
  //res.send("Matt was here... bwahahaha");
});

app.get('/test', function(req, res){
  //...sends text
  //...parses as html (Content-Type = text/html)
  res.send('Server responds to \"test\".<br>');
});

app.get('/test/:id', function(req, res){
  if(req.param('id') == 'test'){
    res.sendfile('./views/test.html');
  }else if(req.param('id') == 'page' ||
           req.param('id') == 'testpage' ||
           req.param('id') == 'testpage.html'
      ){
    res.sendfile('./views/testpage.html');
  }else{
    res.send('Sorry, don\'t recognise that command.<br>');
  }
});

app.get('/pests/spotted', function(req, res) {
  res.send(spots);
});

app.get('/pests/:id', function(req, res){
  if(req.param('id') == 'possum'){
  	res.send(pests[0].name + ", fur is " + pests[0].colour);
  }else
  if(req.param('id') == 'stoat'){
  	res.send(pests[1].name + ", fur is " + pests[1].colour);
  }else {
  	res.send("Did not recognise that.");
  }
});

app.get('/pests/:id/:s', function(req, res){
  if(req.param('id') == 'possum' && req.param('s') == 'found'){
  	res.send(pests[0].found);
  }else
  if(req.param('id') == 'stoat' && req.param('s') == 'found'){
  	res.send(pests[1].found);
  }else {
  	res.send("Did not recognise that.");
  }
});

app.get('/error/:id', function(req, res) {
  res.send(req.param('id'), "Error : "+req.param('id'));
});


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

function authorised(req){
  if(req == true) return true; // TODO for testing, remove from production code
  
  return false;
}

function validateDate(d){
  var date = new String(d);
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
// TODO     req.body.packet.pest == undefined ||
     req.body.packet.auth == undefined ||
     req.body.packet.auth.uid == undefined ||
     req.body.packet.auth.accessToken == undefined
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
      "\n  uid: "+req.body.packet.auth.uid+
      "\n  accessToken: "+req.body.packet.auth.accessToken;
    var pestError = req.body.packet == undefined || req.body.packet.pest == undefined ? "undefined" :
      req.body.packet.pest;
    
    res.send('Error 400: A value is missing.\n' +  // 400 error, value missing
      "\npacket: "   +packetError+
      "\nposition: " +positionError+
// TODO      "\npest: "     +pestError+
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

