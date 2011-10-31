var uuid = require("node-uuid");
var logger = require("./logger.js").getLogger("session");


function Session () {
    this.getKey = function () {
        return key;
    }
    var key = uuid();
    var that = this;
}

var sessionStore = new Object();

var createCookie = function(req, res) {
    var session = new Session();
    logger.debug("created new session: "+session.getKey());

    sessionStore[session.getKey()] = session;
    req.mySession = session;

    res.writeHead(200, [
        ["Set-Cookie", "sybeol.com="+session.getKey()]
    ]);
}

var onRequest = function(req, res, next) {
    var cookies = {};
    req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');

        var cookieKey = parts[ 0 ].trim();
        if(cookieKey == "sybeol.com") {
            logger.debug("Found cookie Sybeol.com");
            var cookieValue = ( parts[ 1 ] || '' ).trim();
            if(cookieValue && sessionStore[cookieKey]) {
                logger.debug("Cookie exists in the sessionStore !");
                request.mySession = sessionStore[cookieKey];
                // check cookie value
            } else {
                // should not happen. log IP
                createCookie(req, res);
            }
        } else {
            logger.debug("No cookie Sybeol.com");
            createCookie(req, res);
        }
        next();
    });

}

exports.getSession = function() {
    return onRequest;
}
