//======================================
// helpers
//======================================

var weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

exports.validateDate = function(d){
  var date = new String(d);
  // sufficient for now, would need upgrading in production. Leap years, variable days in month.
  var reg = new RegExp('(0[1-9]|[1-9]|[12][0-9]|3[01])[-/.](0[1-9]|[1-9]|1[012])[-/.](19|20)[0-9][0-9]');

  var test = reg.test(date);
    console.log("MATT log note---> date regex result is; " + test);
  if(test){ return true; }
  return false;
}


exports.formatDate = function(date){
    var split = date.split('-').reverse();
    date = split.toString().replace(",","-").replace(",","-"); // odd, needs replace twice
    console.log("MATT log note---> date = "+ date);
    return date;
}

exports.formatDateForNZ = function(date){
    d = new Date(date);
    var r = "";
    var day = new String(d.getDate());
    r += day.length == 2 ? ""+day : "0"+day;
    var month = new String(d.getMonth()+1);
    r += month.length == 2 ? "-"+month : "-0"+month;
    r += "-"+d.getFullYear();
    r += " "+weekdays[d.getday()]; 
    console.log("MATT log note---> date = "+ r);
    return r;
}


// Check input for pestspotted
// return boolean on success/fail
exports.verifyPestInput = function(req, res){
  if(
     req.body.packet == undefined ||
     req.body.packet.position == undefined ||
     req.body.packet.position.longitude == undefined ||
     req.body.packet.position.latitude == undefined ||
     req.body.packet.position.accuracy == undefined ||
     req.body.packet.position.datestamp == undefined ||
     req.body.packet.pest == undefined ||
     req.body.packet.auth == undefined ||
     req.body.packet.auth.uid == undefined
    ){
    // input failed, create & send error message
    res.statusCode = 400;
    var packetError = req.body.packet == undefined ? "undefined, please provide a root element." : "";
    var positionError = req.body.packet == undefined || req.body.packet.position == undefined ? "undefined" :
      "\n  longitude: "+req.body.packet.position.longitude+
      "\n  latitude: "+req.body.packet.position.latitude+
      "\n  accuracy: "+req.body.packet.position.accuracy+
      "\n  datestamp: "+req.body.packet.position.datestamp;
		var authError = req.body.packet == undefined || req.body.packet.auth == undefined ? "undefined" :
      "\n  uid: "+req.body.packet.auth.uid;
    var pestError = req.body.packet == undefined || req.body.packet.pest == undefined ? "undefined" :
      req.body.packet.pest;
    
    res.send('Error 400: A value is missing.\n' +  // 400 error, value missing
      "\npacket: "   +packetError+
      "\nposition: " +positionError+
      "\npest: "     +pestError+
      "\nauth: "     +authError);
    return false;
  }
  return true;
}
// end helpers
