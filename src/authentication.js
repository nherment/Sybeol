var db = require('./db.js');
var logger = require('./logger.js').getLogger('authentication');

var User = db.User;
var Measure = db.Measure;


exports.isAuthenticated = function(req) {
    logger.info('isAuthenticated: ' + req.session.authenticated);
    return req.session.authenticated === true;
}

exports.handleAuth = function(request, response) {
    if(!exports.isAuthenticated(request)) {
        logger.info('Not yet authenticated');
        if(request.method == "GET") {
            exports.authenticateUserParams(request, response);
        } else {
            exports.authenticateUserJson(request, response);
        }
    } else {
        logger.info('Already authenticated');
        response.send(200);
    }
}

exports.handleAuthJson = function(request, response) {
    if(!exports.isAuthenticated(request)) {
        logger.info('Not yet authenticated');
        exports.authenticateUserJson(request, response);
    } else {
        logger.info('Already authenticated');
        response.send(200);
    }
}

var authenticateUser = function(request, response, email, password) {

    if(request.body != null) {

        logger.info("authenticating...");
        User.findOne({ 'email': email } , function(err, user) {
            logger.info("processing...");
            if(err) {
                logger.info("Error:"+err);
                response.send(403);
            }
            if(user == null) {
                logger.info('Could not find user with email['+email+']');
                response.send(403);
            } else if(user.authenticate(password)) {
                request.session.authenticated = true;
                request.session.email = user.email;
                request.session.save();
                //logger.info("session email: "+request.session.email);
                logger.info('user with email['+email+'] is now authenticated');
                response.send(200);
            } else {
                logger.info('Failed authentication attempt for user with email['+email+']');
                response.send(403);
                //response.redirect('back', 403);
            }
        });
    } else {
        response.send(400);
    }
}

exports.authenticateUserJson = function(request, response) {
    logger.info('Attempting JSON parsing of the request body');
    if(request.body != null) {
        authenticateUser(request, response, request.body.email, request.body.password);
    } else {
        logger.info('The request\'s body is empty. Cannot proceed with authentication');
        response.send(400);
    }
}


exports.authenticateUserParams = function(request, response) {
    logger.info("authenticating...");
    authenticateUser(request, response, request.param('email'), request.param('password'));
}
