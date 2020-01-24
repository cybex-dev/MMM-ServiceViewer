var self = this;
var NodeHelper = require("node_helper");

var bonjour = require('bonjour')();
var config = {
    serviceTypes:[],
};

var cachedServices = [];

const isEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);

/**
 * Update services on the network defined in the module config.
 */
const updateServices = () => {
    config.serviceTypes.forEach(type => {
        console.log("Updating Service [" + type + "]");
        updateService(type);
    });
};

function isServicesEqual(service1, service2) {
    if(!isEqual(service1.fqdn, service2.fqdn))
        return false;
    if(!isEqual(service1.port, service2.port))
        return false;
    if(!isEqual(service1.protocol, service2.protocol))
        return false;
    if(!isEqual(service1.type, service2.type))
        return false;
    return true;
}

const updateService = (serviceType) => {
    bonjour.find({ type: serviceType }, function (service) {
        // Check if we have a duplicate
        var matches = cachedServices.filter(value => isServicesEqual(value, service));
        if(matches.length > 0) {
            // replace existing service to get the latest
            cachedServices = cachedServices.filter(service1 => !isServicesEqual(service, service1));
        }
        // Add entry
        cachedServices.push(service);
        if (matches.length === 0) {
            self.sendSocketNotification("SERVICE_UPDATE", serviceType);
        }
    });
    bonjour.find({ type: serviceType, protocol: "udp" }, function (service) {
        // Check if we have a duplicate
        var matches = cachedServices.filter(value => isServicesEqual(value, service));
        if(matches.length > 0) {
            // replace existing service to get the latest
            cachedServices = cachedServices.filter(service1 => !isServicesEqual(service, service1));
        }
        // Add entry
        cachedServices.push(service);
        if (matches.length === 0) {
            self.sendSocketNotification("SERVICE_UPDATE", serviceType);
        }
    });
};

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        self = this;
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        switch (notification) {
            case "CONFIG": {
                console.log("Configuration updated");
                config = payload;
                break;
            }

            case "SERVICE_GET": {
                self.sendSocketNotification("SERVICE_LIST", cachedServices);
                break;
            }

            case "SERVICE_UPDATE": {
                // browse for all http services
                updateServices((!payload || payload === "*") ? "" : payload);
                break;
            }

            case "SERVICE_UPDATE_SPECIFIC": {
                // browse for all http services
                updateService(payload);
                break;
            }

            default: {

            }
        }
    },
});