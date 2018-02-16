'use strict';

const statusHandlers = {
    'PositiveIntent': function () {
        const cardTitle = 'Care Hub: Positive Status';
        const speechOutput = 'Hurray! Glad to hear that Susan arrived on time!';
        const cardContent = 'Hurray! Glad to hear that Susan arrived on time!';
        
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/7ZR0GPp.jpg',
        	largeImageUrl: 'https://i.imgur.com/7ZR0GPp.jpg'
        };
        
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    },
    
    'NegativeIntent': function () {
        const cardTitle = 'Care Hub: Negative Status';
        const speechOutput = 'Shame! I have noted that Susan was late today!';
        const cardContent = 'Shame! I have noted that Susan was late today!';
        
        const imageObj = {
        	smallImageUrl: 'https://i.imgur.com/pQ8wWLj.png',
        	largeImageUrl: 'https://i.imgur.com/pQ8wWLj.png'
        };
        
        this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);
    }
};

module.exports = statusHandlers;