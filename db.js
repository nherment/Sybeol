var mongoose = require('mongoose');
var crypto = require('crypto');
var uuid = require('node-uuid');

var logger = require("./logger.js").getLogger("db");

//------------ DATABASES
var dbUrl = process.env.SYBEOL_DB_URL;//'mongodb://localhost/sybeol';

if(!dbUrl) {
    throw new Error("Environment variable missing: SYBEOL_DB_URL");
}

logger.info("Using MongoDB ["+dbUrl+"]");
mongoose.connect(dbUrl);


var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


function validatePresenceOf(value) {
    return value && value.length;
}
//------------ SENSOR

var MapReduce = new Schema({
    'name'   : {type: String},
    'lastRun'  : {type: Date}
});

var Sensor = new Schema({
    'uid'   : {type: String},
    'name'  : {type: String},
    'units' : {type: String},
    'mapreduce': [MapReduce]
});

//------------ USER

var UserSchema = new Schema({
    'email' : { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'validationKey' : {type: String},
    'active' : {type: Boolean, "default": false},
    'lastAccessed' : {type: Date},
    'hashed_password': String,
    'salt': String,
    'apiKey' : { type: String/*, index: { unique: true }*/},
    'maxSensors': { type: Number, "default": 3 },
    'sensors' : [Sensor]
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
    return msr;
}


//------------ MEASURE 1H (MapReduced)

var MeasureSchemaReduce1H = new Schema({
    user    :  { "type": String, "index": true }
    , type    :  { "type": String, "index": true }
    , time    :  { "type": Date, "index": true }
    , value   :  { "type": Number }
    , weight  :  { "type": Number }
});

var Measure1H = mongoose.model('Measure1H', MeasureSchemaReduce1H);

var createUser = function(email, password, callback) {
    var usr = new User({
        'email': email,
        'password': password
    });
    var err;

    getUser(usr.email, function(error, user) {
        if(user) {
            usr = undefined;
            err = new Error("User already exists");
            logger.warn("creating user. User already exists:" + email);
        } else { 
            try{
                usr.save();
                logger.info("saved new user: " + JSON.stringify(usr));
            } catch(error) {
                err = error;
                logger.warn("Error when creating user [" + usr + "]: " + err);
            }
        }
        if(callback) {
            callback(err, usr);
        }
    });
}

var getUser = function(email, callback) {
    User.where('email', email).findOne(callback);
}

var listUsers = function(cb) {
    User.find({}, cb);
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
exports.Sensor = Sensor;
exports.MapReduce = MapReduce;
exports.Measure1H = Measure1H;
exports.listUsers = listUsers;
exports.mongoose = mongoose;


// DEBUG:

//    var usr = new User({
//        'email': 'nherment@gmail.com',
//        'password': 'nherment'
//    });
//    usr.save();
//    logger.info('User saved');

//User.findOne({ 'email': 'nherment@gmail.com' } , function(err, user) {
//    logger.error(err);
//    logger.info(JSON.stringify(user));
//});

//getUser('nherment@gmail.com');
