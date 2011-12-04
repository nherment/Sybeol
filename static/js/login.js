
var isSignedIn = function(callback) {
    $.get('/loginStatus', function(data) {
        if(data == 'YES') {

            callback(true);
        } else {
            callback(false);
        }
    },
    'html');
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

    postJson("/login",
            JSON.stringify(userLoginData),
            function(data) {
                if(data) {
                    var dataObj = JSON.parse(data);
                    if(dataObj.result == "success") {
                        window.location = "/data";
                    } else {
                        if(dataObj.cause) {
                            callback(dataObj.cause);
                        } else {
                            callback(dataObj.result);
                        }
                    }
                } else {
                    callback(data);
                }
            }
            );
}

var activate = function(email, key, callback) {
    var url = "/activate/" + email + "/" + key;

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

var logout = function(callback) {
    var url = "/logout";

    $.get(url,
        function(data) {
            callback();
        }
    );
}

var register = function(email, password, callback) {
    var userLoginData = {
        "email": email,
        "password": password
    }

    postJson("/register",
        JSON.stringify(userLoginData),
        function(data) {
            callback(data);
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
