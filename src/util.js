var Error = {

    reduce: function(err) {
        var reducedError = {
            error: err.message
        }
        return reducedError;
    }

}

var Json = {
    SUCCESS: { result: "success"}
}

exports.Error = Error;
exports.Json = Json;

