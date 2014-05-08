// NWEN304 Project
//===================================

var express = require("express");
var logfmt = require("logfmt");
var pg = require('pg');
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
  { timestamp : '2014-04-20 1300', longitude : 174.7777222, latitude : -41.288889, userid: '12345'},
  { timestamp : '2014-04-20 1310', longitude : 174.7777222, latitude : -41.288889, userid: '10000'},
];

var pests = [
  {name : 'Possum', colour : 'grey', danger : 'eats trees', found : 'look in trees'},
  {name : 'Stoat', colour : 'black and white', danger : 'eats eggs', found : 'around tree bottoms'}
];
// end dummy data

//=====================================
// cribbed from devcenter.heroku.com/articles/getting-started-with-nodejs
// hooks up the postgres db
//=====================================
/*
pg.connect(process.env.DATABASE_URL, function(err, client, done) {
  client.query('SELECT * FROM your_table', function(err, result) {
    done();
		console.log("   ### =============> Matt was here line 22ish\n");
    if(err) return console.error(err);
    console.log(result.rows);
  });
});
*/
// end crib


//======================================
// restful interfaces
//======================================
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

app.post('/fish', function(req, res) {
  res.send("Fish : " + req.param('fred') + "\nMike : " + req.param('mike'));
});

app.post('/fish', function(req, res) {
  res.send("Fish : " + req.param('fred') + "\nMike : " + req.param('mike'));
});

// test curl for pestspotted
// curl --request POST "localhost:5000/pestspotted" --data "longitude=22&latitude=44&userid=Matt"
app.post('/pestspotted', function(req, res) {
	console.log("   ### =============> Matt was here\n");
  console.log(req.body);
  console.log(req.body.longitude);
  console.log(req.body.latitude);
  console.log(req.body.userid);
	console.log("\n   ### =============> Matt was here\n");
  if(!req.body.hasOwnProperty('longitude') || !req.body.hasOwnProperty('latitude') || !req.body.hasOwnProperty('userid')) 
	{
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  var newSpot = {
    timestamp : Date.now().toString(),
    longitude : req.body.longitude,
    latitude : req.body.latitude,
    userid : req.body.userid
  };

  spots.push(newSpot);
  console.log("New pest spotted data is " + spots[spots.length -1]); // TODO check sizeof array syntax
  console.log("Added new location\r\n\r\n");
  res.send(201, true); // 201 is success resource created
});

// test curl for authenticating user
// curl --request POST "localhost:5000/user" --data "user=Matt&password=stuff"
app.post('/user', function(req,res){
	console.log("Authenticating user.")
	if(res.body.user == null || res.body.password == null){
		console.log("No user or password supplied.");
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
		res.send(401, false); // TODO per wikipedia, need to add a WWW-Authenticate header field to response
	}
	if(res.body.user == "Matt" && res.body.password == "stuff"){
		console.log("Supplied user and password match.");
		res.send(200, true);
	} else{
		console.log("Supplied user and password failed.");
		res.send(401, false);  // TODO if 401 responce works, repeat here
	}
	
	console.log("Authentication should not get here...");
	res.send(400, false);
})
// end rest

//======================================
// server start
//======================================
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server
