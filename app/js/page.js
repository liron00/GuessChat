/*
 * Page framework for G
 *
 * Dependencies: jQuery, util.js, assorted data objects and controls
*/

// Page load functions
G.pages = {};

// State for the current page
G.page = {};

G.definePage = function(name, loadFunc) {
    G.pages[name] = loadFunc;
};

// All pages have these constants and functions.
// Individual pages can override the base page functions.
$.extend(G.page, {
    width: 980,

    onLoad: function() {
        $("#everything").show();

        if (G.page.name) {
            G.pages[G.page.name]();
        }
    },

    logout: function() {
        if (!G.user.exists()) {
            G.warn("User is already logged out.");
            return;
        }

        G.post(
            "logout",
            {},
            function(data) {
                if (data.rc) {
                    G.util.alertError(data);
                }

                G.user = null;
                G.page.onUserChange("logout");
            }
        );
    },

    onUserChange: function(action) {
        if (action == "register") {
            window.location = "/user";
        } else {
            window.location.reload();
        }
    }
});

