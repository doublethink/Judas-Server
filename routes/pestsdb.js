/*
 * Pests database queries
 *
 */

var pg =                require('pg')
  , connectionString =  process.env.DATABASE_URL;

var config =            require('../config')
  , auth   =            require('./authenticate')
  , dbhelp =            require('./pestsdbHelpers');

var DATABASE =          config.DATABASE;


//============================
// ADD PEST to database, returns the id
// post ~/pestspotted

// curl localhost:5000/pestspotted2 -v -d '{"packet": {"position": {"longitude": "22", "latitude": "44", "accuracy": "0.5", "datestamp": "15 May 2014"}, "pest" : "rabbit", "auth": {"uid": "Matt"}}}' -H "Content-Type: application/json"

exports.pestspotted = function(req, res) {
  console.log('MATT log notes---> post /pestspotted');
if(auth.user(req)){
  console.log('MATT log notes---> Passed authentication.');
pg.connect(connectionString, function(err, client, done) {

  if(!dbhelp.verifyPestInput(req, res)){ return }; // 400 error on fail, value missing

  var packet = req.body.packet
    , insertId;

  // create sql INSERT
  var sql_insert = 'INSERT INTO '+DATABASE+
       '(longitude, latitude, accuracy, datestamp, pest, uid) '+
       'VALUES ( '+
        packet.position.longitude+', '+
        packet.position.latitude+', '+
        packet.position.accuracy+', \''+
        packet.position.datestamp+'\', \''+
        packet.pest+'\', \''+
        packet.auth.uid+'\')';
  console.log('MATT log notes---> sql_insert : '+ sql_insert);

  // add to db
  client.query(sql_insert);
  query = client.query('SELECT count(*) FROM '+DATABASE);

  // get most recent inserts id based on row count
  query.on('row', function(row, result){
    insertId = row.count;
  });

  // reply to client with id
  query.on('end', function(row, result){
    console.log('MATT log notes---> result : '+insertId);
    res.set({"Cache-Control": "no-store"});
    res.send(201, '{"id" : "'+insertId+'"}');    // 201 is success resource created
    done();
  });
});}
};



function formatDate(date){
    var split = date.split('-').reverse();
    date = split.toString().replace(",","-").replace(",","-"); // odd, needs replace twice
    console.log("MATT log note---> date = "+ date);
    return date;
}



//=======================================================================
// TOTAL PESTS logged by this user
// NB: user is case sensitive
exports.pestspottedUser = function(req, res){
  console.log("MATT log note---> get pestspotted/:user");

if(auth.user(req)){
  console.log('MATT log notes---> Passed authentication.');
pg.connect(connectionString, function(err, client, done) {

  // conduct search
  var count;
  var query = client.query('SELECT count(*) FROM '+DATABASE+
      ' WHERE uid = \''+ req.param('user') +'\';');

  // build result
  query.on('row', function(row, result){ 
    count = row.count;
  });

  // send it back to client
  query.on('end', function(row, result){
    res.set({"Cache-Control": "no-store"});
    res.json('{count : ' + count +', reqest: \'get pestspotted/:user\'}');
    done();
  });
});}
};

//======================================================================
// TOTAL SPECIFIC PEST logged by this user
exports.pestspottedUserPest = function(req, res){
  console.log("MATT log note---> get pestspotted/:user/:pest");
if(auth.user(req)){
  console.log('MATT log notes---> Passed authentication.');
pg.connect(connectionString, function(err, client, done) {

  // conduct search
  var count;
  var query = client.query('SELECT count(*) FROM '+DATABASE+
      ' WHERE uid = \''+ req.param('user') +'\' AND pest = \''+ req.param('pest') +'\';');

  // build result
  query.on('row', function(row, result){ 
    count = row.count;
  });

  // send it back to client
  query.on('end', function(row, result){
    res.set({"Cache-Control": "no-store"});
    res.json('{count : ' + count +', request: \'get pestspotted/:user/:pest\'}');
    done();
  });
});}
};
