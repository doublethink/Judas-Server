//=============================
// config
var config = { };

config.DATABASE = "judas2DB"
config.USERDB = "userDB";

// should end in /
config.rootUrl = process.env.ROOT_URL || 'http://polar-forest-2324.herokuapp.com/';

config.facebook = {
    appId: process.env.FACEBOOK_APPID || '724664727600591',
    appSecret: process.env.FACEBOOK_APPSECRET || '68914e65743a43fae4fae9a258920c0e',
    appNamespace: process.env.FACEBOOK_APPNAMESPACE || 'snappest',
    scope: 'email, user_about_me, user_birthday, user_location, publish_stream',
    redirectUri: process.env.FACEBOOK_REDIRECTURI || config.rootUrl + 'login/callback'
};

// Can later use an algorithm to determine this.
config.pestSpottingLimit = 3;

//====================================
// dummy data for testing
//====================================

config.spots = [
  { position: { longitude : 174.7777222, latitude : -41.288889, accuracy: 0.0005, datestamp : '2014-04-20 1300'}, auth: {uid: 'Matt', accessToken : 'Possum'}},
  { position: { longitude : 174.7777222, latitude : -41.288889, accuracy: 0.0005, datestamp : '2014-04-20 1300'}, auth: {uid: 'Fred', accessToken : 'Stoat'}},
];

config.pests = [
  {name : 'Possum', colour : 'grey', danger : 'eats trees', found : 'look in trees'},
  {name : 'Stoat', colour : 'black and white', danger : 'eats eggs', found : 'around tree bottoms'}
];

config.users = [ 
	{userId : 'Matt', name : 'Matt Stevens', password : 'stuff'},
	{userId : 'Fred', name : 'Freddy Mercury', password : 'f'},
	{userId : 'Mike', name : 'Mike the Plumber', password : '56tygh'}
];
// end dummy data


module.exports = config;
