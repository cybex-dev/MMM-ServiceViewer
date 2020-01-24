const isHttp = (service) => {
    return (service.txt) ? service.txt.uri.startsWith("/") : false;
};

const usesMulticast = (service) => {
    return (service.txt) ? service.txt.uses_multicast === "1" : false;
};

const getMulticastAddress = (service) => {
    return (service.txt) ? service.txt.multicast_address : "";
};

const validIPv4 = (address) => {
    return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(address));
};

// this needs to be reduced
const mapToHost = (serviceList) => {
    let output = new Map;
    if(serviceList.length === 0)
        return output;
    serviceList.forEach((service) => {
        if(!output.has(service.fqdn)) {
            output.set(service.fqdn, []);
        }
        output.get(service.type).push(service);
    });
    return output;
};

const mapToService = (serviceList) => {
    let output = new Map;
    if(serviceList.length === 0)
        return output;
    serviceList.forEach((service) => {
        if(!output.has(service.type)) {
            output.set(service.type, []);
        }
        output.get(service.type).push(service);
    });
    return output;
};

const mapToPort = (serviceList) => {
    let output = new Map;
    if(serviceList.length === 0)
        return output;
    serviceList.forEach((service) => {
        if(!output.has(service.port)) {
            output.set(service.port, []);
        }
        output.get(service.port).push(service);
    });

    return output;
};

const stringReplacePlaceHolders = (string, replacements) => {
    return string.replace(/%\w+%/g, substring => replacements[substring] || substring);
};

Module.register("MMM-ServiceViewer",{

    // Default module config.
    defaults: {

    },

    start: function() {
        this.serviceList = [];
        var self = this;
        self.sendSocketNotification("CONFIG", self.config);
        setInterval(function() {
            self.sendSocketNotification("SERVICE_GET");
        }, 5000);
        setInterval(function() {
            self.sendSocketNotification("SERVICE_UPDATE");
        }, 10000);
        self.sendSocketNotification("SERVICE_UPDATE");
    },

    getStyles: function() {
        return ["MMM-ServiceViewer.css"];
    },

    // Override dom generator.
    getDom: function() {
        var self = this;
        var wrapper = document.createElement("div");

        if (self.serviceList.length === 0) {
            wrapper.innerHTML = self.loaded ? "No services found" : "Initializing, please wait...";
            return wrapper;
        }

        var headerPlaceHolderText = "";

        // custom grouping not fully implemented yet
        switch (self.config.groupBy) {
            case "service" : {
                groupedMap = mapToService(self.serviceList);
                headerPlaceHolderText = "Service %TITLE% (%PROTO%/%PORT%)";
                break;
            }

            case "host" : {
                groupedMap = mapToHost(self.serviceList);
                headerPlaceHolderText = "Host %TITLE%";
                break;
            }

            case "port" : {
                headerPlaceHolderText = "Port %TITLE%";
                groupedMap = mapToPort(self.serviceList);
                break;
            }

            default: {
                groupedMap = mapToService(self.serviceList);
                headerPlaceHolderText = "Service %TITLE% (%PROTO%/%PORT%)";
                break;
            }
        }

        // for each grouped service e.g. ssh, http, etcZ
        groupedMap.forEach((value, key) => {

            // Header
            var h4Header = document.createElement("h6");
            h4Header.style.display = "initial";
            var first = value[0];
            var port = first.port === 0 ? "0" : first.port.toString();
            h4Header.innerText = stringReplacePlaceHolders(headerPlaceHolderText, {"%TITLE%" : key, "%PROTO%": first.protocol, "%PORT%": port});
            wrapper.append(h4Header);

            var table = document.createElement("table");

            // For each host that has this particular service
            value.forEach(entry => {
                if (entry.length === 0)
                    return;

                // Create row
                var row = document.createElement("tr");

                // create host cell
                var host = document.createElement("td");
                host.innerText = entry.host;
                row.append(host);

                row.addEventListener('click', () => {
                    const service = entry;

                    var proto = service.protocol;
                    if(isHttp(entry)) {
                        proto = "http"
                    }

                    var ipv4s = service.addresses.filter(validIPv4);
                    if (ipv4s.length === 0) {
                        console.log("No valid IPv4 address can be found, this may be a problem");
                    }

                    var ip = ipv4s.length === 0 ? service.addresses[0] : ipv4s[0];
                    if(usesMulticast(entry)) {
                        ip = getMulticastAddress(entry);
                    }

                    self.sendNotification("XDG-OPEN", {
                        protocol: proto,
                        location: ip,
                        port: service.port,
                        type: service.type,
                        host: service.host
                    })
                });

                // Add to table
                table.append(row);
            });
            wrapper.append(table);
        });

        return wrapper;
    },

    socketNotificationReceived: function(notification, payload) {
        console.log(this.name + " received a module notification: " + notification);

        switch (notification) {
            case "SERVICE_UPDATE": {
                console.log("Service [" + payload + " updated");
                break;
            }

            case "SERVICE_LIST" : {
                this.serviceList = payload;
                console.log( this.serviceList.length + " Services Available");
                // this.serviceList.forEach(service => {
                //     console.log("SERVICE : " +  service.type + ' - [' + service.referer.family + '] ' + service.referer.address + ' : ' + service.port + ' [' + service.fqdn + ']');
                // });
                break;
            }
        }

        this.updateDom();
    },
});