/*
 * fbgraph
 * Library for authenticating with facebook
 * https://github.com/criso/fbgraph
 *
 */

var express   = require('express')
  , graph     = require('fbgraph') // fbgraph
  , config = require('../config');

// this should really be in a config file!
var conf = {
    client_id:      config.facebook.appId
  , client_secret:  config.facebook.appSecret
  , scope:          config.facebook.scope
  , redirect_uri:   config.facebook.redirectUri
};

exports.login = function(req, res) {

  // we don't have a code yet
  // so we'll redirect to the oauth dialog
  if (!req.query.code) {
    var authUrl = graph.getOauthUrl({
        "client_id":     conf.client_id
      , "redirect_uri":  conf.redirect_uri
      , "scope":         conf.scope
    });

    if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
      res.redirect(authUrl);
    } else {  //req.query.error == 'access_denied'
      res.send('access denied');
    }
    return;
  }

  // code is set
  // we'll send that and get the access token
  graph.authorize({
      "client_id":      conf.client_id
    , "redirect_uri":   conf.redirect_uri
    , "client_secret":  conf.client_secret
    , "code":           req.query.code
  }, function (err, facebookRes) {
        console.log('MATT log note---> '+facebookRes);
graph.setAccessToken(facebookRes);
    res.redirect('matt.html');
  });


var wallPost = {
  message: "I'm gonna come at you like a spider monkey, chip!"
};

graph.post("/feed", wallPost, function(err, res) {
  // returns the post id
  console.log(res); // { id: xxxxx}
});

};


// user gets sent here after being authorized
exports.loginCallback = function(req, res) {
  res.render("report.html", { title: "Logged In" });
};


