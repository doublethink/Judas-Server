/*
 * Script server
 *
 */

exports.serve = function(req, res){
  console.log("MATT log script_server---> " +req.param('script'));
  res.sendfile(req.param('script'));
};
