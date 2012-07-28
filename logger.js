
//---------------------------------- airbrake setup

//var airbrake = require('airbrake').createClient("");

//---------------------------------- log4js setup
var log4js = require("log4js");

//log4js.addAppender(log4js.fileAppender('sybeol.log'), 'sybeol');

var logger = log4js.getLogger('sybeol');


//---------------------------------- Loggly setup
var loggly = require('loggly');
var logglyconfig = {
    subdomain: "<loggly subdomain>",
    auth: {
        username: "<loggly username>",
        password: "<loggly password>"
    }
};
var client = loggly.createClient(logglyconfig);


var logglyOut = function(msg) {
    client.log('<loggly key>', msg);
}

var debug = function(message) {
    logger.debug(message);
    logglyOut("DEBUG: " + message);
}
var info = function(message) {
    logger.info(message);
    logglyOut("INFO: " + message);
}
var warn = function(message) {
    logger.warn(message);
    logglyOut("WARN: " + message);
}
var error = function(message) {
    logger.error(message);
    logglyOut("ERROR: " + message);

//    airbrake.notify(message, function(err, url) {
//        logger.error(err);
//        logglyOut("ERROR: " + err);
//        // Error has been delivered, url links to the error in airbrake
//    });
}

var public = new Object();
public.info = info;
public.debug = debug;
public.warn = warn;
public.error = error;

exports.getLogger = function(loggerId) {
    return public;
}
