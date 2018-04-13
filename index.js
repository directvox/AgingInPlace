'use strict';

//packages
const Alexa = require('alexa-sdk');
const pg = require("pg");

//imports
const config = require('./handlers/config');
const mainHandlers = require('./handlers/main');
const checkHandlers = require("./handlers/checkInOut");
const moodHandlers = require("./handlers/moods");
const statusHandlers = require("./handlers/status");
const creatingHandlers = require("./handlers/createRole");
const careHandlers = require("./handlers/createCare");

//handler
exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = config.appId;
    context.callbackWaitsForEmptyEventLoop = false;
    alexa.registerHandlers(mainHandlers, checkHandlers, moodHandlers, statusHandlers, creatingHandlers, careHandlers);
    alexa.execute();
};