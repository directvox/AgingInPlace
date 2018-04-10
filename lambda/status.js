'use strict';

const pg = require("pg");
const config = require('./config');
const moment = require('moment');

const pool = new pg.Pool({
    user: config.dbUSER,
    password: config.dbPWD,
    database: config.dbDatabase,
    host: config.dbURL,
    port: config.dbPort
});


var userID;
var intentObj;
var cCode = '';
var timeZone;
var dates = [];  // moments of the 7 dates.
var datesStrings = [];  // strings of 7 dates.


const statusHandlers = {
    'MultiRelReport': function () {
        var self = this;
        userID = this.event.session.user.userId;
        intentObj = this.event.request.intent;
        pool.connect().then(client => {
            return client.query("SELECT * FROM ccode_rel_view WHERE care_id = $1", [userID])
            .then(result => {
                if (result.rows.length > 1) {
                    if (intentObj.slots.ccode.confirmationStatus !== 'CONFIRMED'){
                        if (intentObj.slots.ccode.confirmationStatus !== 'DENIED'){
                            const slotToConfirm = 'ccode';
                            const speechOutput = "You've told me your code is. "+intentObj.slots.ccode.value.split('').join('. ')+". Is this correct?";
                            const repromptSpeech = speechOutput;
                            const cardTitle = "Your caregiver code:";
                            cCode = intentObj.slots.ccode.value.toString();
                            const cardContent = cCode;
                            console.log("userID: "+ userID);
                            console.log(intentObj);
                            console.log(intentObj.slots.ccode.value);
                            this.emit(':confirmSlotWithCard', slotToConfirm, speechOutput, repromptSpeech, cardTitle, cardContent);
                        } else {
                            const speechOutput = 'Please repeat your caregiver code.';
                            const slotToElicit = 'ccode';
                            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
                        }
                    } else {
                        cCode = intentObj.slots.ccode.value.toString();
                        this.emit('KReportIntent')
                    }
                } else if (result.rows.length == 1) {
                    cCode = result.rows[0].ccode;
                    self.emit('KReportIntent');
                } else {
                    self.response.speak('Sorry we did not find any seniors related to your account.  Please run Setup Caregiver.');
                    self.emit(':responseReady');
                }

            }).catch(err => {
                console.log(err.stack);
                self.response.speak('Sorry there was an error.  Please try again.');
                self.emit(':responseReady');
            });
        }).catch(err => {
            console.log(err.stack);
            self.response.speak('Sorry there was an error.  Please try again.');
            self.emit(':responseReady');
        });
    },
    
    'KReportIntent': function () {
        var self = this;

        // User ID
        userID = this.event.session.user.userId;
        console.log('Current userID: ' + userID);

        
        
        pool.connect((err, client, release) => {
            if (err) {
                return console.error('Error acquiring client', err.stack);
                self.response.speak('Sorry there was an error.  Please try again.');
                self.emit(':responseReady');
            }
            
            var tempQuery = '';
            if (cCode == '') {  //checking to see if cCode was already set.
                tempQuery = 'SELECT * FROM ccode_rel_view WHERE care_id = $1';
                client.query(tempQuery, [userID], (err, result) => {
                    if (err) {
                        return console.error('Error executing query', err.stack);
                        self.response.speak('Sorry there was an error.  Please try again.');
                        self.emit(':responseReady');
                    }
    
                    var senior_id_num = result.rows[0].id_num;
                    timeZone = result.rows[0].timezone;
                    createSevenDays();
    
                    // Gets all Moods expressed by the Senior in last 7 days
                    client.query("SELECT * FROM senior_mood_view WHERE whenwasit > current_date - interval '7 days' and id_num = $1;", [senior_id_num], (err, result) => {
                        if (err) {
                            return console.error('Error executing query', err.stack);
                            self.response.speak('Sorry there was an error.  Please try again.');
                            self.emit(':responseReady');
                        }
    
                        console.log('MOODS Rows Length: ' + result.rows.length);
    
                        var mood_when_was_its = [];
                        var mood_values = [];
    
                        for (var j=0; j<7; j++){
                            var timesArray = [];
                            var moodsArray = [];
    
                            for (var i = 0; i<result.rows.length; i++) {
                                var whenwasit = moment(result.rows[i].whenwasit).tz(timeZone);
                                var whenwasitStart = whenwasit.startOf('day');
                                var time = moment(result.rows[i].whenwasit);
                                var moodString = '';
    
                                console.log('Date from DB: ' + whenwasitStart.format('ll'));
                                console.log('Date we are checking with: ' + datesStrings[j]);
                                if (whenwasitStart.isSame(dates[j])) {
                                    timesArray.push(time.format('LT'));
                                    moodString = "Mood Expressed: " + result.rows[i].value + " at ";
                                    moodsArray.push(moodString);
                                }    
                            }
    
                            console.log("Moods: ", moodsArray);
                            console.log("Times: ", timesArray);
                            console.log("Times length: ", timesArray.length);
    
                            if (timesArray.length > 0){
                                mood_when_was_its.push(timesArray);
                                mood_values.push(moodsArray);
                            } else {
                                mood_when_was_its.push(['']);  //push an empty string into time
                                mood_values.push(["No Moods were expressed on this day."]);
                            }
                        }
                        
                        // senior_id_num = 'amzn1.ask.account.AE4QHOD72IHWXLYTFLNTXILK6FDNIZ35LJKMKBBLTG5WB3SMWVXOI3OWLO4QCFG6SXZQ64VCL6DTX5SL6RORGXYTCTYPLOXATHYKGHOOJAD2YSTJLAFYGC3GSCYNJWPFH56LYLDUQ2CAUZ5VGPCF6KJKCZDYMNMIB4FDQ2OGJQDZNPR2NQSXLYL5KTFMTXTQ2GYF3EKLJSKLPFQ';
    
                        // Gets all Check-Ins expressed by the Senior in last 7 days
                        client.query("SELECT * FROM senior_check_view WHERE check_in > current_date - interval '7 days' and id_num = $1;", [senior_id_num], (err, result) => {
                            release(); 
                            if (err) {
                                return console.error('Error executing query', err.stack);
                            }
    
                            var services = [];
    
                            for (var j=0; j<7; j++){
                                var serviceArray = [];
    
                                for (var i = 0; i<result.rows.length; i++) {
                                    var whenwasit = moment(result.rows[i].check_in).tz(timeZone);
                                    var whenwasitStart = whenwasit.startOf('day');
                                    var time = moment(result.rows[i].check_in);
                                    var duration = result.rows[i].duration;
                                    var serviceString = '';
                                    var timeString = time.format('LT');
                                    console.log('Date from DB: ' + whenwasitStart.format('ll'));
                                    console.log('Date we are checking with: ' + datesStrings[j]);
                                    if (whenwasitStart.isSame(dates[j])) {
                                        serviceString = result.rows[i].service_name + " checked in at " + timeString + " for " + duration + " minute(s).\n";
                                        serviceArray.push(serviceString);
                                    }    
                                }
    
                                console.log("Check Ins: ", serviceArray);
                                if (serviceArray.length > 0){
                                    services.push(serviceArray);
                                } else {
                                    services.push(["No Services checked in on this day.\n"]);
                                }
                            }
                            
                            /* ALEXA */
                            const cardTitle = 'Grace Care: Status Report';
                            var speechOutput = 'Your Status Report is ready! Please check the Card on your Alexa app!';
                            var cardContent = ''; 
    
                            cardContent+= 'Moods:\n'; 
                            for(var i=0; i < 7; i++){
                                for(var j=0; j < mood_values[i].length; j++){
                                    cardContent+=datesStrings[i] + ': ' + mood_values[i][j] + mood_when_was_its[i][j]+'\n';
                                }
                            }
    
                            cardContent+='\nCheck-Ins:\n';
                            for(var i=0; i < 7; i++){
                                for(var j=0; j < services[i].length; j++){
                                    cardContent+=datesStrings[i] + ': '+ services[i][j];
                                } 
                            }
    
                            // // Change URL picture if using picture
                            // const imageObj = {
                            //     smallImageUrl: 'https://s3.amazonaws.com/statusreport/xE2oNW4u.png',
                            //     largeImageUrl: 'https://s3.amazonaws.com/statusreport/xE2oNW4u.png'
                            // };
    
                            self.emit(':tellWithCard', speechOutput, cardTitle, cardContent);
                        });
                    });
                });
            } else {
                tempQuery = 'SELECT * FROM ccode_rel_view WHERE ccode = $1';
                client.query(tempQuery, [cCode], (err, result) => {
                    if (err) {
                        return console.error('Error executing query', err.stack);
                        self.response.speak('Sorry there was an error.  Please try again.');
                        self.emit(':responseReady');
                    }
    
                    var senior_id_num = result.rows[0].id_num;
                    timeZone = result.rows[0].timezone;
                    createSevenDays();
    
                    // Gets all Moods expressed by the Senior in last 7 days
                    client.query("SELECT * FROM senior_mood_view WHERE whenwasit > current_date - interval '7 days' and id_num = $1;", [senior_id_num], (err, result) => {
                        if (err) {
                            return console.error('Error executing query', err.stack);
                            self.response.speak('Sorry there was an error.  Please try again.');
                            self.emit(':responseReady');
                        }
    
                        console.log('MOODS Rows Length: ' + result.rows.length);
    
                        
    
                        var mood_when_was_its = [];
                        var mood_values = [];
    
                        for (var j=0; j<7; j++){
                            var timesArray = [];
                            var moodsArray = [];
    
                            for (var i = 0; i<result.rows.length; i++) {
                                var whenwasit = moment(result.rows[i].whenwasit).tz(timeZone);
                                var whenwasitStart = whenwasit.startOf('day');
                                var time = moment(result.rows[i].whenwasit);
                                var moodString = '';
    
                                console.log('Date from DB: ' + whenwasitStart.format('ll'));
                                console.log('Date we are checking with: ' + datesStrings[j]);
                                if (whenwasitStart.isSame(dates[j])) {
                                    timesArray.push(time.format('LT'));
                                    moodString = "Mood Expressed: " + result.rows[i].value + " at ";
                                    moodsArray.push(moodString);
                                }    
                            }
    
                            console.log("Moods: ", moodsArray);
                            console.log("Times: ", timesArray);
                            console.log("Times length: ", timesArray.length);
    
                            if (timesArray.length > 0){
                                mood_when_was_its.push(timesArray);
                                mood_values.push(moodsArray);
                            } else {
                                mood_when_was_its.push(['']);  //push an empty string into time
                                mood_values.push(["No Moods were expressed on this day."]);
                            }
                        }
                        
                        // senior_id_num = 'amzn1.ask.account.AE4QHOD72IHWXLYTFLNTXILK6FDNIZ35LJKMKBBLTG5WB3SMWVXOI3OWLO4QCFG6SXZQ64VCL6DTX5SL6RORGXYTCTYPLOXATHYKGHOOJAD2YSTJLAFYGC3GSCYNJWPFH56LYLDUQ2CAUZ5VGPCF6KJKCZDYMNMIB4FDQ2OGJQDZNPR2NQSXLYL5KTFMTXTQ2GYF3EKLJSKLPFQ';
    
                        // Gets all Check-Ins expressed by the Senior in last 7 days
                        client.query("SELECT * FROM senior_check_view WHERE check_in > current_date - interval '7 days' and id_num = $1;", [senior_id_num], (err, result) => {
                            release(); 
                            if (err) {
                                return console.error('Error executing query', err.stack);
                            }
    
                            var services = [];
    
                            for (var j=0; j<7; j++){
                                var serviceArray = [];
    
                                for (var i = 0; i<result.rows.length; i++) {
                                    var whenwasit = moment(result.rows[i].check_in).tz(timeZone);
                                    var whenwasitStart = whenwasit.startOf('day');
                                    var time = moment(result.rows[i].check_in);
                                    var duration = result.rows[i].duration;
                                    var serviceString = '';
                                    var timeString = time.format('LT');
                                    console.log('Date from DB: ' + whenwasitStart.format('ll'));
                                    console.log('Date we are checking with: ' + datesStrings[j]);
                                    if (whenwasitStart.isSame(dates[j])) {
                                        serviceString = result.rows[i].service_name + " checked in at " + timeString + " for " + duration + " minute(s).\n";
                                        serviceArray.push(serviceString);
                                    }    
                                }
    
                                console.log("Check Ins: ", serviceArray);
                                if (serviceArray.length > 0){
                                    services.push(serviceArray);
                                } else {
                                    services.push(["No Services checked in on this day.\n"]);
                                }
                            }
                            
                            /* ALEXA */
                            const cardTitle = 'Grace Care: Status Report';
                            var speechOutput = 'Your Status Report is ready! Please check the Card on your Alexa app!';
                            var cardContent = ''; 
    
                            cardContent+= 'Moods:\n'; 
                            for(var i=0; i < 7; i++){
                                for(var j=0; j < mood_values[i].length; j++){
                                    cardContent+=datesStrings[i] + ': ' + mood_values[i][j] + mood_when_was_its[i][j]+'\n';
                                }
                            }
    
                            cardContent+='\nCheck-Ins:\n';
                            for(var i=0; i < 7; i++){
                                for(var j=0; j < services[i].length; j++){
                                    cardContent+=datesStrings[i] + ': '+ services[i][j];
                                } 
                            }
    
                            // // Change URL picture if using picture
                            // const imageObj = {
                            //     smallImageUrl: 'https://s3.amazonaws.com/statusreport/xE2oNW4u.png',
                            //     largeImageUrl: 'https://s3.amazonaws.com/statusreport/xE2oNW4u.png'
                            // };
    
                            self.emit(':tellWithCard', speechOutput, cardTitle, cardContent);
                        });
                    });
                });
            }
            
            
        });
    }
};

function createSevenDays(){  // creates the Seven Dates for the report
    var date;
    var startDate;

    for (var i=6; i>=0; i--){
        date = moment().tz(timeZone).subtract(i, 'days');
        startDate = date.startOf('day');
        dates.push(startDate);
        console.log("The Date is: "+ startDate.format('ll'));
        datesStrings.push(startDate.format('ll'));  // date Format:  Apr 6, 2018
    }
}

module.exports = statusHandlers;