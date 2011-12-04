
if(!process.env.SYBEOL_EMAIL_REG_USER) {
    throw new Error("Env variable SYBEOL_EMAIL_REG_USER is needed");
}
if(!process.env.SYBEOL_EMAIL_REG_PWD) {
    throw new Error("Env variable SYBEOL_EMAIL_REG_PWD is needed");
}

var mail = require('mail').Mail({
    host: 'smtp.gmail.com',
    username: process.env.SYBEOL_EMAIL_REG_USER,
    password: process.env.SYBEOL_EMAIL_REG_PWD
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
