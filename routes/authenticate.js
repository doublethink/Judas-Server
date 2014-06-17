

/*
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
