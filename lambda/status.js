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

var dates = [];  // moments of the 7 dates.
var datesStrings = [];  // strings of 7 dates.


const statusHandlers = {    
    'KReportIntent': function () {
        /* Professional Caregiver (caregivers) - care_id */
        // - zyxwvutsrqponmlkjihgfedcba9876543210
        
        /* Senior (seniors) - id_num */
        // - event.session.user.userId = amzn1...
        // - abcdefghijklmnopqrstuvwxyz0123456789
        // - ccode = what Caregiver tells Alexa to reference that Senior = 96kka9/etc.
        
        const self = this;

        // User ID
        var userID = this.event.session.user.userId;
        console.log('Current userID: ' + userID);

        // Number of days for Status Report
        var report_days = 7;
        var day_number = 7;
        
        pool.connect((err, client, release) => {
            if (err) {
                return console.error('Error acquiring client', err.stack);
            }
            
            // /* SENIORS */
            // // Gets all rows in SENIORS table
            // client.query("SELECT * FROM seniors", (err, result) => {
            //     if (err) {
            //         return console.error('Error executing query', err.stack);
            //     }
                
            //     console.log('SENIORS Rows: ' + result.rows);
                
            //     /* The ID Num of the Senior */
            //     var senior_id_num = result.rows[0].id_num;
                
                /* MOODS */
                // Currently hardcoded to match the results of that id_num in MOODS table
                var senior_id_num = 'abcdefghijklmnopqrstuvwxyz0123456789';

                // Gets all Moods expressed by the Senior in last 7 days
                client.query("SELECT * FROM senior_mood_view WHERE whenwasit > current_date - interval '7 days' and id_num = $1;", [senior_id_num], (err, result) => {
                    if (err) {
                        return console.error('Error executing query', err.stack);
                    }

                    console.log('MOODS Rows Length: ' + result.rows.length);

                    createSevenDays();

                    var timeZone = result.rows[0].timezone;

                    var mood_when_was_its = [];
                    var mood_values = [];

                    for (var j=0; j<7; j++){
                        var timesArray = [];
                        var moodsArray = [];

                        for (var i = 0; i<result.rows.length; i++) {
                            var whenwasit = moment(result.rows[i].whenwasit);
                            var whenwasitStart = whenwasit.startOf('day');
                            var time = moment(result.rows[i].whenwasit);
                            var moodString = '';

                            console.log('Date from DB: ' + whenwasitStart.format('ll'));
                            console.log('Date we are checking with: ' + datesStrings[j]);
                            if (whenwasitStart.isSame(dates[j])) {
                                timesArray.push(time.tz(timeZone).format('LT'));
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
                    
                    /* CHECK-INS */
                    // Currently hardcoded to match the results of that id_num in CHECK-INS table
                    senior_id_num = 'amzn1.ask.account.AE4QHOD72IHWXLYTFLNTXILK6FDNIZ35LJKMKBBLTG5WB3SMWVXOI3OWLO4QCFG6SXZQ64VCL6DTX5SL6RORGXYTCTYPLOXATHYKGHOOJAD2YSTJLAFYGC3GSCYNJWPFH56LYLDUQ2CAUZ5VGPCF6KJKCZDYMNMIB4FDQ2OGJQDZNPR2NQSXLYL5KTFMTXTQ2GYF3EKLJSKLPFQ';

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
                                var whenwasit = moment(result.rows[i].check_in);
                                var whenwasitStart = whenwasit.startOf('day');
                                var time = moment(result.rows[i].check_in);
                                var duration = result.rows[i].duration;
                                var serviceString = '';
                                var timeString = time.tz(timeZone).format('LT');
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
            // });
        });
    }
};

function createSevenDays(){  // creates the Seven Dates for the report
    var date;
    var startDate;

    for (var i=6; i>=0; i--){
        date = moment().subtract(i, 'days');
        startDate = date.startOf('day');
        dates.push(startDate);
        console.log("The Date is: "+ startDate.format('ll'));
        datesStrings.push(startDate.format('ll'));  // date Format:  Apr 6, 2018
    }
}

module.exports = statusHandlers;