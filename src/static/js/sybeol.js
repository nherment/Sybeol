var Sybeol = {

    getUser: function(cb) {
        $.get("/user", cb);
    },

    getMeasures: function(device, cb) {
        $.get("/measure/"+device, cb);
    },


/**  *******************************************************  **/
/**  *                      DEVICES                        *  **/
/**  *******************************************************  **/

    getDevices: function(cb) {
        $.get("/sensor", cb);
    },

    deleteDevice: function(deviceName, cb) {
        $.ajax(
            {
                url: "/sensor/"+deviceName,
                type: "DELETE",
                contentType: "application/json",
                success: cb
            });
    },

    addDevice: function(device, cb) {
        $.ajax(
            {
                url: "/sensor",
                type: "PUT",
                contentType: "application/json",
                data: JSON.stringify(device),
                success: cb
            });
    },

    updateDevice: function(device, cb) {
        $.ajax(
            {
                url: "/sensor",
                type: "UPDATE",
                contentType: "application/json",
                data: JSON.stringify(device),
                success: cb
            });
    },

    resetPassword: function(email, cb) {
        $.get("/reset/"+email, cb);
    },

    setNewPassword: function(user, cb) {
        $.ajax(
            {
                url: "/password",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(user),
                success: cb
            });
    }


}
