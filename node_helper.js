var NodeHelper = require("node_helper");

let avahi = require('multicast-dns');

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        console.log("Starting module: " + this.name);
        // avahi.on('response', function(response) {
        //     console.log('got a response packet:', response)
        // });
        //
        // avahi.on('query', function(query) {
        //     console.log('got a query packet:', query)
        // });
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        if (notification === "REQUEST_SERVICES") {
            sendNotification("SERVICES", {});
        }
    },

});