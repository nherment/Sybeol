var mongoose = require('mongoose');
var crypto = require('crypto');
var uuid = require('node-uuid');

var logger = require("./logger.js").getLogger("db");

//------------ DATABASES
//mongoose.connect("mongodb://sybeol:sybeol@staff.local.mongohq.com:10055/sybeol");
mongoose.connect("mongodb://sybeol:sybeol@staff.mongohq.com:10028/sybeol-dev");
//mongoose.connect('mongodb://localhost/sybeol');



var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


function validatePresenceOf(value) {
    return value && value.length;
}

//------------ USER

var UserSchema = new Schema({
    'email' : { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'validationKey' : {type: String},
    'active' : {type: Boolean, "default": false},
    'lastAccessed' : {type: Date},
    'hashed_password': String,
    'salt': String,
    'apiKey' : { type: String/*, index: { unique: true }*/}
});

UserSchema.virtual('password')
        .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.validationKey = uuid();
    this.apiKey = uuid();
    this.hashed_password = this.encryptPassword(password);
}).get(function() { return this._password; });

UserSchema.pre('save', function(next) {
    if (validatePresenceOf(this.password) || validatePresenceOf(this.hashed_password)) {
        next();
    } else {
        next(new Error('Invalid password in '+JSON.stringify(this)));
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


//------------ MEASURE

var MeasureSchema = new Schema({
    user    :  { "type": String, "index": true }
    , type    :  { "type": String, "index": true }
    , time    :  { "type": Date, "default": Date.now, "index": true }
    , value   :  { "type": Number }
});

var Measure = mongoose.model('Measure', MeasureSchema);

exports.createMeasure = function(user, type, time, value) {
    var msr = new Measure({
        'user': user,
        'type': type,
        'time': time,
        'value': value
    });
    msr.save();
    logger.info("saved new measure: " + msr);
}

var createUser = function(email, password, callback) {
    var usr = new User({
        'email': email,
        'password': password
    });
    var err;
    try{
        usr.save();
        logger.info("saved new user: " + usr);
    } catch(error) {
        err = error;
        logger.warn("error when creating user [" + usr + "]: " + err);
    }
    if(callback) {
        callback(err, usr);
    }
}

var getUser = function(email, callback) {
    User.where('email', email).findOne(callback);
}

exports.deleteUser = function(email) {
//    getUser(email, function(err, user) {
//        user.
//    });
}
exports.createUser = createUser;
exports.getUser = getUser;
exports.User = User;
exports.Measure = Measure;


// DEBUG:

    //var usr = new User({
    //    'email': 'nherment@gmail.com',
    //    'password': 'nherment'
    //});
    //usr.save();
    //logger.info('User saved');

//User.findOne({ 'email': 'nherment@gmail.com' } , function(err, user) {
//    logger.error(err);
//    logger.info(JSON.stringify(user));
//});

//getUser('nherment@gmail.com');
