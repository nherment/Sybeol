
var uuid = require('node-uuid');
var authSvc = require('./authentication.js');
var db = require('./db.js');
var logger = require('./logger.js').getLogger("sybeol");

var User = db.User;
var Measure = db.Measure;
var createUser = db.createUser;
var createMeasure = db.createMeasure;


//----------------------------------- Server config


var infoIp = function(msg, req) {
    logger.info(msg + " IP["+req.connection.remoteAddress+"]")
}
var warnIp = function(msg, req) {
    logger.info(msg + " IP["+req.connection.remoteAddress+"]")
}

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
    infoIp("receive put request on /user", req);
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

//app.get('/user', function(req, res) {
//    logger.info("receive get request on /user");
//    User.find({}, function(err, users) {
//        if(err) {
//            throw new Error(err);
//        } else {
//            res.writeHead(200, {'Content-Type': 'application/json'});
//            res.end(JSON.stringify(users));
//        }
//    });
//});

//--------------------------------- Authentication API

app.get('/login/:email/:password', function(req, res) {
    infoIp("login attempt for user ["+ req.param('email') + "]", req);
    authSvc.handleAuth(req, res);
    //res.send(200);
});

app.get('/loginStatus', function(req, res) {
    infoIp("login verification", req);
    if(authSvc.isAuthenticated(req) == true) {
        res.end("YES")
    } else {
        res.end("NO")
    }
});

app.post('/login', function(req, res) {
    var isJson = req.is('application/json');
    if(isJson) {
        infoIp('Login attempt trough POST', req);
        authSvc.handleAuth(req, res);
    } else {
        logger.security("Login attempt made with wrong request")
        res.end("Expecting Content-Type:application/json");
        //res.send(400);
    }
});

app.get('/logout', function(req, res) {
    infoIp("Logout ["+req.session.email+"]", req);
    req.session.destroy();
    res.send(200);
});


app.post('/register', function(req, res) {
    var isJson = req.is('application/json');
    if(isJson) {
        infoIp('Registering attempt trough POST', req);
        authSvc.handleRegister(req, res);
    } else {
        warnIp("Registering attempt made with wrong request", req);
        res.end("Expecting Content-Type:application/json");
        //res.send(400);
    }
});

app.get('/activate/:email/:validationKey', function(req, res) {
    infoIp('Activation from ', req);
    authSvc.activate(req.param("email"), req.param("validationKey"), function(err, user){
        if(err) {
            res.end( '{ "result": "Failed", "cause": "'+err+'" }' );
        } else {
            res.end('{"result":"success"}');
        }
    });
});


//----------------------------------- Measure API

app.put('/measure', function(req, res) {
    infoIp("receive put request on /measure", req);
//    var isJson = req.is('application/json');
//    if(isJson) {
//        logger.info("Creating new measure for user ["+ req.param('user') + "]");
//        createMeasure(req.param("user"), req.param("type"), new Date().getTime(), req.param("value"));
//        res.send(200);
//    } else {
//        res.send(400);
//        res.end("Expecting Content-Type:application/json");
//    }
});

app.get('/measure', function(req, res) {
    infoIp("receive get request on /measure", req);
    Measure.find({}, function(err, measures) {
        if(err) {
            throw new Error(err);
        } else {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(measures));
        }
    });
});


var port = 4100;
app.listen(port);
logger.info("listening on port " + port);
