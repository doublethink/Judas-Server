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
  , connectionString =  process.env.DATABASE_URL
  , config =            require('../config')
  , dbhelp =            require('./pestsdbHelpers')
  , USERDB   =          config.USERDB

  , APPID =             config.facebook.appId
  , APPSECRET =         config.facebook.appSecret;

FB.options({
    appId:              config.facebook.appId,
    appSecret:          config.facebook.appSecret,
    redirectUri:        config.facebook.redirectUri
});


//=======================================================================
// REGISTER USER on server, from client
// test post json object
// {"authResponse" : {"accessToken": "letMeInToo", "expiresIn": "00:09:00", "signedRequest": "signedByMatt", "userID": "Tywin"}, "email" : "test@test.com", "details" : {"first" : "Homer", "second" : "Simpson"}}

exports.register = function(req, res){
  console.log("MATT log note---> post register");

  // FBtoken is the Facebook authResponse token
  // https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/
  var FBtoken = req.body.authResponse;
  var email = req.body.email;
  var details = req.body.details;

if(FBtoken == null){
  res.send(401, "User token not recieved."); // 401 Unauthorized
//} else if(details == null){
//  res.send(401, "User details not recieved."); // 401 Unauthorized
} else {
pg.connect(connectionString, function(err, client, done) {
  var insert
    , uids = [];

  // does uid already exist?
  var query = client.query('SELECT uid FROM '+USERDB);
  query.on('row', function(row, result){
     uids.push(row.uid);
  });

  query.on('end',  function(row, result){
    console.log('MATT log existing uids---> '+uids.toString());
    console.log('MATT log FBtoken.userID---> '+FBtoken.userID);

  //=> YES, uid already exists
    if(uids.indexOf(FBtoken.userID) >= 0){
      console.log('MATT log notes---> '+FBtoken.uid+' is already in userdb');

      done();
      res.send(400, "This user already exists. No changes made."); // 400, Bad request

  //=> NO, insert a new uid
    } else {
      // create sql INSERT
      var sql_insert = 'INSERT INTO ' +USERDB+
         '(uid, email, details, FBtoken) ' +
         'VALUES ( \'' +
          FBtoken.userID +'\', \''+
          (email == undefined ? "" : email) +'\', \''+
          JSON.stringify(details == undefined ? "" : details) +'\', \''+
          JSON.stringify(FBtoken) +'\')';

      console.log('MATT log notes---> sql_insert : '+ sql_insert);

      // add to db
      query = client.query(sql_insert);

      // reply to client with id
      query.on('end', function(row, result){
        console.log('MATT log notes---> data inserted');
        console.log('MATT log notes---> userID : '+FBtoken.userID);
        done();
        res.send(201, '{"id" : "'+FBtoken.userID+'"}');                  // 201 is success resource created
      });
    }
  });
});
}
};


//=======================================================================
// ACCEPT FB response token, from client
// pre-requisite: body contains the Facebook authResponse token
// NB: not sure this is sufficient to be sure we are communicating with the phone app.
// tested post content -> {"authResponse" : {"accessToken": "letMeInToo", "expiresIn": "00:01:00", "signedRequest": "signedByMatt", "userID": "Bob"}}

exports.fbtoken_in = function(req, res){
  console.log("MATT log note---> post login");
  console.log("MATT log note---> req.session1 "+req.session.toString());
  console.log("MATT log note---> req.session2 "+req.session.access_token);
  console.log("MATT log note---> req.session3 "+req.session.userID);
  console.log("MATT log note---> req.session4 "+req.session.access_token.toString());
  console.log("MATT log note---> req.session5 "+req.session.userID.toString());

  // FBtoken is the Facebook authResponse token
  // https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/
  var FBtoken = req.body.authResponse;

if(FBtoken == null){
  res.send(401, "User token has not been recieved."); // 401 Unauthorized
} else {
pg.connect(connectionString, function(err, client, done) {

  var insert
    , uids = [];

  // does uid already exist?
  var query = client.query('SELECT uid FROM '+USERDB);
  query.on('row', function(row, result){
     uids.push(row.uid);
  });

  query.on('end',  function(row, result){
    console.log('MATT log existing uids---> '+uids.toString());
    console.log('MATT log FBtoken.userID---> '+FBtoken.userID);

  //=> YES, uid already exists
    if(uids.indexOf(FBtoken.userID) >= 0){
      console.log('MATT log notes---> '+FBtoken.uid+' is already in userdb');

      // create sql INSERT
      var sql_insert = 'UPDATE '+USERDB+
         ' SET fbtoken = \''+
          JSON.stringify(FBtoken)+
         '\' WHERE uid = \''+
          FBtoken.userID+
         '\';';
      console.log('MATT log notes---> sql_insert : '+ sql_insert);

      // add to db
      query = client.query(sql_insert);

      // reply to client with id
      query.on('end', function(row, result){
        console.log('MATT log notes---> data inserted');
        console.log('MATT log notes---> result : '+FBtoken.userID);
        done();
        res.send(201, '{"id" : "'+FBtoken.userID+'"}');                  // 201 is success resource created
      });

  //=> NO, user does not exist
    } else {
      console.log('MATT log notes---> '+FBtoken.uid+' is not in userdb');

      done();
      res.send(400, "This user does not exist. No changes made."); // 400, Bad Request
    }
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
  var admin = false;
//  var access_code = req.session.access_code;
//  console.log('MATT log access_code---> '+acess_code);
//  var userID = req.session.userID;
//  console.log('MATT log userID---> '+userID);
//  var userID = req.session.userID;
//  console.log('MATT log userID---> '+userID);


  admin = true;
  return admin;
}

exports.user = function(req){
  if(true) return true; // TODO

  res = setAuthenticateResponse(res);
  res.send(401, "User ID has not been recognised."); // 401 Unauthorized
  return false;
}


