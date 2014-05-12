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
  { timestamp : '2014-04-20 1300', longitude : 174.7777222, latitude : -41.288889, userid: 'Matt', name : 'Possum'},
  { timestamp : '2014-04-20 1310', longitude : 174.7777222, latitude : -41.288889, userid: 'Fred', name : 'Stoat'},
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
//=====================================
app.get('/db/new', function(req,res){

  var myQuery = 'DROP TABLE '+mydb+'; CREATE TABLE '+mydb+'(date date)';

	client = new pg.Client(connectionString);
  client.connect();

  query = client.query(myQuery);
  query.on('end', function(result){ client.end(); });

	console.log("db new table query processed.");
  //pg.connect(connectionString, function(err, client, done) {
    //client.query(myQuery, function(err, result) {
      //done();
		  //console.log("   ### =============> Matt was here line 22ish\n");
      //if(err) return console.error(err);
      //console.log(result.rows);
    //});
  //});
  res.send("new db\n");
});


app.get('/db/i', function(req,res){
	var date = new Date();

  client.query('INSERT INTO '+mydb+'(date) VALUES ($1)', [date]);
	console.log("db insert query processed.");

  query = client.query('SELECT COUNT(date) AS count FROM '+mydb+' WHERE date = $1', [date]);
	console.log("db count query processed.");

  query.on('row', function(result){ 
    console.log('result : '+result);

    if(!result){ 
      return res.send('No data found.'); }
    else { 
      res.send('Visits today : ' + result.count); }
  });

	console.log("db should not get here.");
});


app.get('/db', function(req, res){
  var size = -1;

  var query = client.query('SELECT * FROM ' +mydb);//', [mydb]);
	console.log("here");

  query.on('row', function(row, result){ 
    result.addRow(row);
    console.log("row : " + row.date);
  });

	console.log("db query ended.");

  query.on('end', function(row, result){ 
    size = result.rows.length;
    console.log("size : " + size);
  });

  res.send("row count is : "+size);

//  console.log("row : start of loop");
//  for(r = 0; r < rows.length; r++){
//  	console.log("row : " + rows[r]);
//  }

  
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

app.get('/pests/spotted', function(req, res) {
  res.send(spots);
});

  /*====== POST ======*/
app.post('/fish', function(req, res) {
  res.send("Fish : " + req.param('fred') + "\nMike : " + req.param('mike'));
});

// test curl for pestspotted
// curl --request POST "localhost:5000/pestspotted" --data "longitude=22&latitude=44&userid=Matt&name=possum"
app.post('/pestspotted', function(req, res) {
	//console.log("   ### =============> Matt was here\n");
  //console.log(req.body);
  //console.log(req.body.longitude);
  //console.log(req.body.latitude);
  //console.log(req.body.userid);
  //console.log(req.body.name);
  if(!req.body.hasOwnProperty('longitude') ||
     !req.body.hasOwnProperty('latitude') ||
     !req.body.hasOwnProperty('userid') ||
     !req.body.hasOwnProperty('name')
    ){
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  var newSpot = {
    timestamp : Date.now().toString(),
    longitude : req.body.longitude,
    latitude : req.body.latitude,
    userid : req.body.userid,
    name : req.body.name
  };

  spots.push(newSpot);
  console.log("New pest spotted data is ");
  console.log(spots[spots.length -1]);
  console.log("Added new location\r\n\r\n");
  var result = "{ resourceId : " + (spots.length-1) + "}";
  res.send(201, result); // 201 is success resource created
});

// test curl for authenticating user
// curl --request POST "localhost:5000/user" --data "userId=Matt&password=stuff"
// ref RFC2831 Digest SASL Authentication for steps to implement
//   NB: not a great security protocol, but gets basic securtity in place that can be upgraded later.
//   using qop = 'auth'
//   1. User has not recently authenticated
//   2. User has already authenticated and knows {userId, realm, qop and nonce}
app.post('/user', function(req,res){
  console.log("Authenticating user.")
  if(req.body.userId == null || req.body.password == null){
    console.log("No user or password supplied.");
    res = setAuthenticateResponse(res);
    res.send(401, false); 
  }
  for (i in users){
    //console.log("userId : " + users[i].userId);
    //console.log("password : " + users[i].password);
    if(req.body.userId == users[i].userId && req.body.password == users[i].password){
      console.log("Supplied user and password match.");
      res.send(200, true);
			return;
    }
  }
  console.log("Supplied user and password failed.");
  //console.log("userId : " + req.body.userId);
  //console.log("password : " + req.body.password);
  res = setAuthenticateResponse(res)
  res.send(401, false);
});
// end rest

//======================================
// helpers
//======================================
function setAuthenticateResponse(res, message){
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
