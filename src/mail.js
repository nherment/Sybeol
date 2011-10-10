
var mail = require('mail').Mail({
    host: 'smtp.gmail.com',
    username: 'registration@sybeol.com',
    password: '6031769a'
});


var send = function(mailTo, subject, body, cb) {
    mail.message({
        from: 'registration@sybeol.com',
        to: [mailTo],
        subject: subject
    })
    .body(body)
    .send(cb);
}

exports.send = send;
