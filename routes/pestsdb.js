/*
 * Pests database queries
 *
 */

//============================
// NOTE : DB backups
// Heroku PG Backups (Free option, daily backup, retained for a month)
// This free option requires making regular manual data backups, to save histical data. 
// A pay for options would give better pgbackups from Heroku, or implement a cloud db, say Cassandra, on Amazon servers. 


var pg =                require('pg')
//  , FB =                require('fb')
//  , Step =              require('step')
//  , crypto =            require('crypto')
  , connectionString =  process.env.DATABASE_URL;

var config =            require('../config')
  , auth   =            require('./authenticate')
  , dbhelp =          require('./pestsdbHelpers');

var DATABASE =          config.DATABASE;


//============================
// post /pestspotted
// add pest to database, returns the id

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


exports.pestspottedAll= function(req, res){
  res.redirect('/pestspotted/all/text');
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

function formatDate(date){
    var split = req.param('date').split('-').reverse();
    var date = split.toString().replace(",","-").replace(",","-"); // odd, needs replace twice
    console.log("MATT log note---> date = "+ date);
    return date;
}

exports.report = function(req, res){
  console.log("MATT log note---> get pestspotted/:date");
if(auth.admin(req)){
  console.log('MATT log notes---> Passed authentication.');
pg.connect(connectionString, function(err, client, done) {

  if(!dbhelp.validateDate(req.param('from')) && !dbhelp.validateDate(req.param('to')){
 	return res.send(400, "Invalid date format. Use DD-MM-YYYY."); // 400 Bad Request, syntax.
  } else {
    console.log("MATT log note---> date validated.");

  // format date to match db format
    var from = formatDate(req.param('from');
    var to =   formatDate(req.param('to');

  // calc next day
    var nextDay = new Date(to);
    nextDay.setDate(nextDay.getDate()+1);
    console.log("MATT log note---> to's nextDay = "+ nextDay);

  // create next day string for db search
    to = ""+nextDay.getFullYear();
    var month = new String(nextDay.getMonth()+1);
    to += month.length == 2 ? "-"+t : "-0"+t;
    var day = new String(nextDay.getDate());
    to += day.length == 2 ? "-"+t : "-0"+t;
    console.log("MATT log note---> to's nextday = "+ to);

  // conduct search
    var rows = [];
    var query = client.query('SELECT uid, pest, datestamp FROM '+DATABASE+
        ' WHERE datestamp >= \'' + from + '\''+
            ' AND datestamp < \''+ to   +'\' ;');

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

  if(!dbhelp.validateDate(req.param('date'))){
 	return res.send(400, "Invalid date format. Use DD-MM-YYYY."); // 400 Bad Request, syntax.
  } else {
    console.log("MATT log note---> date validated.");

  // format date to match db format
    var date = formatDate(req.param('date');

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

//======================================================================
// total of a specific pest type logged by this user
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

//=======================================================================
// total noumber of pests logged by this user
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
