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

        // Render search box
        G.page.searchBox = new G.controls.SearchBox().set({
            "text": G.getHashParam("q") || G.page.serverData.q || "",
            "buttonText": "Search"
        }).style({
            "width": 500
        }).bind({
            "search": function(q) {
                window.location = "/search?#" + G.util.makeParamString({"q": q}, true);
            }
        });
        $("#search_box").empty().append(
            G.page.searchBox.renderHere()
        );

        G.page.renderUserThumbnail();

        if (G.page.name) {
            G.pages[G.page.name]();
        }

        // Set up MixPanel metrics
        try {
            window.mpmetrics = new MixpanelLib(G.constants.mixpanelToken);
            if (G.user.exists()) {
                mpmetrics.identify("" + G.user.id);
            }
        } catch(err) {
            G.mixpanel = null;
        }
    },

    renderUserThumbnail: function() {
        if (G.user.exists()) {
            $("#username_karma").empty().append(
                $DIV().css({
                    "display": "inline-table",
                    "vertical-align": "middle"
                }).append(
                    G.user.makeThumbnail(true).click(function() {
                        G.logEvent("user thumbnail click", {
                            "container": "site_navbar"
                        });
                    })
                )
            );
        }
    },

    showLoginScreen: function(message, focusLogin) {
        if (typeof message == "boolean") {
            focusLogin = message;
            message = undefined;
        }

        var loginScreen = new G.controls.LoginScreen().set({
            "message": message
        }).bind({
            "login": function() {
                G.page.onUserChange("login");
            },

            "register": function() {
                G.page.onUserChange("register");
            }
        });

        var jqDialog = G.util.popup(loginScreen.renderHere(), {
            "title": "Register / Sign In",
            "width": loginScreen.style.width
        });

        setTimeout(function() {
            if (focusLogin) {
                loginScreen.focusLogin();
            } else {
                loginScreen.focusRegister();
            }
        }, 1);
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
    },

    footerLinkClick: function(linkName) {
        G.logEvent("footer link click", {
            "link_name": linkName
        });
    }
});

