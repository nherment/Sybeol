var mongoose = require('mongoose');
var crypto = require('crypto');
var uuid = require('node-uuid');

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
  'key' : { type: String, index: { unique: true }}
});

UserSchema.virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.key = uuid();
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

exports.createMeasure = function(user, type, time, value) {
  var msr = new Measure({
    'user': user,
    'type': type,
    'time': time,
    'value': value
  });
  msr.save();
}

exports.createUser = function(email, password) {
  var usr = new User({
    'email': email,
    'password': password
  });
  usr.save();
}

exports.User = User;
exports.Measure = Measure;