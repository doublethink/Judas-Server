// run using
// heroku run:detached node schema.js

var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

client.query('DROP TABLE visits');
query = client.query('CREATE TABLE visits (date date)');

query.on('end', function(result) { client.end(); });
