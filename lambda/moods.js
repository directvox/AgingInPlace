'use strict';

const moodHandlers = {
    'InputMoodIntent': function() {
        this.response.speak("How are you feeling today?").listen("How are you feeling today?");
        
        this.emit(':responseReady');
    },
    'InputCompleteIntent': function () {

        var mood = "happy";
        pool.connect((err, client, release) => {
            client.query("INSERT INTO moods (value, whenwasit, id_num) VALUES ('$1', NOW(), '2')", [mood], (err, result) => {
                release()
                if (err) {
                  return console.error('Error executing query', err.stack)
                }
                console.log(result.rows)
                this.emit("Thank you for your input! Your contribute has been added to the greater good of Humanity, Please take your happy pills");
              })
        });

       
    },
    'HappyTestIntent': function() {
        const cardTitle = 'Care Hub: Moods';
        const speechOutput = "Sally is feeling happy as of 1:30pm Wednesday";
        const cardContent = 'Sally is feeling happy as of 1:30pm Wednesday';
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/We7OlAD.png',
        	largeImageUrl: 'https://i.imgur.com/We7OlAD.png'
        };


        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    },
    'NeutralTestIntent': function() {
        const cardTitle = 'Care Hub: Moods';
        const speechOutput = "Sally is feeling neutral as of 1:30pm Wednesday";
        const cardContent = 'Sally is feeling neutral as of 1:30pm Wednesday';
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/0de3NQz.png',
        	largeImageUrl: 'https://i.imgur.com/0de3NQz.png'
        };
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    },
    'SadTestIntent': function () {
        const cardTitle = 'Care Hub: Moods';
        const speechOutput = "Sally is feeling sad as of 1:30pm Wednesday";
        const cardContent = 'Sally is feeling sad as of 1:30pm Wednesday';
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/w0YWq8n.png',
        	largeImageUrl: 'https://i.imgur.com/w0YWq8n.png'
        };
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
        
    }
};

module.exports = moodHandlers;