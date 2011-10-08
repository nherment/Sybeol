var mongoose = require('mongoose');
var crypto = require('crypto');
var uuid = require('node-uuid');

var logger = require("./logger.js").getLogger("db");

//------------ MONGO HQ
//mongoose.connect("mongodb://sybeol:sybeol@hatch.local.mongohq.com:10055/sybeol")


//------------ LOCALHOST
mongoose.connect('mongodb://localhost/dev_database');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


function validatePresenceOf(value) {
    return value && value.length;
}

UserSchema = new Schema({
    'email' : { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'hashed_password': String,
    'salt': String,
    'apiKey' : { type: String/*, index: { unique: true }*/}
});

UserSchema.virtual('password')
        .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.apiKey = uuid();
    this.hashed_password = this.encryptPassword(password);
}).get(function() { return this._password; });

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

exports.createUser = function(email, password) {
    var usr = new User({
        'email': email,
        'password': password
    });
    usr.save();
    logger.info("saved new user: " + usr);
}

exports.getUser = function(email, callback) {
    User.findOne({ 'email': email } , callback);
}

exports.deleteUser = function(email) {
//    getUser(email, function(err, user) {
//        user.
//    });
}
exports.User = User;
exports.Measure = Measure;
