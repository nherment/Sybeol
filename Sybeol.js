
var uuid = require('node-uuid');
var authSvc = require('./authentication.js');
var db = require('./db.js');
var logger = require('./logger.js').getLogger("main");
var measureManager = require('./measureManager.js');
var ErrorUtil = require("./util.js").Error;
var JsonUtil = require("./util.js").Json;


//----------------------------------- Server config


var infoIp = function(msg, req) {
    logger.info("["+req.connection.remoteAddress+"] " + msg);
}
var warnIp = function(msg, req) {
    logger.warn("["+req.connection.remoteAddress+"] " + msg);
}

var express = require('express');


var RedisStore = require('connect-heroku-redis')(express);
var MemoryStore = express.session.MemoryStore;

var app = express.createServer();
var session = require('./session.js');

app.configure(function() {
    //app.use(express.logger());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    //app.use(express.session({ secret: "J41Ma14uB1D3", store: new RedisStore() }));
    app.use(express.session({ secret: "J41Ma14uB1D3", store: new MemoryStore({ reapInterval: 60000 * 10 }) }));
    //app.use(session.getSession());
    app.use(express.static(__dirname + '/static'));
    app.use(app.router);
});


/**  *******************************************************  **/
/**  *                       USER                          *  **/
/**  *******************************************************  **/

app.put('/user', function(req, res) {
    infoIp("receive put request on /user", req);
    var isJson = req.is('application/json');
    if(isJson) {
        logger.info("Creating user with email["+ req.body.email + "]");
        db.createUser(req.body.email, req.body.password);
        res.send({ result: "success"});
    } else {
        res.send("Expecting Content-Type:application/json");
    }
});

//app.get('/user', function(req, res) {
//    logger.info("receive get request on /user");
//    User.find({}, function(err, users) {
//        if(err) {
//            throw new Error(err);
//        } else {
//            res.writeHead(200, {'Content-Type': 'application/json'});
//            res.send(JSON.stringify(users));
//        }
//    });
//});


app.get("/users", function(req, res){
    // TODO: restrict
    logger.info("listing users");
    db.listUsers(function(err, users){
        if(err) {
            logger.error(err);
            res.send(ErrorUtil.reduce(err));
        } else {
            logger.debug(users);
            res.send(users);
        }
    });
});
app.get("/user", function(req, res){
    // TODO: restrict
    logger.info("get user");
    // TODO: use logged in user
    authSvc.getCurrentUser(req, function(err, user) {
        if(err) {
            res.send(ErrorUtil.reduce(err));
        } else {
            res.send(user);
        }
    });
});
/**  *******************************************************  **/
/**  *                    COMMUNICATION                    *  **/
/**  *******************************************************  **/

app.post('/mail', function(req, res) {
    infoIp("receive post request on /mail", req);

    // TODO: make it spam proof

    var ip = req.connection.remoteAddress;
    var emailFrom = req.body.emailFrom;
    var message = req.body.message;

    //logger.error("Contact form emails are disabled. REACTIVATE THEM");
    sendMail(ip, emailFrom, message);

    var successMsg = "Your message has been sent. Thank you for taking time writing us. We'll respond as soon as we can.";
    res.send({result: successMsg});
});

var mail = require("./mail.js");
var sendMail = function(ip, emailFrom, message) {

    logger.info("sending message from ip ["+ip+"], email [" + emailFrom + "]");

    var body = "Message from ip ["+ip+"], email [" + emailFrom + "]";
    body += "\n"+message;

    var mailOpts = {
        subject: "[URGENT] Sybeol User request",
        body: body
    }

    mail.send("nherment@gmail.com", mailOpts.subject, mailOpts.body, function(e) {
        if(e) {
            logger.error("Error sending email to [" + user.email + "]" + e);
        } else {
            logger.info("Message email sent: " + JSON.stringify(mailOpts));
        }
    });
}

/**  *******************************************************  **/
/**  *                   AUTHENTICATION                    *  **/
/**  *******************************************************  **/


app.get('/login/:email/:password', function(req, res) {
    infoIp("login attempt for user ["+ req.param('email') + "]", req);
    authSvc.handleAuth(req, res);
    //res.send(200);
});

app.get('/loginStatus', function(req, res) {
    infoIp("login verification", req);

    authSvc.isAuthenticated(req, function(isAuth) {
        if(isAuth) {
            res.send("YES");
        } else {
            res.send("NO");
        }
    });
});

app.post('/login', function(req, res) {
    var isJson = req.is('application/json');
    if(isJson) {
        infoIp('Login attempt trough POST', req);
        authSvc.handleAuth(req, res);
    } else {
        logger.security("Login attempt made with wrong request")
        res.send("Expecting Content-Type:application/json");
    }
});

app.get('/logout', function(req, res) {
    infoIp("Logout ["+req.session.email+"]", req);
    req.session.destroy();
    res.send({ result: "success"});
});


app.post('/register', function(req, res) {
    var isJson = req.is('application/json');
    if(isJson) {
        infoIp('Registering attempt trough POST', req);
        authSvc.handleRegister(req, res);
    } else {
        warnIp("Registering attempt made with wrong request", req);
        var error = new Error("Expecting Content-Type:application/json");
        res.send(ErrorUtil.reduce(error));
    }
});

app.get('/activate/:email/:validationKey', function(req, res) {
    infoIp('Activation from ', req);
    authSvc.activate(req.param("email"), req.param("validationKey"), function(err, user){
        if(err) {
            res.send( ErrorUtil.reduce(err) );
        } else {
            res.send('{"result":"success"}');
        }
    });
});


app.get('/reset/:email', function(req, res) {
    infoIp('reset email', req);

    var email = req.param("email");

    authSvc.resetPassword(email, function(err){
        if(err) {
            logger.error(err);
            res.send( ErrorUtil.reduce(err) );
        } else {
            logger.info("reset password done for ["+email+"]");
            res.send(JsonUtil.SUCCESS);
        }
    });
});


app.post('/password', function(req, res) {
    infoIp('update password', req);

    var newPassword = req.body.password;

    var isJson = req.is('application/json');
    if(isJson) {
        authSvc.getCurrentUser(req, function(err, user) {
            if(err) {
                logger.warn(err);
                res.send(ErrorUtil.reduce(err));
            } else {
                logger.info("Changing password for logged-in user ["+user.email+"]");
                user.password = newPassword;
                user.save();
                res.send(JsonUtil.SUCCESS);
            }
        });
    } else {
        res.send("Expecting Content-Type:application/json");
    }
});

/**  *******************************************************  **/
/**  *                      MEASURE                        *  **/
/**  *******************************************************  **/


/**
 *
 {
 "apiKey": "????",
 "user": "john@doh.com",
 "deviceKey": "????",
 "value": "42"
 }
 */
app.put("/measure", function(req, res) {
    infoIp("receive put request on /measure", req);
    var isJson = req.is('application/json');
    if(isJson) {
        // TODO: validate data
        // TODO: use logged in user
        db.getUser(req.body.email, function(err, user) {
            if(err) {
                logger.warn(err);
                res.send(ErrorUtil.reduce(err));
            } else if(user == null) {
                var error = new Error("Could not find user with email: "+req.body.email);
                logger.warn(error);
                res.send(ErrorUtil.reduce(error));
            } else {
                measureManager.add(user, req.body, function(err) {
                    if(err) {
                        logger.warn(err);
                        res.send(ErrorUtil.reduce(err));
                    } else {
                        res.send({ result: "success"});
                    }
                });
            }
        });
    } else {
        res.send("Expecting Content-Type:application/json");
    }
});

app.get('/measure/:precision/:device', function(req, res) {
    infoIp("receive get request on /measure/:precision/:device", req);

    var device = req.params.device;
    var precision = req.params.precision;

    // TODO: use logged in user
    authSvc.getCurrentUser(req, function(err, user) {
        if(err) {
            logger.warn(err);
            res.send(ErrorUtil.reduce(err));
        } else {
            measureManager.list(user, device, precision, function(err, measures) {
                if(err) {
                    res.send(ErrorUtil.reduce(err));
                } else {
                    res.send(measures);
                }
            });
        }
    });
});

app.get('/reduce/:userEmail/:device', function(req, res) {
    infoIp("receive get request on /measure/:device", req);

    var device = req.params.device;
    var userEmail = req.params.userEmail;

    // TODO: use logged in user
    measureManager.reduce(userEmail, device, function(err, stats) {
        if(err) {
            logger.error(err);
            res.send(ErrorUtil.reduce(err));
        } else {
            res.send(stats);
        }
    });
});

app.get('/measureHour/:userEmail/:device', function(req, res) {
    infoIp("receive get request on /measureHour/:userEmail/:device", req);

    var device = req.params.device;
    var userEmail = req.params.userEmail;

    measureManager.list({email: userEmail}, device, "hour", function(err, measures) {
        if(err) {
            throw new Error(err);
        } else {
            res.send(measures);
        }
    });
});


/**  *******************************************************  **/
/**  *                 DEVICES / SENSORS                   *  **/
/**  *******************************************************  **/



// MEASURE TYPES
app.get('/sensor/:name', function(req, res) {
    var sensorName = req.params["name"];

    infoIp("receive get request on /sensor", req);
    // TODO: use logged in user
    authSvc.getCurrentUser(req, function(err, user) {
        if(err) {
            logger.warn(err);
            res.send(ErrorUtil.reduce(err));
        } else {
            if(!user.sensors) {
                logger.info("user ["+user.email+"] has no sensors");
                res.send(new Object());
            } else {
                for(var i=0 ; i < user.sensors.length ; i++) {
                    var sensor = user.sensors[i];
                    if(sensor.name == sensorName) {
                        res.send(sensor);
                        return;
                    }
                }

                var err = new Error("Could not find sensor with name ["+sensorName+"]")
                res.send(ErrorUtil.reduce(err));
            }
        }
    });
});

app.get('/sensor', function(req, res) {
    infoIp("receive get request on /sensor", req);
    // TODO: use logged in user
    authSvc.getCurrentUser(req, function(err, user) {
        if(err) {
            logger.warn(err);
            res.send(ErrorUtil.reduce(err));
        } else {
            if(!user.sensors) {
                var err = new Error("user ["+user.email+"] has no sensors");
                res.send(ErrorUtil.reduce(err));
            } else {
                res.send(user.sensors);
            }
        }
    });
});

app.put('/sensor', function(req, res) {

    var isJson = req.is('application/json');
    if(isJson) {
        var newSensor = req.body;
        infoIp("receive put request on /sensor", req);
        // TODO: use logged in user
        authSvc.getCurrentUser(req, function(err, user) {
            if(err) {
                logger.warn(err);
                res.send(ErrorUtil.reduce(err));
            } else {
                logger.debug("user logged-in, going on");
                if(!user.sensors) {
                    user.sensors = new Array();
                }
                var maxDevices = user.maxSensors;
                if(user.sensors.length >= maxDevices ) {
                    var err = new Error("You've reached the maximum number of "+maxDevices+" devices");
                    logger.warn(err);
                    res.send(ErrorUtil.reduce(err));
                } else if(newSensor.name && newSensor.units) {
                    logger.debug("checking if sensor does not already exists");
                    // verify if sensor does not already exist
                    for(var i=0 ; i < user.sensors.length ; i++) {
                        var sensor = user.sensors[i];
                        if(sensor.name == newSensor.name) {
                            var err = new Error("Sensor ["+sensor.name+"] already exists");
                            logger.error(err);
                            res.send(ErrorUtil.reduce(err));
                            return;
                        }
                    }

                    logger.info("Creating sensor ["+newSensor.name+"] for user ["+user.email+"]");
                    newSensor.uid = uuid();
                    user.sensors.push(newSensor);
                    user.save();
                    res.send(newSensor);
                } else {
                    var err = new Error("New device expected to have a name and units defined");
                    logger.error(err);
                    res.send(ErrorUtil.reduce(err));
                }
            }
        });
    } else {
        var err = new Error("Expecting Content-Type:application/json");
        logger.warn(err);
        res.send(ErrorUtil.reduce(err));
    }
});

app.delete('/sensor/:name', function(req, res) {
    var sensorName = req.params["name"];

    infoIp("receive delete request on /sensor/"+sensorName, req);
    // TODO: use logged in user
    authSvc.getCurrentUser(req, function(err, user) {
        if(err) {
            logger.error(err);
            res.send(ErrorUtil.reduce(err));
        } else {
            if(!user.sensors) {
                logger.info("user ["+user.email+"] has no sensors");
                res.send(new Object());
            } else {
                var newSensorList = new Array();
                for(var i=0 ; i < user.sensors.length ; i++) {
                    var sensor = user.sensors[i];
                    if(sensor.name != sensorName) {
                        newSensorList.push(sensor);
                    }
                }
                user.sensors = newSensorList;
                try {
                    user.save();
                    res.send(JsonUtil.SUCCESS);
                } catch(e) {
                    logger.error(e);
                    var err = new Error("Error deleting this sensor");
                    res.send(ErrorUtil.reduce(err));
                }
            }
        }
    });
});

var port = process.env.SYBEOL_PORT || process.env.PORT || 4100;

app.listen(port, function() {
    logger.info("listening on port " + port);
});
