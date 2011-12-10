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

    var oneMinute = 60*1000; // in milliseconds
    var now = new Date().getTime();
    if(now >= nextTime) {
        nextTime += oneMinute;
        console.log(new Date(nextTime));
        putNew(nextTime);
    }

    setTimeout(loop, 10);

}

//var HOST = "localhost";
var HOST = "178.79.186.224";
var PORT = 80;

var putNew = function(time) {

    var measure = {
        apiKey: "c624343e-2120-49d4-825d-2752775dd119",
        email: "nherment@gmail.com",
        uid: "ff7c52f6-c138-4980-bb2a-c42beef5b07b",
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
