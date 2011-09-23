var db = require('./db.js');

var User = db.User;
var Measure = db.Measure;


exports.isAuthenticated = function(req) {
  console.log('isAuthenticated: ' + req.session.authenticated);
  return req.session.authenticated === true;
}

exports.handleAuth = function(request, response) {
  if(!exports.isAuthenticated(request)) {
    exports.authenticateUser(request, response);
  }
}

exports.authenticateUser = function(request, response) {
  User.findOne({ 'email': request.param('email') } , function(err, user) {
    if(err) {
      console.log(err);
    }
    if(user == null) {
      console.log('Could not find user with email['+request.param('email')+']');
      //response.redirect('back', 403);
    } else if(user.authenticate(request.param('password'))) {
      request.session.authenticated = true;
      request.session.email = user.email;
      request.session.save();
      console.log("session email: "+request.session.email);
      console.log('user with email['+request.param('email')+'] is now authenticated');
    } else {
      console.log('Failed authentication attempt for user with email['+request.param('email')+']');
      //response.redirect('back', 403);
    }
  });
}