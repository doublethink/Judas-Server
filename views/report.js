/*
 * Reports page for the pestspotted data requested. 
 * This type of file is not ideal, but I have run out of time to fix it.
 */

// To add/remove stuff, treat it exactly like HTML, but surround each line with single quotes to keep the integrity of the string.

// In essence the code that creates the table data, wraps that data with these two strings before sending it to the browser. Anything you add in,like CSS files etc., will work as you expect.

// for testing, use one of these urls
// http://polar-forest-2324.herokuapp.com/report/08-05-2014/21-06-2014
// http://judas.herokuapp.com/report/08-05-2014/21-06-2014


module.exports.startReport = ''+
'<!DOCTYPE html>'+
'<html lan="en">'+
  '<head>'+
    '<meta charset="utf-8" />'+
    '<title>Pest Repost</title>'+
  '</head>'+
  '<<body>'+
    '<p>Report of pest sightings over the period selected.</P>'+
    '<div class="container">'+
      '<table>'+
        '<tr><th>Date</th><th>Pest</th><th>Latitude</th><th>Longitude</th></tr>';

// NB: table data is inserted here.

module.exports.endReport += ''+
      '</table>'+
    '</div>'+
  '</body>'+
'</html>';
