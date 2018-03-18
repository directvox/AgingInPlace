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

  'ConfirmCreate': function () {
    const intentObj = this.event.request.intent;
    if(intentObj.confirmationStatus !== 'CONFIRMED'){
        const speechOutput = 'You want to setup senior account?';
        const cardTitle = 'Setup Senior Confirmation';
        const cardContnet = 'You want to setup senior account?'
        const repromptSpeech = speechOutput;
        this.emit(':confirmIntentWithCard', speechOutput, repromptSpeech, cardTitle. cardContnet);
    } else {
        this.emit('CreateRole')
    }
},
'CreateRole': function () {
 var self = this;
 var codeArr = [];
 console.log("userID: "+ userID);
 pool.connect()
  .then(client => {
      return client.query("SELECT ccode FROM seniors ORDER BY ccode DESC")
       .then(result => {
           console.log(testRes);
           console.log(codeArr);
           while(testRes){
               if(token in codeArr || token == ""){
                console.log("was a truey");
                token = randomInt().toString(36);  //base36 characters.
                console.log("token: "+ token);
               } else {                                                                             
                return client.query("INSERT INTO seniors (id_num, timezone, ccode) VALUES ($1, $2, $3)",[userID, -8, token])
                    .then(result => {
                        client.release();
                        console.log("Token success: "+ token);
                        self.response.speak('Senior setup has been completed. Please record this value. "'+token.split('').join('. ')+'", that is your caregiver code.');
                        self.emit(':responseReady');
                        testRes = false;
                    }).catch(err => {
                        console.log(err.stack);
                    });
               }
           }
       }).catch(err => {
           client1.release();
           console.log(err.stack);
       });
  });
}
};

function randomInt () {  //returns pseudo-random number between 0 and 36^6-1;
return Math.round(Math.random() * (Math.pow(36,6)-1));
}

module.exports = creatingHandlers;