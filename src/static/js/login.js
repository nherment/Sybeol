
var isSignedIn = function(callback) {
    $.get('/app/loginStatus', function(data) {
        if(data == 'YES') {
            callback(true);
        } else {
            callback(false);
        }
    });
};


var postJson = function(url, data, callback) {
    $.ajax({
        url:url,
        type:"POST",
        data:data,
        contentType:"application/json; charset=utf-8",
        success: callback
    });
};

var signIn = function(email, password, callback) {
    var userLoginData = {
        "email": email,
        "password": password
    }

    postJson("/app/login",
            JSON.stringify(userLoginData),
            function(data) {
                if(data) {
                    var dataObj = JSON.parse(data);
                    if(dataObj.result == "success") {
                        window.location.href = "/data";
                    } else {
                        callback(dataObj.result);
                    }
                }
            }
            );
}

var activate = function(email, key, callback) {
    var url = "/app/activate/" + email + "/" + key;

    $.get(url,
            function(data) {
                if(data) {
                    var dataObj = JSON.parse(data);
                    if(dataObj.result == "success") {
                        callback(dataObj.result);
                    } else {
                        callback(dataObj.result);
                    }
                }
            }
            );
}

var register = function(email, password, callback) {
    var userLoginData = {
        "email": email,
        "password": password
    }

    postJson("/app/register",
            JSON.stringify(userLoginData),
            function(data) {
                if(data) {
                    var dataObj = JSON.parse(data);
                    if(dataObj.result == "success") {
                        callback(dataObj.result);
                    } else {
                        callback(dataObj.result);
                    }
                }
            }
            );
}


var autoRedirectToLogin = function()  {
    isSignedIn(function(loggedIn) {
        if(loggedIn) {
        } else {
            window.location.href = "/login";
        }
    });
}
