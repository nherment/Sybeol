function NavHandler() {
    var self = this;

    var map = new Object();
    var listeners = new Object();

    var trigger = function(key, value) {

        if(listeners[key]) {
            for(var i = 0 ; i < listeners[key].length ; i++) {
                var handler = listeners[key][i];
                handler(key, value);
            }
        }
    }

    var pullFromURL = function() {
        var hash = parent.location.hash;
        var pairs = hash.split(",");
        for(var keyValue in pairs) {
            var keyValueArr = keyValue.split(":");
            if(keyValueArr[0] && keyValueArr[1]) {
                self.put(keyValueArr[0], keyValueArr[1]);
            }
        }
    }

    var pushToURL = function() {
        var hash = "";
        var init = true;
        for(var key in map) {
            if(key && map[key]) {
                if(!init) {
                    hash+=",";
                }
                hash += key+":"+map[key];
                init = false;
            }
        }

        parent.location.hash = hash;
    }

    this.addListener = function(key, handler) {
        if(!listeners[key]) {
            listeners[key] = new Array();
        }
        listeners[key].push(handler);
    }

    this.removeListener = function(key, handler) {
        if(!listeners[key]) {
            listeners[key] = new Array();
        }
        for(var i = 0 ; i < listeners[key].length ; i++) {
            if(listeners[key][i] === handler) {
                listeners[key].splice(i, 1); // remove it
            };
        }
    }

    this.put = function(key, value) {
        map[key] = value;
        pushToURL();
        trigger(key, value);
    }

    this.get = function(key) {
        return map[key];
    }

    $(document).ready(function() {
        pullFromURL();
    });
}
