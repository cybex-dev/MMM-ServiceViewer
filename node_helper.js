// Install `sudo apt install libavahi-compat-libdnssd-dev`

var self = this;
var NodeHelper = require("node_helper");

// let servicePacketFactory = require('multicast-dns-service-types');
// let avahi = require('multicast-dns')();
// let mdns = require('mdns')();
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
};

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        self = this;
        // console.log("Starting module: " + this.name);
        // avahi.on('response', function(response) {
        //     console.log('got a response packet:', response)
        // });
        //
        // avahi.on('query', function(query) {
        //     console.log('got a query packet:', query)
        // });
        //
        // avahi.query({
        //     questions:[{
        //         name: 'INTELNUC-UBUNTU.local',
        //         type: 'A'
        //     }]
        // })


        // advertise a http server on port 4321
        // const ad = mdns.createAdvertisement(mdns.tcp('http'), 4321);
        // ad.start();
        //
        // // watch all http servers
        // const browser = mdns.createBrowser(mdns.tcp('http'));
        // browser.on('serviceUp', service => {
        //     console.log("service up: ", service);
        // });
        // browser.on('serviceDown', service => {
        //     console.log("service down: ", service);
        // });
        // browser.start();
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