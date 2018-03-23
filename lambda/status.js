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
    'KPositiveIntent': function () {
        const cardTitle = 'Care Hub: Positive Status';
        const speechOutput = 'Hurray! Glad to hear that Susan arrived on time!';
        const cardContent = 'Hurray! Glad to hear that Susan arrived on time!';
        
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/7ZR0GPp.jpg',
        	largeImageUrl: 'https://i.imgur.com/7ZR0GPp.jpg'
        };
        
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    },
    
    'KNegativeIntent': function () {
        const self = this;
        
        const cardTitle = 'Care Hub: Negative Status';
        const speechOutput = 'Shame! I have noted that Susan was late today!';
        const cardContent = 'Shame! I have noted that Susan was late today!';
        
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/pQ8wWLj.png',
        	largeImageUrl: 'https://i.imgur.com/pQ8wWLj.png'
        };
        
        self.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    },
    
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
                
                client.query("SELECT * FROM moods WHERE id_num = ($1)", [senior_id_num], (err, result) => {
                    if (err) {
                        return console.error('Error executing query', err.stack);
                    }

                    console.log('Reading Mood of: ' + senior_id_num);
                    console.log('MOODS Result Rows: ' + result.rows);
                    var mood_value = result.rows[0].value;
                    var mood_when_was_it = result.rows[0].whenwasit;
                    console.log('Mood Value: ' + mood_value);
                    console.log('Mood Time TIMESTAMP: ' + mood_when_was_it);
                    
                    // 2018-01-09 14:50:00
                    var mood_when_was_it_moment = moment(mood_when_was_it).format("YYYY-MM-DD HH:mm:ss");
                    console.log('Mood Time STRING: ' + mood_when_was_it_moment);
//                    console.log('Mood Time STRING type: ' + typeof mood_when_was_it_moment);
                    
                    var mood_when_was_it_alexa = moment(mood_when_was_it_moment).format('MMM Do YYYY hh:mmA');
                    
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
                              'On ' + mood_when_was_it_alexa + ', ' + 'the Senior expressed the mood: ' + mood_value + '\n' + '\n' + 
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