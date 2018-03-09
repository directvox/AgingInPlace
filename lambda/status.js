'use strict';

var testing = 'brettplease';

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
        
        pool.connect((err, client, release) => {
            if (err) {
              return console.error('Error acquiring client', err.stack);
            }
            client.query("SELECT * FROM caregivers", (err, result) => {
                release();
                if (err) {
                    return console.error('Error executing query', err.stack);
                }
                console.log('Rows: ' + result.rows);
                
                testing = result.rows[0].organization;
                console.log('Testing: ' + testing);
                
                const cardTitle = 'Care Hub: Senior Check Week';
                
                var speechOutput = testing;
                console.log(typeof speechOutput);
                
                const cardContent = testing;

                const imageObj = {
                    smallImageUrl: 'https://i.imgur.com/pQ8wWLj.png',
                    largeImageUrl: 'https://i.imgur.com/pQ8wWLj.png'
                };

                self.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
            })
        });
    }
};

module.exports = statusHandlers;