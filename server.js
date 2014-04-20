var express = require("express");
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());

var spots = [
  { timestamp : '2014-04-20 1300', longitude : 174.7777222, latitude : -41.288889, userid: '12345'},
  { timestamp : '2014-04-20 1310', longitude : 174.7777222, latitude : -41.288889, userid: '10000'},
];

app.post('/pestspotted', function(req, res) {
  console.log(req.body);
  if(!req.body.hasOwnProperty('longitude') || !req.body.hasOwnProperty('latitude') || !req.body.hasOwnProperty('userid')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  var newSpot = {
    timestamp : Date.now().toString(),
    longitude : req.body.longitude,
    latitude : req.body.latitude,
    userid : req.body.userid
  };

  quote.push(newSpot);
  Console.log("Added new location");
  res.send(true);
});

app.get('/', function(req, res) {
  res.send('Hello World!');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});