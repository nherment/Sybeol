var db = require('./db.js');
var logger = require('./logger.js').getLogger('authentication');
var mail = require("./mail.js");

var User = db.User;
var Measure = db.Measure;


var isAuthenticated = function(req) {
    logger.info('isAuthenticated: ' + req.session.authenticated);
    if(req.session.authenticated) {
        if(req.session.email) {
            return true;
        }
    }
    return false;
}

var handleAuth = function(request, response) {
    if(!exports.isAuthenticated(request)) {
        logger.info('Not yet authenticated');
        if(request.method == "GET") {
            exports.authenticateUserParams(request, response);
        } else {
            exports.authenticateUserJson(request, response);
        }
    } else {
        logger.info('Already authenticated');
        response.end('{"result": "success"}');
    }
}

var handleAuthJson = function(request, response) {
    if(!exports.isAuthenticated(request)) {
        logger.info('Not yet authenticated');
        exports.authenticateUserJson(request, response);
    } else {
        logger.info('Already authenticated');
        response.end('{"result": "success"}');
    }
}

var authenticateUser = function(request, response, email, password) {

    if(request.body) {

        logger.info("authenticating " + email);
        db.getUser(email, function(err, user) {
            logger.info("processing...");
            if(err) {
                logger.error("Error:"+err);
                response.end('{"result": "Failed"}');
            }
            if(user == null) {
                logger.info('Could not find user with email['+email+']');
                response.end('{"result": "Failed"}');
            } else if(user.authenticate(password)) {
                request.session.authenticated = true;
                request.session.email = user.email;
                request.session.save();
                //logger.info("session email: "+request.session.email);
                logger.info('user with email ['+user.email+'] is now authenticated');
                response.end('{"result": "success"}');
            } else {
                logger.info('Failed authentication attempt for user with email['+email+']');
                response.end('{"result": "Failed"}');
                //response.redirect('back', 403);
            }
        });
    } else {
        logger.info("request body is empty for authentication query");
        response.end('{"result": "Failed"}');
    }
}

var authenticateUserJson = function(request, response) {
    logger.info('Attempting JSON parsing of the request body');
    if(request.body) {
        authenticateUser(request, response, request.body.email, request.body.password);
    } else {
        logger.info('The request\'s body is empty. Cannot proceed with authentication');
        response.end('{"result": "Failed"}');
    }
}


var authenticateUserParams = function(request, response) {
    authenticateUser(request, response, request.param('email'), request.param('password'));
}

var handleRegister = function(request, response) {

    if(request.body) {
        db.createUser(request.body.email, request.body.password, function(err, user) {
            if(err) {
                logger.log(err);
                response.end('{"result": "Failed", "cause": "'+ err +'" }');
            } else {
                logger.info("Registered new user: " + JSON.stringify(user));
                sendActivationMail(user);
                response.end('{"result": "success"}');
            }
        });
    } else {
        response.end('{"result": "Failed"}');
    }
}

var sendActivationMail = function(user) {

    logger.info("sending validation key to user: " + JSON.stringify(user));


    var mailOpts = {
        subject: "Activate your new Sybeol account !",
        body: "Click on this link to activate your account: http://www.sybeol.com/activate/?u=" + user.email + "&k=" + user.validationKey
    }

    mail.send(user.email, mailOpts.subject, mailOpts.body, function(e) {
        if(e) {
            logger.error("Error sending email to [" + user.email + "]" + e);
        } else {
            logger.info("Validation email sent: " + JSON.stringify(mailOpts));
        }
    });
}

var activate = function(email, validationKey, callback) {
    logger.info("Activating " + email + " with key " + validationKey);
    db.getUser(email, function(err, user) {
        if(err) {
            logger.error("Error:"+err);
            callback(err, null);
        } else if(user) {
            logger.info("found matching user [" + user.email + "] for activation");
            if(user.validationKey === validationKey) {
                logger.info("Activation key match");
                user.active = true;
                user.save();
                logger.info("User is now active");
                callback(null, user);
            } else {
                var msg = "Activation key does not match the one expected. Expected ["+user.validationKey+"] but got ["+validationKey+"]";
                logger.warn(msg);
                callback("Activation key is not valid", null);
            }
        } else{
            logger.info('Activation: Could not find user with email['+email+']');
            callback("User not found", null);
        }
    });
}

exports.authenticateUserParams = authenticateUserParams;
exports.authenticateUserJson = authenticateUserJson;
exports.handleAuthJson = handleAuthJson;
exports.handleAuth = handleAuth;
exports.isAuthenticated = isAuthenticated;
exports.handleRegister = handleRegister;
exports.activate = activate;
