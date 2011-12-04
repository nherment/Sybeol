var connect = require('connect');
var urlpaser = require('url');

var authCheck = function (req, res, next) {
    url = req.urlp = urlpaser.parse(req.url, true);
    var logs = "";

    var log = function(msg) {
        logs += msg + "\n";
        console.log(msg);
    }

    var cookies = {};
    log("---- Cookies ----");
    req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
        log(JSON.stringify(cookie));
    });
    log("");


    // Logout
    if ( url.pathname == "/logout" ) {
        log("Destroying session");
        req.session.destroy();
    }

    // Is User already validated?
    if (req.session && req.session.auth == true) {
        next(); // stop here and pass to the next onion ring of connect
        log("you are already authenticated");
        res.end(logs);
        return;
    }

    // Auth - Replace this simple if with you Database or File or Whatever...
    // If Database, you need a Async callback...
    if ( url.pathname == "/login" &&
        url.query.name == "max" &&
        url.query.pwd == "herewego"  ) {
        log("hit /login");
        req.session.auth = true;
        req.session.save();
        log("/login: req.session.id = " + req.session.id);
        log("/login: req.session.auth = " + req.session.auth);
        log("You are now logged in");
        res.end(logs);
        return;
    }

    if(url.pathname == "/amILoggedIn") {
        console.log("hit /amILoggedIn");
        res.writeHead(200);
        log("/amILoggedIn: req.session.id = " + req.session.id);
        log("/amILoggedIn: req.session.auth = " + req.session.auth);
        res.end(logs);
        return;
    }

    // ####
    // User is not authorized. Stop talking to him.
    res.writeHead(200);
    log('For login use: /login?name=max&pwd=herewego');
    log("To verify if you are logged in, use: /amILoggedIn");
    res.end(logs);
    return;
}

var server = connect.createServer(
    connect.cookieParser(),
    connect.session({ secret: 'foobar' }),
    connect.bodyParser(),
    authCheck
);


var port = 3000;
server.listen(port);
console.log("server started on port: "+port);
