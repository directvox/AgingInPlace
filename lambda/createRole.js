'use strict';
var token = "";
var userID = "";
var testRes = true;
var countryCode = '';
var postalCode = '';
var lat = 0;
var lng = 0;
var timeZoneId = '';
var consentToken = '';
var deviceId = '';
var apiEndpoint = '';
var googleMapApiUrl1 = '';
var googleMapApiUrl2 = '';
var intentObj;


const pg = require("pg");
const config = require('./config');
const axios = require('axios');
const moment = require('moment-timezone');
const AlexaDeviceAddressClient = require('./AlexaDeviceAddressClient');

const ADDRESS_PERMISSION = "read::alexa:device:all:address:country_and_postal_code";  //Only assk for Country and PostalCode
const NOTIFY_MISSING_PERMISSIONS = "Please enable Location permissions in the Amazon Alexa app.";
const NO_ADDRESS = "It appears you have not set your country and postal code in your Alexa app, please do so and try again.";
const LOCATION_FAILURE = "There was an error retrieving your location. Please try Setup Senior again.";
const ERROR = "Uh Oh. Looks like something went wrong.";
const PERMISSIONS = [ADDRESS_PERMISSION];

const pool = new pg.Pool({
    user: config.dbUSER,
    password: config.dbPWD,
    database: config.dbDatabase,
    host: config.dbURL,
    port: config.dbPort
});

const creatingHandlers = {

  'ConfirmCreate': function () {
      var self = this;
      intentObj = this.event.request.intent;
      userID = this.event.session.user.userId;
      consentToken = self.event.context.System.apiAccessToken;
      if(!consentToken) {
        self.emit(":tellWithPermissionCard", NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
        console.log("User did not give us permissions to access their address.");
        console.info("Ending ConfirmCreate");
        return;
      }


      deviceId = self.event.context.System.device.deviceId;
      apiEndpoint = self.event.context.System.apiEndpoint;
      const alexaDeviceAddressClient = new AlexaDeviceAddressClient(apiEndpoint, deviceId, consentToken);
      let deviceAddressRequest = alexaDeviceAddressClient.getCountryAndPostalCode();

      deviceAddressRequest.then((addressResponse) => {
        switch(addressResponse.statusCode) {
            case 200:
                console.log("Address successfully retrieved, now responding to user.");
                countryCode = addressResponse.address.countryCode;
                console.log("Country Code: ", countryCode);
                postalCode = addressResponse.address.postalCode;
                console.log("Postal Code: ", postalCode);

                self.emit('GetTimeZone');
                break;
            case 204:
                // This likely means that the user didn't have their address set via the companion app.
                console.log("Successfully requested from the device address API, but no address was returned.");
                self.emit(':tellWithCard', NO_ADDRESS, 'Address Missing', NO_ADDRESS);
                break;
            case 403:
                console.log("The consent token we had wasn't authorized to access the user's address.");
                self.emit(":tellWithPermissionCard", NOTIFY_MISSING_PERMISSIONS, PERMISSIONS);
                break;
            default:
                self.emit(":ask", LOCATION_FAILURE, LOCATION_FAILURE);
        }
      }).catch((error) => {
        self.emit(":tell", ERROR);
        console.error(error);
      });

    //   deviceAddressRequest.catch((error) => {
    //         self.emit(":tell", ERROR);
    //         console.error(error);
    //   });
    },

    'GetTimeZone': function() {
        var self = this;
        googleMapApiUrl1 = 'https://maps.googleapis.com/maps/api/geocode/json?address='+countryCode+','+postalCode+'&key='+process.env.MAP_KEY;
        axios.get(googleMapApiUrl1)
            .then(function(response) {
                console.log('Google Api Response Json#1:\n', response);
                lat = response.data.results[0].geometry.location.lat;
                console.log("lat: ", lat);
                lng = response.data.results[0].geometry.location.lng;
                googleMapApiUrl2 = 'https://maps.googleapis.com/maps/api/timezone/json?location='+lat+','+lng+'&timestamp='+moment().unix()+'&key='+process.env.TZ_MAP_KEY;
                axios.get(googleMapApiUrl2)
                    .then(function(response){
                        console.log('Google Api Response Json#2:\n', response);
                        timeZoneId = response.data.timeZoneId;
                        console.log("Timezone ID: ", timeZoneId);
                        const d = new moment();
                        if(intentObj.confirmationStatus !== 'CONFIRMED'){
                            if(intentObj.confirmationStatus !== 'DENIED'){
                                const speechOutput = 'Are you sure you want to setup senior account?';
                                const cardTitle = 'Setup Senior Confirmation';
                                const cardContent = 'Are you sure you want to setup senior account?';
                                const repromptSpeech = speechOutput;
                                this.emit(':confirmIntentWithCard', speechOutput, repromptSpeech, cardTitle. cardContent);
                            } else {
                                this.response.speak('Okay, good bye.');
                                this.emit(':responseReady'); 
                            }}
                        else {
                            self.emit('CreateRole')
                        }
                    }).catch(function(err){console.log(err)});
            }).catch((err) => {
                this.response.speak('I\'m sorry. Something went wrong.');
                this.emit(':responseReady');
                console.log(error.message);
            }
        );
    },

    'CreateRole': function () {
        var self = this;
        console.log("userID: "+ userID);
        pool.connect()
        .then(client => {
            return client.query("SELECT ccode, id_num FROM seniors ORDER BY ccode DESC")
            .then(result => {
                console.log(testRes);
                if(findID(result, userID)) {
                    const speechOutput = 'Senior setup has already been run on this device. Please look at the alexa app to see your caregiver code.';
                    const cardTitle = 'Caregiver Code';
                    const cardContent = "This is your the caregiver code: " + token;
                    self.emit(':tellWithCard', speechOutput, cardTitle, cardContent);
                } else {
                    while(testRes){
                        if(findCC(result, token)){
                            console.log("was a truey");
                            token = randomInt();
                            console.log("token: "+ token);
                        } else {                                                                             
                            return client.query("INSERT INTO seniors (id_num, timezone, ccode) VALUES ($1, $2, $3)",[userID, timeZoneId, token])
                                .then(result => {
                                    client.release();
                                    console.log("Token success: "+ token);
                                    const speechOutput = 'Senior setup has been completed. Please look at the alexa app to see your caregiver code.';
                                    const cardTitle = 'Caregiver Code';
                                    const cardContent = "This is your the caregiver code: " + token;
                                    self.emit(':tellWithCard', speechOutput, cardTitle, cardContent);
                                    testRes = false;
                                }).catch(err => {
                                    console.log(err.stack);
                                });
                        }
                    }
                }
            }).catch(err => {
                client.release();
                console.log(err.stack);
            });
        });
    }
};

function randomInt () { 
    var number = parseInt(Math.random()*1e9, 10)
    var str = '' + number;
    while (str.length < 9) {
        str = '0' + str;
    }
    return str;
}

function findID (input, userID) {
    for(var i=0; i<input.rows.length; i++){
        console.log("Row number :"+i+"is: " +input.rows[i].id_num)
        if(userID == input.rows[i].id_num){
            console.log("Found ID!");
            token = input.rows[i].ccode;
            return true;
        }
    }
}

function findCC (input, token) {
    for(var i=0; i<input.rows.length; i++){
        console.log("Row number :"+i+"is: " +input.rows[i].ccode)
        if(token == input.rows[i].ccode || token == ""){
            console.log("Found CCode!");
            return true;
        }
    }
}

module.exports = creatingHandlers;
