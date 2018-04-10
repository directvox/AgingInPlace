'use strict';
var userID = "";
var code = "";
var seniorId = "";
var userID = "";

const pg = require("pg");
const config = require('./config');

const pool = new pg.Pool({
    user: config.dbUSER,
    password: config.dbPWD,
    database: config.dbDatabase,
    host: config.dbURL,
    port: config.dbPort
});

const careHandlers = {

    'CreateCare': function () {
        const cCare = this.event.request.intent;
        userID = this.event.session.user.userId;
        if (cCare.slots.ccode.confirmationStatus !== 'CONFIRMED'){
            if (cCare.slots.ccode.confirmationStatus !== 'DENIED'){
                const slotToConfirm = 'ccode';
                const speechOutput = "You've told me your code is. "+cCare.slots.ccode.value.split('').join('. ')+". Is this correct?";
                const repromptSpeech = speechOutput;
                const cardTitle = "Your Caregiver Code";
                code = cCare.slots.ccode.value.toString();
                const cardContent = code;
                console.log("userID: "+ userID);
                console.log(cCare);
                console.log(cCare.slots.ccode.value);
                this.emit(':confirmSlotWithCard', slotToConfirm, speechOutput, repromptSpeech, cardTitle, cardContent);
            } else {
                const speechOutput = 'Please repeat your caregiver code.';
                const slotToElicit = 'ccode';
                this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
            }
        } else {
            code = cCare.slots.ccode.value.toString();
            this.emit('CheckCare')
        }
    },
    'CheckCare': function () {
        var self = this;
        console.log("CheckCare launching");
        pool.connect()
        .then(client => {
            return client.query("SELECT * FROM caregivers WHERE care_id = $1", [userID])
                .then(result => {
                    if(result.rows.length == 0){
                        return client.query("INSERT INTO caregivers (care_id) VALUES ($1)", [userID])
                        .then(result => {
                            return client.query("SELECT * FROM seniors WHERE ccode = $1", [code])
                            .then(result => {
                                if (result.rows.length > 0) {
                                    seniorId = result.rows[0].id_num;
                                    return client.query("INSERT INTO relationship (id_num, care_id) VALUES ($1, $2)", [seniorId, userID])
                                    .then(result => {
                                        const cardTitle = "Success";
                                        const cardContent = "Caregiver registered"
                                        self.emit(":tellWithCard", "You are now registered to a senior.", cardTitle, cardContent)
                                    })
                                    .catch(err => {
                                        self.response.speak("It appears you're already linked to this senior. Please check your code and try again.");
                                        self.emit(':responseReady');
                                    })
                                } else {
                                    const speechOutput = "Sorry; there is no senior registered with that code. Please try again.";
                                    self.response.speak(speechOutput);
                                    self.emit(':responseReady');
                                }
                            }) .catch(err => {
                                self.response.speak('Sorry there was an error.  Please try again.');
                                self.emit(':responseReady');
                            })
                        })
                    } else {
                        return client.query("SELECT * FROM seniors WHERE ccode = $1", [code])
                            .then(result => {
                                if (result.rows.length > 0) {
                                    seniorId = result.rows[0].id_num;
                                    return client.query("INSERT INTO relationship (id_num, care_id) VALUES ($1, $2)", [seniorId, userID])
                                    .then(result => {
                                        const cardTitle = "Success";
                                        const cardContent = "Caregiver registered"
                                        self.emit(":tellWithCard", "You are now registered to a senior.", cardTitle, cardContent)
                                    })
                                    .catch(err => {
                                        self.emit(":tell", "It appears you're already linked to this senior. Please check your code and try again.");
                                    })
                                } else {
                                    const speechOutput = "Sorry; there is no senior registered with that code. Please try again.";
                                    self.response.speak(speechOutput);
                                    self.emit(':responseReady');
                                }
                            })
                    }
                })
        })
    }
}

module.exports = careHandlers;
