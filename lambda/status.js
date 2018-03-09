'use strict';

const pg = require("pg");
const config = require('./config');

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
    
    'KSeniorCheckIntent': function () {
        const self = this;
        
        var senior_id_num = '';
        var senior_mood_value = '';
        
        pool.connect((err, client, release) => {
            if (err) {
              return console.error('Error acquiring client', err.stack);
            }
            
            client.query("SELECT * FROM seniors", (err, result) => {
                if (err) {
                    return console.error('Error executing query', err.stack);
                }
                
                console.log('SENIORS Result Row: ' + result.rows);
                senior_id_num = result.rows[0].id_num;
                console.log('ID Num: ' + senior_id_num);
                
                client.query("SELECT value FROM moods WHERE id_num = ($1)", [senior_id_num], (err, result) => {
                    release();

                    if (err) {
                        return console.error('Error executing query', err.stack);
                    }

                    console.log('Reading Mood of: ' + senior_id_num);
                    console.log('MOODS Result Rows: ' + result.rows);
                    senior_mood_value = result.rows[0].value;
                    console.log('Mood Value: ' + senior_mood_value);

                    const cardTitle = 'Care Hub: Status Report';

                    var speechOutput = 'Please check your Alexa app for the Status Report!';
                    console.log(typeof speechOutput);

                    const cardContent = 'The most recent mood expressed by the Senior is ' + senior_mood_value;

                    const imageObj = {
                        smallImageUrl: 'http://bit.ly/2ttwpXV',
                        largeImageUrl: 'http://bit.ly/2ttwpXV'
                    };

                    self.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
                });
            })
        });
    }
};

module.exports = statusHandlers;