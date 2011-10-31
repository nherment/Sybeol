var http = require('http');


var nextRandom = function() {
    return Math.floor(Math.random()*5);
}

var putNew = function() {

    var measure = {
        apiKey: "c684e72c-7f44-4075-a452-5416bd2e74aa",
        email: "nherment@gmail.com",
        uid: "a844782b-8ec2-4958-b22c-668cf15be227",
        value: nextRandom()
    }

    var data = JSON.stringify(measure);

    var client = http.createClient(4100, 'localhost');

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

    console.log(data);

    request.write(data);

    request.end();
    setTimeout(putNew, 2000);
}


putNew();
