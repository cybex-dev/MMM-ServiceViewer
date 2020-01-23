Module.register("MMM-ServiceViewer",{
    // Default module config.
    defaults: {

    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");
        return wrapper;
    }
});