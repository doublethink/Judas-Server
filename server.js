// NWEN304 Project

var express = require("express");
var logfmt = require("logfmt");
var app = express();
//app.engine('html', require('ejs').renderfile);
//app.set("view options", {layout: false});
//app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

//=====================================
// cribbed from devcenter.heroku.com/articles/getting-started-with-nodejs
// hooks up the postgres db
//=====================================
var pg = require('pg');

pg.connect(process.env.DATABASE_URL, function(err, client, done) {
  client.query('SELECT * FROM your_table', function(err, result) {
    done();
		console.log("   ### =============> Matt was here line 22ish\n");
    if(err) return console.error(err);
    console.log(result.rows);
  });
});
// end crib
// ====================================


//======================================
// restful interface
//======================================
app.get('/', function(req, res) {
  res.send('Hello World!\nMatt was here...\n\n');
});

// end rest
//======================================


//=====================================
// pestspotted code & dummy spots
//=====================================
app.use(logfmt.requestLogger());

var spots = [
  { timestamp : '2014-04-20 1300', longitude : 174.7777222, latitude : -41.288889, userid: '12345'},
  { timestamp : '2014-04-20 1310', longitude : 174.7777222, latitude : -41.288889, userid: '10000'},
];

app.get('/matt', function(req, res){
	res.send(404, 'Matt responds to you.\n\n');
	res.send(spots[0]);
});


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


//======================================
// server
//======================================
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
// end server
//======================================
