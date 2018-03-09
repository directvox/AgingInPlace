'use strict';
var token = "";

const pg = require("pg");
const config = require('./config');

const pool = new pg.Pool({
    user: config.dbUSER,
    password: config.dbPWD,
    database: config.dbDatabase,
    host: config.dbURL,
    port: config.dbPort
});

const creatingHandlers = {

    'CreateRole': function () {
      var self = this;
      pool.connect((err, client, release) => {
        if (err) {
          return console.error('Error acquiring client', err.stack)
        }
        require('crypto').randomBytes(128, function(err, buffer) {
          token = buffer.toString('hex');
        // Change to check if id already exists, and remake the random string if it does.
        client.query("INSERT INTO seniors (id_num, timezone) VALUES ($1, '2')",[token], (err, result) => {
          self.response.speak('Role has been created.');
          self.emit(':responseReady');
          release();
          if (err) {
            return console.error('Error executing query', err.stack)
            console.log(err)
          }
        })
      })
    });
  }
};

module.exports = creatingHandlers;