/*
 * Testing use of export for seperating out code functionality
 *
 */

var config =             require('../config')
  , pg =                 require('pg')
  , connectionString =   process.env.DATABASE_URL
  , FB =                 require('fb')
  , access_token;

//client.connect();
var mydb = "visits";

// ~/test
exports.test = function(req, res){
  //...sends text
  //...parses as html (Content-Type = text/html)
  res.send('Server responds to \"test\".<br>');
};

// ~/fbToken
exports.fbToken = function(req, res){
  console.log('MATT log notes---> ~/fbToken');
  FB.api('oauth/access_token', {
      client_id:      config.facebook.appId,
      client_secret:  config.facebook.appSecret,
      grant_type:     'client_credentials'
  }, function (res) {
      if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
      }

    accessToken = res.access_token;
    FB.setAccessToken(access_token);
});
};

// ~/fbFeed
// testing facebook posts.

exports.fbFeed = function(req, res){
  console.log('MATT log notes---> ~/fbFeed');
  var body = 'My first post using facebook-node-sdk';
  FB.api('me/feed', 'post', { "message": body}, function (res) {
    if(!res || res.error) {
      console.log(!res ? 'error occurred' : res.error);
      return;
    }
    console.log('Post Id: ' + res.id);
  });
  res.send(200, "done...");
};

// ~/error/:id
// tests http error code response
exports.errorid = function(req, res) {
  res.send(req.param('id'), "Error : "+req.param('id'));
};

// ~/matt
exports.testMatt = function(req, res) {
  res.statusCode = 502;
  res.setHeader("Set-Cookie", ["type=ninja", "language=javascript"]);

  //...node.js method, write, write then end.
  //...is not parsed as html text (set Content-Type = text/html)
  //res.setHeader("Content-Type", "text/html");
  //res.write('Matt testing...<br>');
  //res.end('Last testing text.');

  //...sends files. Filepath, relative is ./views or views, absolute is /views
  //...parses at html (set Content-Type = text/html)
  res.sendfile('./views/test.html');

  //...not working, hangs up
  //res.render('./views/test.html', function(err, html){ 'I am a render.' });
  
  //res.send("Matt was here... bwahahaha");
};

// ~/test/:id
exports.testid = function(req, res){
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
};



//====================================
// dummy data
var spots = config.spots;
var pests = config.pests;
var users = config.users;
//===================================
// using dummy data

// ~/pests/spotted
exports.pestsspotted = function(req, res) {
  res.send(spots);
};

// ~/pests/:id
exports.pestsid = function(req, res){
  if(req.param('id') == 'possum'){
  	res.send(pests[0].name + ", fur is " + pests[0].colour);
  }else
  if(req.param('id') == 'stoat'){
  	res.send(pests[1].name + ", fur is " + pests[1].colour);
  }else {
  	res.send("Did not recognise that.");
  }
};

// ~/pests/:id/:s
exports.pestsidfound = function(req, res){
  if(req.param('id') == 'possum' && req.param('s') == 'found'){
  	res.send(pests[0].found);
  }else
  if(req.param('id') == 'stoat' && req.param('s') == 'found'){
  	res.send(pests[1].found);
  }else {
  	res.send("Did not recognise that.");
  }
};

//=====================================
// test Postgresql database
// everything happens inside a query.on listener for {row, end, err}.
// outside that, its just variable assignment.
// a query can accept serial sql instructions.
exports.dbnew = function(req, res){
  console.log("MATT log note---> get db/new");
  pg.connect(connectionString, function(err, client, done) {
    var date = new Date();

    query = client.query('DROP TABLE '+mydb+'; CREATE TABLE '+mydb+'(date date);');
    console.log("MATT log note---> post query");

    query.on('error', function(err){
      console.log('MATT error noted --->', err); });

    query.on('end', function(result){ 
      console.log("db new table query processed.");
      res.send("new db\n");
      done();
    });
  });
};


exports.dbvisitsi = function(req, res){
  console.log("MATT log note---> get db/visits/i");
  pg.connect(connectionString, function(err, client, done) {
    var date = new Date();

    client.query('INSERT INTO '+mydb+'(date) VALUES ($1)', [date]);
    var query = client.query('SELECT COUNT(date) AS count FROM '+mydb+' WHERE date = $1', [date]);
    console.log("MATT log note---> post query");

    query.on('row', function(row){
      console.log('MATT log ---> result : '+row.count);
      if(!row){ 
        console.log('MATT !row ---> true');
        res.send('No data found.'); }
      else { 
        console.log('MATT !row ---> false');
        res.send(200, 'Visits today : ' + row.count); }
    });

    query.on('error', function(err){
      console.log('MATT error noted --->', err); });

    query.on('end', function(result){ done(); });
  });
};


exports.dbvisits = function(req, res){
  console.log("MATT log note---> get db/visits");
  pg.connect(connectionString, function(err, client, done) {
    var rows = []
      , query = client.query('SELECT * FROM ' + mydb);

    query.on('row', function(row){
      console.log("MATT log note---> query.on row");
      rows.push(row.date);
      console.log("MATT log row : " + row.date);
    });

    query.on('error', function(err){
      console.log('MATT error noted --->', err); });

    query.on('end', function(result){ 
      console.log("MATT log note---> size : " + rows.length);
		  var str = "";
      for(i = 0; i < rows.length; i++){
        str += "row : "+i+", value : "+rows[i] + "<br>";
      }

      console.log("MATT log note---> value i : " + i);
      res.send(200, "Database holds :<br>" + str +"There are " + rows.length + " rows.");
      done();
    });
  });
}; // end test Postgresql database


