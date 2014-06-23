/*
 * Generate park management reports
 *
 */

var pg =                require('pg')
  , connectionString =  process.env.DATABASE_URL
  , config =            require('../config')
  , auth   =            require('./authenticate')
  , dbh =            require('./pestsdbHelpers')
  , report_builder =    require('../views/report_builder')
  , DATABASE =          config.DATABASE;

//=========================================================================
// send to report page to get from & to dates
exports.report = function(req, res){
  res.sendfile('./views/report.html');
};

// now have the from & to dates, generate report
exports.report_builder = function(req, res){
  console.log("MATT log note---> get pestspotted/:date");
if(auth.admin(req)){
  console.log('MATT log notes---> Passed authentication.');
pg.connect(connectionString, function(err, client, done) {

  if(!(dbh.validateDate(req.param('from')) && dbh.validateDate(req.param('to'))) ){
 	return res.send(400, "Invalid date format. Use DD-MM-YYYY."); // 400 Bad Request, syntax.
  } else {
    console.log("MATT log note---> date validated.");

  // format date to match db format
    var from = dbh.formatDate(req.param('from'));
    var to =   dbh.formatDate(req.param('to'));

  // add a day to 'to', as search is up to (to+1) 00:00:00
    var nextDay = new Date(to);
    nextDay.setDate(nextDay.getDate()+1);
    console.log("MATT log note---> to's nextDay = "+ nextDay);

  // create new 'to' string for db search
    to = ""+nextDay.getFullYear();
    var month = new String(nextDay.getMonth()+1);
    to += month.length == 2 ? "-"+month : "-0"+month;
    var day = new String(nextDay.getDate());
    to += day.length == 2 ? "-"+day : "-0"+day;
    console.log("MATT log note---> to's nextday = "+ to);

  // conduct search
    var sql = ''+
      'SELECT * FROM '+DATABASE+
      ' WHERE datestamp >= \''+ from +'\''+
         ' AND datestamp < \''+ to   +'\' ;';
    var rows = [];
    var query = client.query(sql);

  // build result
    query.on('row', function(row, result){ 
      rows.push('{\"latitude\" : \"'+row.latitude+
             '\", \"longitude\" : \"'+row.longitude+
             '\", \"pest\" : \"'+row.pest+
             '\", \"date\" : \"'+row.datestamp+'\"}');
      console.log('MATT log notes---> added : '+ rows[rows.length-1]);
    });

  // send it back to client
    query.on('end', function(row, result){
      console.log("MATT log note---> size : " + rows.length);
      res.set({"Cache-Control": "no-store"});

      var tableContents = "";
      for(i = 0; i < rows.length; i++){
        var json = JSON.parse(rows[i]);
        tableContents += '<tr><td>'+
          json.date.substr(0, 15)+'</td><td>'+
          json.pest+'</td><td>'+
          json.latitude.substr(0, 7)+'</td><td>'+
          json.longitude.substr(0, 7)+'</td></tr>';
      }
      done();
      res.send(200, report_builder.start + tableContents + report_builder.end);
    });
  }
});}
};
