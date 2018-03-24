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

const statusHandlers = {    
    'KReportIntent': function () {
        /* Professional Caregiver (caregivers) - care_id */
        // - event.session.user.userId = amzn1... 
        // - zyxwvutsrqponmlkjihgfedcba9876543210
        
        /* Senior (seniors) - id_num */
        // - event.session.user.userId = amzn1...
        // - abcdefghijklmnopqrstuvwxyz0123456789
        // - ccode = what Caregiver tells Alexa to reference that Senior = 96kka9/etc.
        
        const self = this;

        // User ID
        const userID = this.event.session.user.userId;
        console.log(userID);

        // Number of days for Status Report
        const report_days = 7;
        
        pool.connect((err, client, release) => {
            if (err) {
              return console.error('Error acquiring client', err.stack);
            }
            
            /* SENIORS */
            // Gets all rows in SENIORS table
            client.query("SELECT * FROM seniors", (err, result) => {
                if (err) {
                    return console.error('Error executing query', err.stack);
                }
                
                console.log('SENIORS Rows: ' + result.rows);
                
                /* The ID Num of the Senior */
                var senior_id_num = result.rows[0].id_num;
                console.log('ID Num: ' + senior_id_num);
                
                /* MOODS */
                // Gets the 7 most recent rows from MOODS table of the Senior
                client.query("SELECT * from moods WHERE id_num = ($1) ORDER BY whenwasit DESC LIMIT ($2);", [senior_id_num, report_days], (err, result) => {
                    if (err) {
                        return console.error('Error executing query', err.stack);
                    }
                    
                    console.log('MOODS Rows: ' + result.rows);
                    
                    // Mood value
                    var mood_values = [];
                    
                    for(var i = 0; i < report_days; i++){
                        mood_values[i] = result.rows[i].value;                    
                    }
                    console.log('Mood Values: ' + mood_values);

                    // Mood timestamp from database - Format: 2018-01-09 14:50:00
                    var mood_when_was_its = [];
                    
                    for(var i = 0; i < report_days; i++){
                        mood_when_was_its[i] = result.rows[i].whenwasit;
                    }
                    console.log('Mood TIMESTAMP: ' + mood_when_was_its);
                    
                    // Mood timestamp with Moment
                    var mood_when_was_it_moments = [];
                    
                    for(var i = 0; i < report_days; i++){
                        mood_when_was_it_moments[i] = moment(mood_when_was_its[i]).format("YYYY-MM-DD HH:mm:ss");
                    }
                    console.log('Mood Time STRING: ' + mood_when_was_it_moments);
                    
                    // Mood timestamp for Alexa - Format: Jan 9th 2018 02:50PM
                    var mood_when_was_it_alexas = [];
                    
                    for(var i = 0; i < report_days; i++){
                        mood_when_was_it_alexas[i] = moment(mood_when_was_it_moments[i]).format('MMM Do YYYY hh:mmA'); 
                    }
                    
                    /* CHECK-INS */
                    // Gets ALL Check-Ins from the Senior
                    client.query("SELECT * FROM checkins WHERE id_num = ($1)", [senior_id_num], (err, result) => {
                        release();
                        
                        if (err) {
                            return console.error('Error executing query', err.stack);
                        }
                        
                        console.log('Check-In Rows: ' + result.rows);
                        
                        // Gets the Check-In and Check-Out values
                        var checkins_check_in = result.rows[0].check_in;
                        var checkins_check_out = result.rows[0].check_out;
                        
                        console.log('CHECK-IN Check-In Value: ' + checkins_check_in);
                        console.log('CHECK-IN Check-Out Value: ' + checkins_check_out);
                        
                        var checkins_check_in_moment = moment(checkins_check_in).format("YYYY-MM-DD HH:mm:ss");
                        var checkins_check_out_moment = moment(checkins_check_out).format("YYYY-MM-DD HH:mm:ss");
                        
                        console.log('Check-In STRING: ' + checkins_check_in_moment);
                        console.log('Check-Out STRING: ' + checkins_check_out_moment);

                        var checkins_check_in_alexa = moment(checkins_check_in_moment).format('MMM Do YYYY hh:mmA');
                        var checkins_check_out_alexa = moment(checkins_check_out_moment).format('MMM Do YYYY hh:mmA');

                        /* ALEXA */
                        const cardTitle = 'Care Hub: Status Report';
                        var speechOutput = 'Your Status Report is ready! Please check the Card on your Alexa app!';
                        var cardContent = ''; 
                        var mood_day = 0;
                        var check_in_day = 0;

                        cardContent+= 'Moods:\n'; 
                        for(var i = report_days-1; i >= 0; i--){
                            mood_day++;
                            cardContent+='Day ' + mood_day + ': ' + mood_when_was_it_alexas[i] + ': ' + mood_values[i] + '\n'; 
                        }

                        cardContent+='\nCheck-Ins:\n';
                        for(var k = report_days-1; k >= 0; k--){
                            check_in_day++;
                            cardContent+='Day ' + check_in_day + ': ' + 'Check-In: ' + checkins_check_in_alexa + ' & Check-Out: ' + checkins_check_out_alexa + '\n';
                        }

                        const imageObj = {
                            smallImageUrl: 'https://s3.amazonaws.com/statusreport/xE2oNW4u.png',
                            largeImageUrl: 'https://s3.amazonaws.com/statusreport/xE2oNW4u.png'
                        };

                        self.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
                    });
                });
            });
        });
    }
};

module.exports = statusHandlers;