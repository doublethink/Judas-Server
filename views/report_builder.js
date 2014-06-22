/*
 * Reports page for the pestspotted data requested. 
 * This as a javascript file is not ideal, but I have run out of time.
 */

// To add/remove stuff, treat it exactly like HTML, but surround each line with single quotes to keep the integrity of the string.

// In essence the code that creates the table data, will wrap that data with these two strings before sending it to the browser. Anything you add in,like CSS files etc., will work as you expect.

// for testing, use one of these urls, the first is my test server, the second is judas.
// http://polar-forest-2324.herokuapp.com/report/04-05-2014/21-06-2014
// http://judas.herokuapp.com/report/04-05-2014/21-06-2014

// nb: real data may be larger than the dummy data used.

exports.start = ''+
'<!DOCTYPE html>'+
'<html lan="en">'+
  '<head>'+
    '<meta charset="utf-8"></meta>'+
    '<title>Pest Repost</title>'+
    '<script type="text/javascript" src="sorttable.js"></script>'+
    '<style type="text/css">'+
      'th, td { padding: 3px !important; }'+
      /* Sortable tables */
      'table.sortable thead {'+
        'background-color: #333;'+
        'color: #cccccc;'+
        'font-weight: bold;'+
        'cursor: default;'+
      '}'+
      'th { font-size: 100%; }'+
    '</style>'+
  '</head>'+
  '<body>'+
    '<h3>snap.pest - Pest Report</h3>'+
    '<p>Report of pest sightings over the period selected.</P>'+
    '<div class="container">'+
      '<table class="sortable">'+
        '<tr><th>Date</th><th>Pest</th><th>Latitude</th><th>Longitude</th></tr>';

// NB: table data is inserted here.

exports.end = ''+
      '</table>'+
    '</div>'+
  '</body>'+
'</html>';
