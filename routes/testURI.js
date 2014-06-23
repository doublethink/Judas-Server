/*
 * Testing use of export for seperating out code functionality
 *
 */

var config =             require('../config')
  , pg =                 require('pg')
  , connectionString =   process.env.DATABASE_URL
  , FB =                 require('fb')
  , auth   =             require('./authenticate')
  , dbh =                require('./pestsdbHelpers')
  , access_token
  , mydb = "visits"
  , DATABASE =          config.DATABASE;


//===================================================================
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


exports.pestspottedAll= function(req, res){
  res.redirect('/pestspotted_all/text');
};
//=======================================================
// Returns list of all pests spotted. 
// Limited details, can expand on request from team
exports.pestspottedAllJson = function(req, res){
  console.log("MATT log note---> get pestspotted/all");
if(auth.admin(req)){
  console.log('MATT log notes---> Passed authentication.');
pg.connect(connectionString, function(err, client, done) {

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
    res.set({"Cache-Control": "no-store"});
		var str = "";
    if(req.param('json') == "json"){
      var first = true;
      for(i = 0; i < rows.length; i++){
        if(!first){ str += ', ' };
        str += '{row : '+(i+1)+', value : '+rows[i] + '}';
        first = false;
      }
      res.json(200, '{packet : [' + str + ']}');
    } else {  
      for(i = 0; i < rows.length; i++){
        str += "row : "+(i+1)+", value : "+rows[i] + "<br>";
      }
      res.send(200,"List of pests in db :<br>" + str +"There are " + rows.length + " rows.");
    }
    done();
  });
});}
};

exports.pestspotted_onDate = function(req, res){
  res.redirect('/pestspotted_on/' + req.param('date')+'/text');
};
//=======================================================================
// get all pests logged for this day
// Day format must equal DD-MM-YYYY for example /pestspotted_on/04-05-2014
exports.pestspotted_onDateJson = function(req, res){
  console.log("MATT log note---> get pestspotted/:date");
if(auth.admin(req)){
  console.log('MATT log notes---> Passed authentication.');
pg.connect(connectionString, function(err, client, done) {

  if(!dbh.validateDate(req.param('date'))){
 	return res.send(400, "Invalid date format. Use DD-MM-YYYY."); // 400 Bad Request, syntax.
  } else {
    console.log("MATT log note---> date validated.");

  // format date to match db format
    var date = dbh.formatDate(req.param('date'));

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
      res.set({"Cache-Control": "no-store"});
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
      done();
    });
  }
});}
};

// NOTEPAD, old code kept for the moment

/*
//=====================================================================
// respond with the Facebook authResponse token
// pre-requisite: Body contains json {"userID": "xxx"}
// prerequisite: userID value matches the userID in the token
// tested post content -> {"userID": "Matt"}

exports.fbtoken_out = function(req, res){
  console.log("MATT log note---> post login");

  var FBuserID = req.body.userID
    , FBtoken;

if(FBuserID == null){
  res.send(401, "UserID has not been recieved."); // 401 Unauthorized
} else {
pg.connect(connectionString, function(err, client, done) {
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
});
}};
*/


// test curl for authenticating user
// curl --request POST "localhost:5000/user" --data "userId=Matt&password=stuff"
//app.post('/user', function(req,res){
/* 
ref RFC2831 Digest SASL Authentication for steps to implement
  NB: not a great security protocol, but gets basic securtity in place that can be upgraded later.
  using qop = 'auth'
  1. User has not recently authenticated
  2. User has already authenticated and knows {userId, realm, qop and nonce}


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
*/
