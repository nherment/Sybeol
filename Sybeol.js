
var uuid = require('node-uuid');
var authSvc = require('./authentication.js');
var db = require('./db.js');

var User = db.User;
var Measure = db.Measure;
var createUser = db.createUser;
var createMeasure = db.createMeasure;

//---------------------------------- Loggly
var loggly = require('loggly');
  var logglyconfig = {
    subdomain: "sybeol",
    auth: {
      username: "nherment",
      password: "6031769a"
    }
  };
var client = loggly.createClient(logglyconfig);

client.log('32be8efd-0733-4f6d-a898-52ead34af20a', 'server is started');


//----------------------------------- Server config


var express = require('express');

var RedisStore = require('connect-redis')(express);

var app = express.createServer();

app.configure(function() {
  app.use(express.bodyParser());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.cookieParser());
  app.use(express.session({ secret: "keyboard cat", store: new RedisStore }));
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
    authSvc.handleAuth(req, res);
    res.send(200);
  } else {
    res.send(400);
  }
});

app.get('/login/:email/:password', function(req, res) {
  console.log("login attempt for user["+ req.param('email') + "]");
  authSvc.handleAuth(req, res);
  res.send(200);
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.send(200);
});

app.get('/test', function(req, res) {
req.session.count = (req.session.count) ? req.session.count + 1 : 1;
console.log(req.session.count);
      console.log("session email: "+req.session.email);
  res.end(req.session.email);
});


//----------------------------------- Measure API

app.put('/measure/', function(req, res) {
  console.log("receive put reauest on /measure");
  var isJson = req.is('application/json');
  if(isJson) {
    console.log("Creating new measure ["+ req.param('email') + "]");
    createMeasure(req.param('email'), req.param('password'));
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