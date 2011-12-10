var db = require('./db.js');
var logger = require('./logger.js').getLogger('authentication');
var mail = require("./mail.js");
var ErrorUtil = require("./util.js").Error;

var User = db.User;
var Measure = db.Measure;

var isAuthenticated = function(req, cb) {
    var err;
    logger.info("session id: " + req.session.id);
    req.session.reload(function(err){
        if(err) {
            logger.error(err);
            //    cb(false);
            //    throw err;
        }
        //} else {
        logger.debug(JSON.stringify(req.session));
        logger.info('isAuthenticated: ' + req.session.authenticated);
        logger.debug('isAuthenticated email: ' + req.session.email);
        logger.debug("session cookie:" + JSON.stringify(req.session.cookie));
        if(req.session.authenticated) {
            if(req.session.email) {
                cb(true);
            } else {
                logger.error("Inconsistent session state. authenticated=true but email is missing");
                cb(false);
            }
        } else {
            cb(false);
        }
        //}
    });
}

var getCurrentUser = function(req, cb) {
    isAuthenticated(req, function(isAuth) {
        if(isAuth) {
            db.getUser(req.session.email, function(err, user) {
                if(err) {
                    cb(err, null);
                } else if(user) {
                    cb(null, user);
                } else {
                    var error = new Error("User is authenticated but could not find it in DB. IP["+req.connection.remoteAddress+"]");
                    logger.error(error);
                    cb(error, null);
                }
            });
        } else {
            var err = new Error("Authentication required");
            logger.warn(err);
            cb(err, null);
        }
    });
}

var handleAuth = function(request, response) {
    isAuthenticated(request, function(isAuth) {
        if(isAuth) {
            logger.info('Already authenticated');
            response.end('{"result": "success"}');
        } else {
            logger.info('Not yet authenticated');
            if(request.method == "GET") {
                exports.authenticateUserParams(request, response);
            } else {
                exports.authenticateUserJson(request, response);
            }
        }
    })
}

var handleAuthJson = function(request, response) {
    isAuthenticated(request, function(isAuth) {
        if(isAuth) {
            logger.info('Already authenticated');
            response.end('{"result": "success"}');
        } else {
            logger.info('Not yet authenticated');
            exports.authenticateUserJson(request, response);
        }
    });
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
            if(user) {
                if(user.active) {
                    if(user.authenticate(password)) {
                        request.session.authenticated = true;
                        request.session.email = user.email;
                        request.session.save(function(err){
                            logger.info("session saved");
                            if(err) {
                                logger.error(err);
                                throw err;
                            }
                        });
                        logger.debug("session cookie:" + JSON.stringify(request.session.cookie));
                        //logger.info("session email: "+request.session.email);
                        logger.info('user with email ['+request.session.email+'] is now authenticated');
                        response.send('{"result": "success"}');
                    } else {
                        logger.info('authentication failed because the password is wrong. user['+user.email+']');
                        response.end('{"result": "Failed", "cause":"Wrong password"}');
                    }
                } else {
                    logger.info('authentication failed because acount is inactive. user['+user.email+']');
                    response.end('{"result": "Failed", "cause":"The account needs to be activated"}');
                }
            } else {
                logger.info('Could not find user with email['+email+']');
                response.end('{"result": "Failed", "cause":"Unknown email"}');
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
var emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i ;

var handleRegister = function(request, response) {

    if(request.body) {
        var email = request.body.email;
        var password = request.body.password;
        if(emailPattern.test(email)) {
            db.createUser(email, password, function(err, user) {
                if(err) {
                    logger.error(err);
                    response.send(ErrorUtil.reduce(err));
                } else {
                    logger.info("Registered new user: " + JSON.stringify(user));
                    sendActivationMail(user);
                    response.send({ result: "success" });
                }
            });
        } else {
            var err = new Error("Email is invalid ["+email+"]");
            logger.error(err);
            response.send(ErrorUtil.reduce(err));
        }
    } else {
        response.end('{"result": "Failed"}');
    }
}

var sendActivationMail = function(user) {

    logger.info("sending registration mail to user: " + JSON.stringify(user));

    var mailOpts = {
        subject: "Regarding your new Sybeol account",
        body: "Thank you for registering for a new account. \n\nThe product is currently in Beta and we are manually activating each account.\nWe want to know about your amazing project so you will hear from us in the next 48 hours! \n\nThank you !\n- The Sybeol team"
    }
    var mailOptsAdmin = {
        subject: "New registration on Sybeol",
        body: "Click on this link to activate your account: http://www.sybeol.com/activate/?u=" + user.email + "&k=" + user.validationKey
    }

    mail.send(user.email, mailOpts.subject, mailOpts.body, function(e) {
        if(e) {
            logger.error("Error sending email to [" + user.email + "]" + e);
        } else {
            logger.info("Validation email sent: " + JSON.stringify(mailOpts));
        }
    });

    mail.send("nicolas@sybeol.com", mailOptsAdmin.subject, mailOptsAdmin.body, function(e) {
        if(e) {
            logger.error("Error sending email to [" + user.email + "]" + e);
        } else {
            logger.info("Validation email sent: " + JSON.stringify(mailOpts));
        }
    });
}

var sendAccountActiveEmail = function(user) {
    var mailOpts = {
        subject: "Your Sybeol account is now active",
        body: "Thank you for your patience for a new account. \n\nYour account is now active. Please go take a look: http://www.sybeol.com.\n\nThank you !\n- The Sybeol team"
    }

    mail.send(user.email, mailOpts.subject, mailOpts.body, function(e) {
        if(e) {
            logger.error("Error sending email to [" + user.email + "]" + e);
        } else {
            logger.info("'Account activated' notification email sent: " + JSON.stringify(mailOpts));
        }
    });
}

var activate = function(email, validationKey, callback) {
    if(email && validationKey) {
        logger.info("Activating " + email + " with key " + validationKey);
        db.getUser(email, function(err, user) {
            if(err) {
                logger.error("Error:"+err);
                callback(err, null);
            } else if(user) {
                logger.info("found matching user [" + user.email + "] for activation");
                if(user.validationKey === validationKey) {
                    logger.debug("Activation key match for user [" + user.email + "]");
                    user.active = true;
                    user.validationKey = undefined;
                    user.save();
                    logger.info("User [" + user.email + "] is now active");
                    sendAccountActiveEmail(user);
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
    } else {
        callback(new Error("Wrong arguments"), null);
    }
}

var sendPasswordResetMail = function(user, password) {

    logger.info("sending new password to user: " + JSON.stringify(user));

    var mailOpts = {
        subject: "Your new Sybeol password",
        body: "Your new password is: " + password
    }

    mail.send(user.email, mailOpts.subject, mailOpts.body, function(e) {
        if(e) {
            logger.error("Error sending email to [" + user.email + "]" + e);
        } else {
            logger.info("Reset password email sent to [" + user.email + "]");
        }
    });
}

var resetPassword = function(email, callback) {
    if(emailPattern.test(email)) {
        logger.info("Resetting password for [" + email + "]");
        db.getUser(email, function(err, user) {
            if(err) {
                callback(err);
            } else if(user) {
                try {
                    var newPassword = generatePassword(8);
                    user.password = newPassword;
                    user.save();
                    sendPasswordResetMail(user, newPassword);
                    callback();
                } catch(err) {
                    callback(err);
                }
            } else {
                var noSuchUserError = new Error("Could not find user with email ["+email+"]");
                logger.warn(noSuchUserError);
                callback(noSuchUserError);
            }
        });
    } else {
        var err = new Error("Email is invalid ["+email+"]");
        logger.error(err);
        res.send(ErrorUtil.reduce(err));
        callback(err);
    }

}

exports.authenticateUserParams = authenticateUserParams;
exports.authenticateUserJson = authenticateUserJson;
exports.handleAuthJson = handleAuthJson;
exports.handleAuth = handleAuth;
exports.isAuthenticated = isAuthenticated;
exports.handleRegister = handleRegister;
exports.activate = activate;
exports.resetPassword = resetPassword;
exports.getCurrentUser = getCurrentUser;


function getRandomNum(lbound, ubound) {
    return (Math.floor(Math.random() * (ubound - lbound)) + lbound);
}
function getRandomChar(number, lower, upper, other) {
    var numberChars = "123456789123456789";
    var lowerChars = "abcdefghijklmnpqrstuvwxyz";
    var upperChars = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
    var otherChars = "------______";
    var charSet = "";
    if (number == true)
        charSet += numberChars;
    if (lower == true)
        charSet += lowerChars;
    if (upper == true)
        charSet += upperChars;
    if (other == true)
        charSet += otherChars;
    return charSet.charAt(getRandomNum(0, charSet.length));
}
function generatePassword(length) {
    var rc = "";
    if (length > 0)
        rc = rc + getRandomChar(true, true, true, true);
    for (var idx = 1; idx < length; ++idx) {
        rc = rc + getRandomChar(true, true, true, true);
    }
    return rc;
}
