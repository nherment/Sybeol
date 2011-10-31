
var express = require('express');
var app = express.createServer();

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "keyboard cat" }));
    app.use(app.router);
});

app.get('/login', function(req, res){
    // Perhaps we posted several items with a form
    // (use the bodyParser() middleware for this)
    req.session.loggedIn = true;
    var msg = "You are logged In. SessionId:"+req.session.id;
    console.log(msg);
    res.end(msg);
});

app.get('/isLoggedIn', function(req, res){
    var msg = "isLoggedIn: "+req.session.loggedIn+" SessionId:"+req.session.id;
    console.log(msg);
    res.end(msg);
});

app.get('/logout', function(req, res){
    req.session.destroy();
    var msg = "Logged out";
    console.log(msg);
    res.end(msg);
});

app.listen(3000);
