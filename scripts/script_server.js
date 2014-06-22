/*
 * Script server
 *
 */

exports.serve = function(req, res){
  res.sendfile(req.param('script'));
};
