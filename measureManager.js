var db = require("./db.js");
var logger = require('./logger.js').getLogger("measureManager");

var Measure = db.Measure;
var Measure1H = db.Measure1H;

var list = function(user, deviceUid, precision, cb) {
    logger.info("retrieving measures. user["+user.email+"], device["+deviceUid+"], precision["+precision+"]");

    if(precision === "raw") {
        Measure.find({ type: deviceUid, user: user.email}, function(err, measures) {
            cb(err, measures);
        });
    } else if(precision === "hour") {
//        Measure1H.find({ /*type: device, user: user.email */}, function(err, measures) {
//            logger.info(JSON.stringify(measures));
//            cb(err, measures);
//        });
        db.mongoose.connection.db.collection('measure1hs', function(err, collection) { //query the new map-reduced table
            collection.find( { "value.type": deviceUid, "value.user": user.email } ).toArray(function(err, rows) { //only pull in the top 10 results and sort descending by number of pings
                if(err) {
                    cb(err, undefined);
                } else {
                    var convertedData = new Array();
                    for(var i = 0 ; i < rows.length ; i++) {
                        convertedData.push(rows[i].value);
                    }
                    logger.debug("Found measures for user["+user.email+"], device["+deviceUid+"], precision["+precision+"] "+JSON.stringify(convertedData));
                    cb(undefined, convertedData);
                }
            });
        });

    } else {
        var err = new Error("Precision ["+precision+"] does not match anything known.");
        cb(err, undefined);
    }
}

var add = function(user, measure, cb) {
    validateKey(user, measure, function(err) {
        if(err) {
            cb(err, null);
        } else {
            logger.info("Creating new measure for user ["+ user.email + "]");
            if(user.sensors) {
                var sensor = undefined;
                for(var i=0 ; i < user.sensors.length ; i++) {
                    if(user.sensors[i].uid == measure.uid) {
                        sensor = user.sensors[i];
                        logger.info("Using sensor ["+sensor.name+"] for measure")
                    }
                }
                if(sensor) {
                    var measureDate = null;
                    if(measure.time) {
                        measureDate = new Date(measure.time);
                    } else {
                        var now = new Date();
                        measureDate = new Date(
                            now.getUTCFullYear(),
                            now.getUTCMonth(),
                            now.getUTCDate(),
                            now.getUTCHours(),
                            now.getUTCMinutes(),
                            now.getUTCSeconds(),
                            0
                        );
                    }

                    var msr = db.createMeasure(user.email, sensor.uid, measureDate, parseFloat(measure.value));
                    mapReduceCheck(user, sensor, msr);
                    cb(null, msr);
                } else {
                    var error = new Error("Could not find device with uid ["+measure.uid+"] for user ["+user.email+"]");
                    logger.warn(error);
                    cb(error, null);
                }
            } else {
                var error = new Error("User ["+user.email+"] has no device defined");
                logger.warn(error);
                cb(error, null);
            }
        }
    })
}


var validateKey = function(user, measure, cb) {

    if(user && measure) {
        var rightKey = (user.apiKey == measure.apiKey);
        var rightEmail = (user.email == measure.email);
        if(rightEmail) {
            if(rightKey) {
                cb();
            } else {
                cb(new Error("Wrong apiKey"));
            }
        } else {
            cb(new Error("Emails don't match. Expected ["+user.email+"] but got ["+measure.email+"]"));
        }
    } else {
        logger.error("User and Measure arguments must not be null");
        cb(new Error("Server error. Please contact our support"));
    }
}

// TODO: does not work. lastRun does not seem to be persisted
var updateDeviceWithLastMapReduce = function(user, device, mrName, timeRunMs) {
    if(!device.mapreduce) {
        device.mapreduce = new Array();
    }
    var mr;
    for(var i=0 ; i < device.mapreduce.length ; i++) {
        if(device.mapreduce[i].name === mrName) {
            mr = device.mapreduce[i];
        }
    }

    if(!mr) {
        mr = {
            'name': mrName,
            'lastRun': timeRunMs
        };
    } else {
        mr.lastRun = timeRunMs;
    }
    user.save();

}

var mapReduceCheck = function(user, device, measure) {
    var lastMR = device.mapreduce;
    var lastMRTimeMillisec = 0;
    // TODO FIXME: to this calculus for each mapReduce (hour, day, etc.)
    if(lastMR && lastMR.lastRun) {
        lastMRTimeMillisec = lastMR.lastRun;
    }

    if(lastMRTimeMillisec < measure.time.getTime()) {
        logger.info("Map reduce process starting for user ["+measure.user+"], device ["+device.name+"] ["+device.uid+"] ");
        var options = {
            userEmail: measure.user,
            device: device,
            beginTimeMillisec: lastMRTimeMillisec,
            endTimeMillisec: new Date().getTime()
        }

        var millisecsSinceLastMR = measure.time.getTime() - lastMRTimeMillisec;

        /** ********************************************* **/
        /**                     HOUR                      **/
        /** ********************************************* **/
        var hour = 60*60*1000; //millisecs

        if(millisecsSinceLastMR >= hour) {
            logger.info("Doing hour map reduce. Last one was ["+ millisecsSinceLastMR / 1000 / 60+"] minutes ago");
            options.dateMask = {
                minutes: true,
                seconds: true
            }
            options.collection = "measure1hs";

            doMapReduce(options, function(err, stats) {
                if(err) {
                    logger.error(err);
                } else {
                    logger.info("Map reduce [hour] done for user ["+measure.user+"], device ["+device.name+"] ["+device.uid+"] "+JSON.stringify(stats));
                    //updateDeviceWithLastMapReduce(user, device, "hour", options.endTimeMillisec);
                }
            });
        }

//        /** ********************************************* **/
//        /**                     DAY                       **/
//        /** ********************************************* **/
//        var day = 24*60*60*1000; //millisecs
//
//        if(millisecsSinceLastMR >= day) {
//            options.dateMask = {
//                hours: true,
//                minutes: true,
//                seconds: true
//            }
//            options.collection = "measure1ds";
//
//            doMapReduce(options, function(err, stats) {
//                if(err) {
//                    logger.error(err);
//                } else {
//                    logger.info("Map reduce done for device ["+device.name+"] ["+device.uid+"] "+JSON.stringify(stats));
//                }
//            });
//        }
//
//        /** ********************************************* **/
//        /**                    WEEK                       **/
//        /** ********************************************* **/
//        var week = 7*24*60*60*1000; //millisecs
//
//        if(millisecsSinceLastMR >= week) {
//            options.dateMask = {
//                days: true,
//                hours: true,
//                minutes: true,
//                seconds: true
//            }
//            options.collection = "measure1ws";
//
//            doMapReduce(options, function(err, stats) {
//                if(err) {
//                    logger.error(err);
//                } else {
//                    logger.info("Map reduce done for device ["+device.name+"] ["+device.uid+"] "+JSON.stringify(stats));
//                }
//            });
//        }
    }
}

/**
 * @param options userEmail, device, beginTimeMillisec, endTimeMillisec
 * @param callback
 */
var doMapReduce = function(options, callback) {

    var map = function () {

        var dateKey = new Date(this.time.getTime());
//        dateKey.setMonth(0);
//        dateKey.setDate(0);
//        dateKey.setHours(0);
        dateKey.setMinutes(30); // set data point at the middle of the hour
        dateKey.setSeconds(0);
        dateKey.setMilliseconds(0);

        var mapped = {
            user: this.user,
            type: this.type,
            time: dateKey,
            value: this.value,
            weight: 1
        }

        var key = dateKey;

        emit(key, mapped);
    };

    var reduce = function (key, values) {
        var reduced = {
            user: values[0].user,
            type: values[0].type,
            time: values[0].time,
            value: 0,
            weight: 0
        }

        var totalWeight = 0;
        var sum = 0;

        values.forEach(function(value) {

            sum += (value.value * value.weight);
            totalWeight += value.weight;

        });

        reduced.value = sum/totalWeight;
        reduced.weight = totalWeight;
        return reduced;
    };

    var finalize = function(key, value) {
        return value;
    }

    var optionsMR = {
        query: {
            user : options.userEmail,
            type : options.device.uid
        },
        out: {
            merge: "measure1hs" // lowercase and 's' appended from the mongoose collection name
        },
        include_statistics: true,
        verbose: true
    };
    logger.info("Launching MapReduce job "+JSON.stringify(optionsMR));
    db.Measure.collection.mapReduce(map, reduce, optionsMR, function(err, collection, stats) {
        logger.info("MapReduce done");
        callback(err, stats);
    });
}



exports.add = add;
exports.list = list;
