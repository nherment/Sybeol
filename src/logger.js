
//---------------------------------- log4js setup
var log4js = require("log4js");

//log4js.addAppender(log4js.fileAppender('sybeol.log'), 'sybeol');

var logger = log4js.getLogger('sybeol');


//---------------------------------- Loggly setup
var loggly = require('loggly');
var logglyconfig = {
    subdomain: "sybeol",
    auth: {
        username: "nherment",
        password: "6031769a"
    }
};
var client = loggly.createClient(logglyconfig);


var logglyOut = function(msg) {
    client.log('32be8efd-0733-4f6d-a898-52ead34af20a', msg);
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
}

var public = new Object();
public.info = info;
public.debug = debug;
public.warn = warn;
public.error = error;

exports.getLogger = function(loggerId) {
    return public;
}
