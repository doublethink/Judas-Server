/*
 * Script server
 *
 */

exports.serve = function(req, res){
  console.log("MATT log note---> script_server");
  res.sendfile(req.param('script'));
};
