// NWEN304 Project

var express = require("express");
var logfmt = require("logfmt");
var pg = require('pg');

var app = express();
//app.engine('html', require('ejs').renderfile);
//app.set("view options", {layout: false});
//app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

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

// end dummy

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

// TODO create a file for this
var serverHomePage = 
"<br><h2>Members of Team Judas - I Greet You !!!</h2><br><br>" +
"Your Server-Master (err... aspring novice) Matt brings you stuff...<br>" +
" Home page, just serves you this text. Intended only as a team aid to exprimenting.<br>"+
" As more functionality is added, I will add brief notes here.<br><br>"+
" So far, these URI's exist:<br>"+
" All based on the prefix... judas.herokuapp.com <br><br>"+
" <b>GET</b><br>"+
" /test     ...returns a string \"Server responds to \"test\".<br>"+
" /matt     ...alternate test, will return a string starting with \"Matt\" and saying something random.<br>"+
" /pests/[possum, stoat]    ...returns the name, a little text and its colour, from dummy data.<br>"+
" /pests/[possum, stoat]/found    ...returns text from dummy data on where to look for the pest.<br>";

//======================================
// restful interface
//======================================
app.get('/', function(req, res) {
  res.send(serverHomePage);
});

app.get('/matt', function(req, res) {
  res.send("Matt was here... bwahahaha");
});

app.get('/test', function(req, res){
	res.send(404, 'Server responds to \"test\".<br>');
//	res.send(spots[0]);
});


app.get('/pests/:id', function(req, res){
  if(req.param('id') == 'possum'){
  	res.send(pests[0].name + ", fur is " + pests[0].colour);
  }else
  if(req.param('id') == 'stoat'){
  	res.send(pests[1].name + ", fur is " + pests[1].colour);
  }else {
  	res.send("here");
  }
});

app.get('/pests/:id/:s', function(req, res){
  if(req.param('id') == 'possum' && req.param('s') == 'found'){
  	res.send(pests[0].found);
  }else
  if(req.param('id') == 'stoat' && req.param('s') == 'found'){
  	res.send(pests[1].found);
  }else {
  	res.send("here");
  }
});


app.get('/pest1', function(req, res) {
  res.send("Matt is working on. Might return \"possum\" or \"chiwawa\".");
});



// end rest



//=====================================
// pestspotted code & dummy spots
//=====================================
app.use(logfmt.requestLogger());

app.post('/pestspotted', function(req, res) {
	console.log("   ### =============> Matt was here\n");
  console.log(req.body);
  console.log(req.params);
  console.log(req.param());
  console.log(req.query);
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

  quote.push(newSpot); // =======> quote should be spots?
  Console.log("Added new location");
  res.send(true);
});
// end pestspotted


//======================================
// server start
//======================================
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server
