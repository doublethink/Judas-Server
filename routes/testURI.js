/*
 * Testing use of export for seperating out code functionality
 *
 */

var config = requires('../config');

// NB: have cut n pasted code here, pulled export test functions to the top.
// rest of file is commented out but kept as a personal node.js reference

// ~/test
exports.test = function(req, res){
  //...sends text
  //...parses as html (Content-Type = text/html)
  res.send('Server responds to \"test\".<br>');
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




/*
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



// test curl for authenticating user
// curl --request POST "localhost:5000/user" --data "userId=Matt&password=stuff"
app.post('/user', function(req,res){
 
//ref RFC2831 Digest SASL Authentication for steps to implement
//  NB: not a great security protocol, but gets basic securtity in place that can be upgraded later.
//  using qop = 'auth'
//  1. User has not recently authenticated
//  2. User has already authenticated and knows {userId, realm, qop and nonce}

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
