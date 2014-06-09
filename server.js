// NWEN304 Project
//===================================


var mydb = "visits";

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

//====================================
// dummy data
//====================================

var spots = [
  { position: { longitude : 174.7777222, latitude : -41.288889, accuracy: 0.0005, timestamp : '2014-04-20 1300'}, auth: {uid: 'Matt', accessToken : 'Possum'}},
  { position: { longitude : 174.7777222, latitude : -41.288889, accuracy: 0.0005, timestamp : '2014-04-20 1300'}, auth: {uid: 'Fred', accessToken : 'Stoat'}},
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

//=====================================
// database
// everything happens inside a query.on listener for {row, end, err}.
// outside that, its just variable assignment.
// a query can accept serial sql instructions.
//=====================================
app.get('/db/new', function(req,res){

  var myQuery = 'DROP TABLE '+mydb+'; CREATE TABLE '+mydb+'(date date)';

	client = new pg.Client(connectionString);
  client.connect();

  query = client.query(myQuery);
  query.on('end', function(result){ client.end(); });

	console.log("db new table query processed.");

  res.send("new db\n");
});


app.get('/db/visits/i', function(req,res){
	var date = new Date();
  var myquery = String.format('INSERT INTO '+mydb+'(date) VALUES ($1)', [date]);
  client.query(myquery);
  query = client.query('SELECT COUNT(date) AS count FROM '+mydb+' WHERE date = $1', [date]);

  query.on('row', function(result){ 
    console.log('result : '+result);
    if(!result){ 
      return res.send('No data found.'); }
    else { 
      res.send('Visits today : ' + result.count); }
  });
});


app.get('/db/visits', function(req, res){
  var rows = [];
  var myquery = 'SELECT * FROM ' +mydb;
  var query = client.query(myquery);

  query.on('row', function(row, result){ 
    rows.push(row.date);
    console.log("row : " + row.date);
  });

  query.on('end', function(row, result){ 
    console.log("size : " + rows.length);
		var str = "";
    for(i = 0; i < rows.length; i++){
      str += "row : "+i+", value : "+rows[i] + "<br>";
    }
    res.send("Datebase holds :<br>" + str +"There are " + rows.length + " rows.");
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
/* ****************************************************************** 
   test curl, nested jason format -> matches client side post request, hopefully...
   ******************************************************************
curl localhost:5000/pestspotted -v -d '{"packet": {"position": {"longitude": "22", "latitude": "44", "accuracy": "0.5", "timestamp": "15 May"}, "auth": {"uid": "Matt", "accessToken": "possum"}}}' -H "Content-Type: application/json"
*/
app.post('/pestspotted', function(req, res) {
  // TODO check for valid json?
  // verify input -> everything is present
  if(
     req.body.packet == undefined ||
     req.body.packet.position == undefined ||
     req.body.packet.position.longitude == undefined ||
     req.body.packet.position.latitude == undefined ||
     req.body.packet.position.accuracy == undefined ||
     req.body.packet.position.timestamp == undefined ||
     req.body.packet.auth == undefined ||
     req.body.packet.auth.uid == undefined ||
     req.body.packet.auth.accessToken == undefined
    ){
    res.statusCode = 400;
    var packetError = req.body.packet == undefined ? "undefined, please provide a root element." : "";
    var positionError = req.body.packet == undefined || req.body.packet.position == undefined ? "undefined" :
      "\n  longitude: "+req.body.packet.position.longitude+
      "\n  latitude: "+req.body.packet.position.latitude+
      "\n  accuracy: "+req.body.packet.position.accuracy+
      "\n  timestamp: "+req.body.packet.position.timestamp;
		var authError = req.body.packet == undefined || req.body.packet.auth == undefined ? "undefined" :
      "\n  uid: "+req.body.packet.auth.uid+
      "\n  accessToken: "+req.body.packet.auth.accessToken;
    return res.send('Error 400: A value is missing.\n' +
      "\npacket: "+packetError+
      "\nposition: "+positionError+
      "\nauth: "+authError);
  }

  // check user authentication TODO
  var authorised = true;
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

//    var result = "{result : ";
//		result += "{ resourceId : " + (spots.length-1) + "}";
//    result += "{text1 : The user is "+record.auth.uid+", the access token is "+record.auth.accessToken+".}";
//    result += "{text2 : Longitude/Latitude/Accuracy is ";
//    result += record.position.longitude+"/"+record.position.latitude+"/"+record.position.accuracy+"}";
//    result += "}"

    console.log(result);

    // feedback to client
    res.send(201, result); // 201 is success resource created
  }else{
    res = setAuthenticateResponse(res);
		res.send(401, "ID has not been recognised."); // 401 Unauthorized
  }
});

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
// end helpers

//======================================
// server start
//======================================
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server
