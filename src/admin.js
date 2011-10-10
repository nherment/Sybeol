
var uuid = require('node-uuid');
var authSvc = require('./authentication.js');
var db = require('./db.js');
var logger = require('./logger.js').getLogger("sybeol");

var User = db.User;
var Measure = db.Measure;
var createUser = db.createUser;
var createMeasure = db.createMeasure;


