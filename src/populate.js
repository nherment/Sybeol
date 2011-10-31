var http = require('http');


var nextRandom = function() {
    return Math.floor(Math.random()*5);
}

//var HOST = "localhost";
var HOST = "178.79.186.224";
var PORT = 4100;

var putNew = function() {

    var measure = {
        apiKey: "e9830ee2-3fd5-43db-a66a-df105bae15d7",
        email: "gregory.zussa@gmail.com",
        uid: "376b2111-7411-4d0f-99e6-4fdb16ac596c",
        value: nextRandom()
    }

    var data = JSON.stringify(measure);

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

    console.log(data);

    request.write(data);

    request.end();
    setTimeout(putNew, 2000);
}


putNew();
