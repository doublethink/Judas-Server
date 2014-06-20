/*
 * Sample code from Node.js github repository
 * https://github.com/Thuzi/facebook-node-sdk/blob/master/samples/scrumptious/routes/home.js
 */


var FB = require('fb'),
    Step = require('step'),
    config = require('../config');

FB.options({
    appId: config.facebook.appId,
    appSecret: config.facebook.appSecret,
    redirectUri: config.facebook.redirectUri
});

exports.index = function(req, res) {
    if(!req.session){ req.session = {"access_token": ""};}
    var accessToken = req.session.access_token;
    if(!accessToken) {
        console.log('MATT log note---> need access_token');
        res.render('../views/testFBlogin.html', {
            title: 'Express',
            loginUrl: FB.getLoginUrl({ scope: 'user_about_me' })
        });
    } else {
        console.log('MATT log note---> got an access_token');
        res.render('../views/index.html');
    }
};

exports.loginCallback = function (req, res, next) {
    if(!req.session){ req.session = {"access_token": ""};}
    var code = req.query.code;
    console.log('MATT log loginCallBack code ---> '+code);

    if(req.query.error) {
        // user might have disallowed the app
        return res.send('login-error ' + req.query.error_description);
    } else if(!code) {
        return res.redirect('/');
    }

    Step(
        function exchangeCodeForAccessToken() {
            console.log('MATT log note---> exchangeCodeForAccessToken');
            FB.napi('oauth/access_token', {
                client_id: FB.options('appId'),
                client_secret: FB.options('appSecret'),
                redirect_uri: FB.options('redirectUri'),
                code: code
            }, this);
        },
        function extendAccessToken(err, result) {
            if(err) throw(err);
            console.log('MATT log note---> extendAccessToken');
            FB.napi('oauth/access_token', {
                client_id: FB.options('appId'),
                client_secret: FB.options('appSecret'),
                grant_type: 'fb_exchange_token',
                fb_exchange_token: result.access_token
            }, this);
        },
        function (err, result) {
            if(err) return next(err);

            req.session.access_token = result.access_token;
            req.session.expires = result.expires || 0;

            if(req.query.state) {
                var parameters = JSON.parse(req.query.state);
                console.log('MATT log parameters---> '+parameters);
                parameters.access_token = req.session.access_token;

                  FB.api('/me/feed', post, { "message" : "Hello world"}, function(result){
//                FB.api('/me/' + config.facebook.appNamespace +':eat', 'post', parameters , function (result) {
                    console.log(result);
                    if(!result || result.error) {
                        return res.send(500, result || 'error');
                        // return res.send(500, 'error');
                    }

                    return res.redirect('/');
                });
            } else {
                console.log('MATT log access_token---> '+req.session.access_token);
                console.log('MATT log expires---> '+req.session.expires);
                // save the access_token
                res.json({authResponse : req.session.access_token});

                return res.redirect('/');
            }
        }
    );
};

exports.logout = function (req, res) {
    console.log('MATT log note---> logout');
    req.session = null; // clear session
    res.redirect('/');
};

