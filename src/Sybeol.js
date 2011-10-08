
var uuid = require('node-uuid');
var authSvc = require('./authentication.js');
var db = require('./db.js');
var logger = require('./logger.js').getLogger("sybeol");

var User = db.User;
var Measure = db.Measure;
var createUser = db.createUser;
var createMeasure = db.createMeasure;


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
    app.use(express.session({ secret: "keyboard cat"/*, store: new RedisStore*/ }));
    app.use(app.router);
});

//----------------------------------- User API

app.put('/user', function(req, res) {
    logger.info("receive put request on /user");
    var isJson = req.is('application/json');
    if(isJson) {
        logger.info("Creating user with email["+ req.body.email + "]");
        createUser(req.body.email, req.body.password);
        res.send(200);
    } else {
        res.send(400);
        res.end("Expecting Content-Type:application/json");
    }
});

app.get('/user', function(req, res) {
    logger.info("receive get request on /user");
    User.find({}, function(err, users) {
        if(err) {
            throw new Error(err);
        } else {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(users));
        }
    });
});

//--------------------------------- Authentication API

app.get('/login/:email/:password', function(req, res) {
    logger.info("login attempt for user["+ req.param('email') + "]");
    authSvc.handleAuth(req, res);
    //res.send(200);
});

app.get('/loginStatus', function(req, res) {
    logger.info("login verification for user["+ req.param('email') + "]");
    if(authSvc.isAuthenticated(req) == true) {
        res.send(200);
    } else {
        res.send(403);
    }
});

app.post('/login', function(req, res) {
    var isJson = req.is('application/json');
    if(isJson) {
        logger.info('Login attempt trough POST');
        authSvc.handleAuth(req, res);
    } else {
        logger.security("Login attempt made with wrong request")
        res.end("Expecting Content-Type:application/json");
        //res.send(400);
    }
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.send(200);
});

app.get('/test', function(req, res) {
    req.session.count = (req.session.count) ? req.session.count + 1 : 1;
    logger.info(req.session.count);
    logger.info("session email: "+req.session.email);
    res.end(req.session.email);
});


//----------------------------------- Measure API

app.put('/measure', function(req, res) {
    logger.info("receive put request on /measure");
    var isJson = req.is('application/json');
    if(isJson) {
        logger.info("Creating new measure for user ["+ req.param('user') + "]");
        createMeasure(req.param("user"), req.param("type"), new Date().getTime(), req.param("value"));
        res.send(200);
    } else {
        res.send(400);
        res.end("Expecting Content-Type:application/json");
    }
});

app.get('/measure', function(req, res) {
    logger.info("receive get request on /measure");
    Measure.find({}, function(err, measures) {
        if(err) {
            throw new Error(err);
        } else {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(measures));
        }
    });
});

//----------------------------------- views


app.get('/measure', function(req, res) {
    res.render('index');
});

var port = 4100;
app.listen(port);
logger.info("listening on port " + port);
