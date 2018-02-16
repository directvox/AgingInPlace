'use strict';

const moodHandlers = {
    'HelloWorldIntent': function () {
        this.emit('SayHello');
    },
    'SayHello': function () {
        this.response.speak('Hello World!');
        this.emit(':responseReady');
    },
    'InputMoodIntent': function() {
        this.response.speak("How are you feeling today?").listen("How are you feeling today?");
        
        this.emit(':responseReady');
    },
    'InputCompleteIntent': function () {
      this.emit("Thank you for your input! Your contribute has been added to the greater good of Humanity, Please take your happy pills"); 
    },
    'HappyTestIntent': function() {
        const cardTitle = 'Care Hub: Moods';
        const speechOutput = "Gloria is feeling happy as of 1:30pm Wednesday";
        const cardContent = 'Gloria is feeling happy as of 1:30pm Wednesday';
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/We7OlAD.png',
        	largeImageUrl: 'https://i.imgur.com/We7OlAD.png'
        };
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    },
    'NeutralTestIntent': function() {
        const cardTitle = 'Care Hub: Moods';
        const speechOutput = "Gloria is feeling neutral as of 1:30pm Wednesday";
        const cardContent = 'Gloria is feeling neutral as of 1:30pm Wednesday';
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/0de3NQz.png',
        	largeImageUrl: 'https://i.imgur.com/0de3NQz.png'
        };
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    },
    'SadTestIntent': function () {
        const cardTitle = 'Care Hub: Moods';
        const speechOutput = "Gloria is feeling sad as of 1:30pm Wednesday";
        const cardContent = 'Gloria is feeling sad as of 1:30pm Wednesday';
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/w0YWq8n.png',
        	largeImageUrl: 'https://i.imgur.com/w0YWq8n.png'
        };
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
        
    }
};

module.exports = moodHandlers;