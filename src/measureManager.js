var db = require("./db.js");
var logger = require('./logger.js').getLogger("measureManager");

var Measure = db.Measure;

var list = function(user, type, cb) {
    Measure.find({ type: type, user: user.email}, function(err, measures) {
        cb(err, measures);
    });
}

var add = function(user, measure, cb) {
    validateKey(user, measure, function(err) {
        if(err) {
            cb(err, null);
        } else {
            logger.info("Creating new measure for user ["+ user.email + "]");
            if(user.sensors) {
                var sensor = undefined;
                for(var i=0 ; i < user.sensors.length ; i++) {
                    if(user.sensors[i].uid == measure.uid) {
                        sensor = user.sensors[i];
                        logger.info("Using sensor ["+sensor.name+"] for measure")
                    }
                }
                if(sensor) {
                    var msr = db.createMeasure(user.email, sensor.name, new Date().getTime(), measure.value);
                    cb(null, msr);
                } else {
                    var error = new Error("Could not find device with uid ["+measure.uid+"] for user ["+user.email+"]");
                    logger.warn(error);
                    cb(error, null);
                }
            } else {
                var error = new Error("User ["+user.email+"] has no device defined");
                logger.warn(error);
                cb(error, null);
            }
        }
    })
}


var validateKey = function(user, measure, cb) {

    if(user && measure) {
        var rightKey = (user.apiKey == measure.apiKey);
        var rightEmail = (user.email == measure.email);
        if(rightEmail) {
            if(rightKey) {
                cb();
            } else {
                cb(new Error("Wrong apiKey"));
            }
        } else {
            cb(new Error("Emails don't match. Expected ["+user.email+"] but got ["+measure.email+"]"));
        }
    } else {
        logger.error("User and Measure arguments must not be null");
        cb(new Error("Server error. Please contact our support"));
    }
}



exports.add = add;
exports.list = list;
