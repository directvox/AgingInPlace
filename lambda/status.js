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
        // Professional Caregiver (caregivers) = event.session.user.userId / care_id = amzn1... 
        
        // Senior (seniors)
        // - event.session.user.userId / id_num = amzn1...
        // - ccode = what Caregiver tells Alexa to reference that Senior = 96kka9/etc.
        
        const self = this;
        
        pool.connect((err, client, release) => {
            if (err) {
              return console.error('Error acquiring client', err.stack);
            }
            
            client.query("SELECT * FROM seniors", (err, result) => {
                if (err) {
                    return console.error('Error executing query', err.stack);
                }
                
                console.log('SENIORS Result Row: ' + result.rows);
                var senior_id_num = result.rows[0].id_num;
                console.log('ID Num: ' + senior_id_num);
                                
                client.query("SELECT * from moods WHERE id_num = ($1) ORDER BY whenwasit DESC LIMIT 5;", [senior_id_num], (err, result) => {
                    if (err) {
                        return console.error('Error executing query', err.stack);
                    }

                    console.log('Reading Mood of: ' + senior_id_num);
                    console.log('MOODS Result Rows: ' + result.rows);
                    var mood_value_0 = result.rows[0].value;                    
                    var mood_value_1 = result.rows[1].value;
                    var mood_value_2 = result.rows[2].value;
                    var mood_value_3 = result.rows[3].value;
                    var mood_value_4 = result.rows[4].value;

                    console.log('Mood Values: ' + mood_value_0 + mood_value_1 + mood_value_2 + mood_value_3 + mood_value_4);
                    
                    var mood_when_was_it_0 = result.rows[0].whenwasit;
                    var mood_when_was_it_1 = result.rows[1].whenwasit;
                    var mood_when_was_it_2 = result.rows[2].whenwasit;
                    var mood_when_was_it_3 = result.rows[3].whenwasit;
                    var mood_when_was_it_4 = result.rows[4].whenwasit;

                    console.log('Mood Time TIMESTAMP: ' + mood_when_was_it_0 + mood_when_was_it_1 + mood_when_was_it_2 + mood_when_was_it_3 + mood_when_was_it_4);
                    
                    // 2018-01-09 14:50:00
                    var mood_when_was_it_moment_0 = moment(mood_when_was_it_0).format("YYYY-MM-DD HH:mm:ss");               
                    var mood_when_was_it_moment_1 = moment(mood_when_was_it_1).format("YYYY-MM-DD HH:mm:ss");               
                    var mood_when_was_it_moment_2 = moment(mood_when_was_it_2).format("YYYY-MM-DD HH:mm:ss");              
                    var mood_when_was_it_moment_3 = moment(mood_when_was_it_3).format("YYYY-MM-DD HH:mm:ss");              
                    var mood_when_was_it_moment_4 = moment(mood_when_was_it_4).format("YYYY-MM-DD HH:mm:ss");
                    
                    console.log('Mood Time STRING: ' + mood_when_was_it_moment_0 + mood_when_was_it_moment_1 + mood_when_was_it_moment_2 + mood_when_was_it_moment_3 + mood_when_was_it_moment_4);
//                    console.log('Mood Time STRING type: ' + typeof mood_when_was_it_moment);
                    
                    var mood_when_was_it_alexa_0 = moment(mood_when_was_it_moment_0).format('MMM Do YYYY hh:mmA');         var mood_when_was_it_alexa_1 = moment(mood_when_was_it_moment_1).format('MMM Do YYYY hh:mmA');         var mood_when_was_it_alexa_2 = moment(mood_when_was_it_moment_2).format('MMM Do YYYY hh:mmA');         var mood_when_was_it_alexa_3 = moment(mood_when_was_it_moment_3).format('MMM Do YYYY hh:mmA');         var mood_when_was_it_alexa_4 = moment(mood_when_was_it_moment_4).format('MMM Do YYYY hh:mmA');
                    
                    client.query("SELECT * FROM checkins WHERE id_num = ($1)", [senior_id_num], (err, result) => {
                        release();
                        
                        if (err) {
                            return console.error('Error executing query', err.stack);
                        }
                        
                        console.log('Reading Check-In of: ' + senior_id_num);
                        console.log('Check-In Result Rows: ' + result.rows);
                        var checkins_check_in = result.rows[0].check_in;
                        var checkins_check_out = result.rows[0].check_out;
                        console.log('CHECK-IN Check-In Value: ' + checkins_check_in);
                        console.log('CHECK-IN Check-Out Value: ' + checkins_check_out);
                        
                        var checkins_check_in_moment = moment(checkins_check_in).format("YYYY-MM-DD HH:mm:ss");
                        console.log('Check-In STRING: ' + checkins_check_in_moment);
                        var checkins_check_out_moment = moment(checkins_check_out).format("YYYY-MM-DD HH:mm:ss");
                        console.log('Check-Out STRING: ' + checkins_check_out_moment);

                        var checkins_check_in_alexa = moment(checkins_check_in_moment).format('MMM Do YYYY hh:mmA');
                        var checkins_check_out_alexa = moment(checkins_check_out_moment).format('MMM Do YYYY hh:mmA');

                        const cardTitle = 'Care Hub: Status Report';

                        var speechOutput = 'Your Status Report is ready! Please check the Card on your Alexa app!';
    //                    console.log('Type of Speech Output ' + typeof speechOutput);

                        const cardContent = 
                            'Moods...' + '\n' + 
                            'On ' + mood_when_was_it_alexa_0 + ', ' + 'the Senior expressed the mood: ' + mood_value_0 + '\n' + '\n' + 
                            'On ' + mood_when_was_it_alexa_1 + ', ' + 'the Senior expressed the mood: ' + mood_value_1 + '\n' + '\n' + 
                            'On ' + mood_when_was_it_alexa_2 + ', ' + 'the Senior expressed the mood: ' + mood_value_2 + '\n' + '\n' + 
                            'On ' + mood_when_was_it_alexa_3 + ', ' + 'the Senior expressed the mood: ' + mood_value_3 + '\n' + '\n' + 
                            'On ' + mood_when_was_it_alexa_4 + ', ' + 'the Senior expressed the mood: ' + mood_value_4 + '\n' + '\n' + 
                              
                            'Check-In...' + '\n' +
                            'The Caregiver checked-in at: ' + checkins_check_in_alexa + ', and checked-out at: ' + checkins_check_out_alexa;

                        const imageObj = {
                            smallImageUrl: 'https://bit.ly/2ttwpXV',
                            largeImageUrl: 'https://bit.ly/2ttwpXV'
                        };

                        self.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
                    });
                });
            });
        });
    }
};

module.exports = statusHandlers;