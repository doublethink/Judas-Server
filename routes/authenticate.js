/*
 * Authenticate user
 * 
 * User logs into Phonegap application.
 * Phonegap application authenticates user with Facebook and recieves a access token
 * Phonegap passes token to Server post json token /FBtoken_in
 * Server seeks long lived token from FBtoken
 * Server saves long lived token to db
 * From here server can access FB on behalf of user (assuming permissions)
 */

var pg =                require('pg')
  , FB =                require('fb')
//  , Step =              require('step')
//  , crypto =            require('crypto')
  , connectionString =  process.env.DATABASE_URL;

var config =            require('../config')
//  , auth   =            require('./authenticate')
  , dbhelp =          require('./pestsdbHelpers');

var USERDB   =          config.USERDB;

var APPID = config.facebook.appId
  , APPSECRET = config.facebook.appSecret;

FB.options({
    appId: config.facebook.appId,
    appSecret: config.facebook.appSecret,
    redirectUri: config.facebook.redirectUri
});



//=======================================================================
// accept and store the FB response token
// pre-requisite: body contains the Facebook authResponse token
// NB: not sure this is sufficient to be sure we are communicating with the phone app.
// tested post content -> {"authResponse" : {"accessToken": "letMeInToo", "expiresIn": "00:01:00", "signedRequest": "signedByMatt", "userID": "Bob"}}

exports.fbtoken_in = function(req, res){
  console.log("MATT log note---> post login");

  // FBtoken is the Facebook authResponse token
  // https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/
  var FBtoken = req.body.authResponse;

if(FBtoken == null){
  res.send(401, "User token has not been recieved."); // 401 Unauthorized
} else {
pg.connect(connectionString, function(err, client, done) {

  var insert;

  // create sql INSERT
  var sql_insert = 'INSERT INTO '+USERDB+
       '(uid, FBtoken) '+
       'VALUES ( \''+
        FBtoken.userID+'\', \''+
        JSON.stringify(FBtoken) +'\')';
  console.log('MATT log notes---> sql_insert : '+ sql_insert);

  // add to db
  client.query(sql_insert);
  query = client.query('SELECT count(*) FROM '+USERDB);

  // get most the id based on count
  query.on('row', function(row, result){
    insertId = row.count;
  });

  // reply to client with id
  query.on('end', function(row, result){
    console.log('MATT log notes---> data inserted');
    console.log('MATT log notes---> result : '+insertId);
    res.send(201, '{"id" : "'+insertId+'"}');                  // 201 is success resource created
  });
});
}};

/*
//===============================================
// Get FB application access token
// php version $appsecret_proof= hash_hmac('sha256', $access_token, $app_secret); 
// ### This launched straight away...

FB.api('oauth/access_token', {
    client_id: 'app_id',
    client_secret: 'app_secret',
    grant_type: 'client_credentials'
}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }

    var accessToken = res.access_token;
});
*/


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

exports.setResponse = function(res){
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

exports.admin = function(req){
  if(true) return true; // TODO

  return false;
}

exports.user = function(req){
  if(true) return true; // TODO

  res = setAuthenticateResponse(res);
  res.send(401, "User ID has not been recognised."); // 401 Unauthorized
  return false;
}


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
