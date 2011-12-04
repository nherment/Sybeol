var http = require('http');


var nextRandom = function() {
    return Math.floor(Math.random()*2);
}

var minutes = 0;
var hour = 0;

var nextTime = null;

var nextValue = function() {
    minutes ++;
    if(minutes >= 60) {
        minutes = 0;
        hour ++;
    }

    var theta = minutes/60 * 2 * Math.PI;

    var value = hour + (Math.cos(theta)+/*shift above 0*/1)*10 + nextRandom();
    return value;
}

var loop = function() {

    // bootstrap
    if(!nextTime) {
        var nowMinute = new Date();
        nowMinute.setSeconds(0);
        nowMinute.setMilliseconds(0);
        nextTime = nowMinute.getTime();
    }

    var frequency = 60*1000; //milliseconds
    //var now = new Date().getTime();
    //if(now >= nextTime) {
        nextTime += frequency;
        console.log(new Date(nextTime));
        putNew(nextTime);
    //}

    setTimeout(loop, 1000);

}

var HOST = "localhost";
//var HOST = "178.79.186.224";
var PORT = 4100;

var putNew = function(time) {

    var measure = {
        apiKey: "c684e72c-7f44-4075-a452-5416bd2e74aa",
        email: "nherment@gmail.com",
        uid: "e7228c8c-0b5a-4df0-a634-0d7741ee46ac",
        time: time,
        value: nextValue()
    }

    var data = JSON.stringify(measure);
    console.log(data);

    var client = http.createClient(PORT, HOST);

    var headers = {
        'Host': 'localhost',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    };

    var request = client.request('PUT', '/measure', headers);

    // listening to the response is optional, I suppose
    request.on('response', function(response) {
        console.log(response.statusCode);
        response.on('data', function(chunk) {
            console.log(chunk.toString());
            //console.log(chunk);
        });
        response.on('end', function() {
            console.log("");
        });
    });


    request.write(data);

    request.end();
}


loop();
