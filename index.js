'use strict';

//packages
const Alexa = require('alexa-sdk');

//imports
const config = require('./lambda/config');
const mainHandlers = require('./lambda/main');
const checkHandlers = require("./lambda/checkInOut");
const moodHandlers = require("./lambda/moods");
const statusHandlers = require("./lambda/status");

//handler
exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = config.appId;
    alexa.registerHandlers(mainHandlers, checkHandlers, moodHandlers, statusHandlers);
    alexa.execute();
};