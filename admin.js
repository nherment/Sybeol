
var uuid = require('node-uuid');
var authSvc = require('./authentication.js');
var db = require('./db.js');
var logger = require('./logger.js').getLogger("sybeol-admin");

var User = db.User;
var Measure = db.Measure;
var createUser = db.createUser;
var createMeasure = db.createMeasure;


var mongoose = require('mongoose');
var uuid = require('node-uuid');

/**  *******************************************************  **/
/**  *                      DATABASE                       *  **/
/**  *******************************************************  **/

mongoose.connect('mongodb://localhost/sybeol-admin');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


/**  *******************************************************  **/
/**  *                    COMMUNICATION                    *  **/
/**  *******************************************************  **/

var Message = new Message({
    'uid'       : {type: String, index: true},
    'from'      : {type: String, index: true},
    'message'   : {type: String},
    'date'      : {type: Date, "default": Date.now }
});

