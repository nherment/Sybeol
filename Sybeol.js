var mongoose = require('mongoose');
var crypto = require('crypto');

mongoose.connect('mongodb://localhost/dev_database');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


function validatePresenceOf(value) {
  return value && value.length;
}

UserSchema = new Schema({
  'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
  'hashed_password': String,
  'salt': String
});

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() { return this._password; });

UserSchema.pre('save', function(next) {
  if (!validatePresenceOf(this.password)) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
});

UserSchema.method('authenticate', function(plainText) {
  return this.encryptPassword(plainText) === this.hashed_password;
});

UserSchema.method('makeSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

UserSchema.method('encryptPassword', function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

var User = mongoose.model('User', UserSchema);


var MeasureSchema = new Schema({
    user    :  [User]
  , type    :  { type: String, index: true }
  , time    :  { type: Date, default: Date.now, index: true }
  , value   :  { type: Number }
});

var Measure = mongoose.model('Measure', MeasureSchema);


var createMeasure = function(user, type, time, value) {
  var msr = new Measure({
    'user': user,
    'type': type,
    'time': time,
    'value': value
  });
  msr.save();
}


//----------------------------------- Authentication

var handleAuth = function(request, response) {
  if(!isAuthenticated(request)) {
    authenticateUser(request, response);
  }
}

var authenticateUser = function(request, response) {
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
      console.log("session email: "+request.session.email);
      console.log('user with email['+request.param('email')+'] is now authenticated');
    } else {
      console.log('Failed authentication attempt for user with email['+request.param('email')+']');
      //response.redirect('back', 403);
    }
  });
}

var isAuthenticated = function(req) {
  console.log(req.session.authenticated);
  return req.session.authenticated == true;
}

//-----------------------------------

/*var nhermentUser = new User({
  email: 'nherment@gmail.com',
  password: 'nherment'
});
nhermentUser.save();*/

var createUser = function(email, password) {
  var usr = new User({
    'email': email,
    'password': password
  });
  usr.save();
}
//----------------------------------- Server config


var express = require('express');

var app = express.createServer();

app.configure(function() {
  app.use(express.bodyParser());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.cookieParser());
  app.use(express.session({ secret: "qlasd33j0jfw3j" }));
  app.use(app.router);
});

//----------------------------------- User API

app.put('/user', function(req, res) {
  console.log("receive put request on /user");
  var isJson = req.is('application/json');
  if(isJson) {
    console.log("Creating user with email["+ req.body.email + "]");
    createUser(req.body.email, req.body.password);
    res.send(200);
  } else {
    res.send(400);
    res.end("Expecting Content-Type:application/json");
  }
});

app.get('/user', function(req, res) {
  console.log("receive get request on /user");
  User.find({}, function(err, users) {
    if(err) {
      throw new Error(err);
    } else {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(users));
    }
  });
});

app.post('/login', function(req, res) {
  var isJson = req.is('application/json');
  if(isJson) {
    console.log("login attempt for user["+ req.param('email') + "]");
    handleAuth(req, res);
    res.send(200);
  } else {
    res.send(400);
  }
});

app.get('/login/:email/:password', function(req, res) {
  console.log("login attempt for user["+ req.param('email') + "]");
  handleAuth(req, res);
  res.send(200);
});

app.get('/test', function(req, res) {
req.session.count = (req.session.count) ? req.session.count + 1 : 1;
console.log(req.session.count);
      console.log("session email: "+req.session.email);
  res.end(req.session.email);
});


//----------------------------------- Measure API

app.put('/measure', function(req, res) {
  console.log("receive put reauest on /measure");
  var isJson = req.is('application/json');
  if(isJson) {
    console.log("Creating user with email["+ req.body.email + "]");
    createMeasure(req.body.email, req.body.password);
    res.send(200);
  } else {
    res.send(400);
    res.end("Expecting Content-Type:application/json");
  }
});

app.get('/measure', function(req, res) {
  console.log("receive get request on /user");
  Measure.find({}, function(err, measures) {
    if(err) {
      throw new Error(err);
    } else {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(users));
    }
  });
});

//----------------------------------- views


app.get('/measure', function(req, res) {
  res.render('index');
});

app.listen(8000);