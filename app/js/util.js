// Utility functions for the G framework
//
// Dependencies: jQuery

// G framework namespace
G = {};

G.func = function(arg1, arg2, arg3, etc, f) {
    // For when you want to return a function f with some argument values
    // saved in their own context, e.g. when defining a callback

    var args = [];
    for (var j=0; j<arguments.length - 1; j++) {
        args.push(arguments[j]);
    }

    f = arguments[arguments.length - 1];

    return function() {
        var myArgs = args.slice();

        if (arguments) {
            for(var j=0; j<arguments.length; j++) {
                myArgs.push(arguments[j]);
            }
        }

        return f.apply(this, myArgs);
    };
};

// Debugging

// Surprisingly necessary optimizations
G._canAssert = self.console && self.console.assert;
G._canWarn = self.console && self.console.warn
G._canLog = self.console && self.console.log

G.assert = function(value, msg) {
    if ((G.env != 'prod' || G.debugging) && G._canAssert) {
        if (value) {
            // Optimization
            return;
        }
        if (msg === undefined) {
            console.assert(value);
        } else {
            console.assert(value, msg);
        }
    }
};
G.warn = function(msg) {
    if ((G.env != 'prod' || G.debugging) && G._canWarn) {
        console.warn(msg);
    }
};
G.error = function(msg) {
    G.assert(false, msg);
};
G.log = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
    if ((G.env != 'prod' || G.debugging) && G._canLog) {
        console.log(
            (arg0 === undefined)? "" : arg0,
            (arg1 === undefined)? "" : arg1,
            (arg2 === undefined)? "" : arg2,
            (arg3 === undefined)? "" : arg3,
            (arg4 === undefined)? "" : arg4,
            (arg5 === undefined)? "" : arg5,
            (arg6 === undefined)? "" : arg6,
            (arg7 === undefined)? "" : arg7,
            (arg8 === undefined)? "" : arg8,
            (arg9 === undefined)? "" : arg9
        );
    }
};

// AJAX
G.get = function(method, params, callback) {
    // No auto-JSONification of G.data objects for GET requests

    params = params || {};

    var url;
    if (method.indexOf("/") >= 0) {
        url = method;
    } else {
        url = "/ajax/" + method;
    }
    url += "?" + G.util.makeParamString(params);

    return $.ajax({
        "url": url,
        "type": "GET",
        "dataType": "json",
        "success": function(data, textStatus) {
            if (G.debugging) {
                G.log(data, textStatus);
            }

            if (callback) {
                callback(data || {
                    "rc": -1,
                    "msg": "There was a problem communicating with the Quixey server."
                });
            }
        },
        "error": function(xhr, err) {
            if (G.debugging) {
                G.log(xhr, err);
            }

            if (callback) {
                callback({
                    "rc": -1,
                    "msg": "There was a problem communicating with the Quixey server.",
                    "xhr": xhr,
                    "err": err
                });
            }
        },
        "cache": false
    });
};

G.post = function(method, params, callback) {
    // Asynchronous POST featuring automatic encoding of
    // G.data objects as well as all JSON.

    params = params || {};

    var url;
    var data;
    if (method.indexOf("/") >= 0) {
        url = method;
        data = {
            "params": $.toJSON(G.util.toServer(params))
        };
    } else {
        url = "/ajax/" + method;
        data = {
            "params": $.toJSON(G.util.toServer(params))
        };
    }

    return $.ajax({
        "url": url,
        "type": "POST",
        "dataType": "json",
        "data": data,
        "success": function(data, textStatus) {
            if (callback) {
                callback(data || {
                    "rc": -1,
                    "msg": "There was a problem communicating with the Quixey server."
                });
            }
        },
        "error": function(xhr, err) {
            if (callback) {
                callback({
                    "rc": -1,
                    "msg": "There was a problem communicating with the Quixey server.",
                    "xhr": xhr,
                    "err": err
                });
            }
        }
    });
};

G.logEvent = function(name, properties) {
    var params = {
        "name": name
    };
    $.each(properties || {}, function(fieldName, value) {
        if (fieldName in params) {
            params[fieldName + '_'] = value;
        } else {
            params[fieldName] = value;
        }
    });

    G.log("EVENT:", name, properties);
    G.post(
        "log_event",
        params,
        function(data) {
            if (data.rc) {
                G.log("Error logging " + name + " event: " + data.msg);
            }
        }
    );

    // MixPanel logging is already done by the back-end log_event handler
    // mpmetrics.track(name, properties);
}

G.uistateSet = function(fieldName, value) {
    if (value === true) {
        value = 1;
    } else if (value === false) {
        value = 0;
    }

    G.post(
        "uistate_set",
        {
            "fieldname": fieldName,
            "value": value
        }
    );
};

G.getHashParams = function() {
    var hashIndex = window.location.href.indexOf('#');
    if (hashIndex == -1) {
        return {};
    }
    var paramStr = window.location.href.substring(hashIndex + 1);
    if (paramStr[0] == "?") {
        paramStr = paramStr.substring(1);
    }

    var params = {};
    $.each(paramStr.split("&"), function(i, param) {
        var eqIndex = param.indexOf("=");
        var paramName = param.substring(0, eqIndex);
        var paramValue = decodeURIComponent(param.substring(eqIndex + 1).replace(/[+]/g, " "));
        if (paramName) {
            params[paramName] = paramValue
        }
    });
    return params;
};

G._curHashParams = G.getHashParams();

G.getHashParam = function(paramName) {
    return G.getHashParams()[paramName];
};

G.getHashParamInt = function(paramName) {
    var paramValue = G.getHashParam(paramName);
    if (paramValue) {
        return G.util.parseInt(paramValue);
    } else {
        return null;
    }
};

G.getHashParamJson = function(paramName) {
    var paramValue = G.getHashParam(paramName);
    if (paramValue) {
        try {
            return $.fromJSON(paramValue);
        } catch (ex) {
            return null;
        }
    } else {
        return null;
    }
};

G._settingHashParams = false;

G.setHashParams = function(paramDict) {
    var params = G.getHashParams();
    $.each(paramDict, function(paramName, value) {
        if (value == null) {
            delete params[paramName];
        } else {
            params[paramName] = value;
        }
    });
    G._settingHashParams = true;
    window.location.hash = G.util.makeParamString(params, true);
    G._settingHashParams = false;
    G._curHashParams = params;
};

G.setHashParam = function(paramName, paramValue) {
    var params = {};
    params[paramName] = paramValue;
    G.setHashParams(params);
};

G.bindHashParam = (function() {
    var bindings = {};
    var hashChangeBound = false;

    var onHashChange = function() {
        if (G._settingHashParams) {
            return;
        }

        var newHashParams = G.getHashParams();
        var allHashParams = $.extend({}, newHashParams, G._curHashParams);
        for (var paramName in allHashParams) {
            if (newHashParams[paramName] != G._curHashParams[paramName]) {
                if (bindings[paramName]) {
                    var newValue = newHashParams[paramName];
                    if (newValue == undefined) {
                        newValue = null;
                    }

                    $.each(bindings[paramName], function(i, callback) {
                        callback(newValue);
                    });
                }
            }
        }
        G._curHashParams = newHashParams;
    };

    return function(paramName, callback) {
        if (!hashChangeBound) {
            $(window).hashchange(onHashChange);
            hashChangeBound = true;
        }

        if (bindings[paramName] == undefined) {
            bindings[paramName] = [];
        }
        bindings[paramName].push(callback);
    };
})();

G.util = {
    parseInt: function(str) {
        if (typeof(str) == "string") {
            str = str.replace(/,/, "");
        }

        var parsed = parseInt(str, 10);

        if (isNaN(parsed)) {
            return 0;
        } else {
            return parsed;
        }
    },

    parseFloat: function(str) {
        if (typeof(str) == "string") {
            str = str.replace(/,/, "");
        }

        var parsed = parseFloat(str);

        if (isNaN(parsed)) {
            return 0;
        } else {
            return parsed;
        }
    },

    getValidNumber: function(str) {
        str = $.trim(str);
        if (!str) {
            return null;
        }

        var num = Number(str);
        if (isNaN(num)) {
            return null;
        } else {
            return num;
        }
    },

    timestamp: function(d, format) {
        // Sample calls:
        // G.util.timestamp(d) -> "3/24/2010 09:21am PST (5 hours ago)"
        // G.util.timestamp(d, "ago") -> "2 months ago"
        // G.util.timestamp(d, "h:mm (ago)") -> "9:21 (2 months ago)"
        // G.util.timestamp(d, "ZZ") -> "GMT-8"
        //
        // NOTE:
        // This function should be used for all
        // Date -> String conversions (because of the
        // DateJS library bug - see below).

        if (!d || d.equals(new Date(null))) {
            return "???";
        }

        if (!format) {
            format = "M/d/yyyy h:mm:sstt ZZ (ago)";
        }

        if (d.toString("hh") == "00") {
            // Compensate for a bug in the DateJS library's toString
            // that displays 00am instead of 12am with the 12-hour time setting.
            format = format.replace(/hh/g, "12").replace(/h/g, "12");
        }

        var str = d.toString(format).replace("AM","am").replace("PM","pm");

        var agoPos = str.indexOf("ago");
        if (agoPos >= 0) {
            // Get pretty agoString like "2 months ago" using jQuery lib
            var agoStr = $SPAN().prettyDate(d).text();
            str = str.substring(0, agoPos) + agoStr + str.substring(agoPos+3);
        }

        var timezonePos = str.indexOf("ZZ");
        if (timezonePos >= 0) {
            var gmtPlus = -1 * parseInt(d.getTimezoneOffset() / 60);
            var timezone = "GMT" + ((gmtPlus>=0)?"+":"") + gmtPlus;
            if (gmtPlus == -8) {
                timezone = "PST";
            }
            str = str.substring(0, timezonePos) + timezone + str.substring(timezonePos+2);
        }

        return str;
    },

    imgPath: function(path) {
        if (typeof path == "number") {
            // Get dynamically stored image by ID
            if (path < G.constants.leastUnfetchedImage) {
                // Guaranteed on the media server
                return (window.location.protocol == 'https:'
                        ? G.constants.secureMediaBaseUrl
                        : G.constants.mediaBaseUrl) + "/image/" + path;
            } else {
                return "/image/" + path;
            }

        } else if (path.substring(0,7) == "http://" || path.substring(0,8) == "https://" || path.substring(0,1) == "/") {
            // Standard HTML path interpretation
            return path;

        } else {
            // Relative path to static image
            return "/static/images/" + path;

        }
    },

    bgImage: function(path) {
        return "url(" + G.util.imgPath(path) + ")"
    },

    $IMG: function(path) {
        return $("<img/>").attr("src", G.util.imgPath(path)).css({
            "border-width": 0
        });
    },

    qrCode: function(target) {
        return G.util.$IMG(
            window.location.protocol + "//chart.googleapis.com/chart?cht=qr&chld=L|0&chs=70x70&chl=" + target
        );
    },

    protoMatchUrl: function(url) {
        var idx = url.indexOf(':');
        if (idx == 4 || idx == 5) {
            return window.location.protocol + url.substr(idx + 1);
        } else {
            return url;
        }
    },

    updateSrc: function(img, path) {
        path = G.util.imgPath(path);
        if (path != img.attr("src")) {
            img.attr("src", path);
        }
    },

    alert: function(contents, title, callback) {
        if (typeof contents == "string" || typeof contents == "number") {
            contents = $DIV().css({
                "margin": "0 6px"
            }).text(contents);
        }

        // SetTimeout prevents KeyUp events from dismissing the dialog
        var closeCallbackRun = false;
        setTimeout(function() {
            contents.dialog({
                "buttons": {"Ok": function() {
                    $(this).dialog("close");
                    if (!closeCallbackRun && callback) {
                        callback();
                        closeCallbackRun = true;
                    }
                }},
                "modal": true,
                "resizable": false,
                "title": title || ""
            }).bind("dialogbeforeclose", function() {
                if (!closeCallbackRun && callback) {
                    callback();
                    closeCallbackRun = true;
                }
            });
        }, 1);
    },

    confirm: function(contents, title, okCallback, cancelCallback, okText, afterOkText) {
        // Callbacks are passed the dialog object, and can return false to keep the dialog from being closed

        if (typeof contents == "string" || typeof contents == "number") {
            contents = $DIV().css({
                "margin": "0 6px"
            }).text(contents);
        }

        var callbackOnClose = true;
        var buttonPressed = function(callback) {
            var doClose = true;
            callbackOnClose = false;
            if (callback) {
                doClose = (callback(contents) != false);
            }
            if (doClose) {
                contents.dialog("close");
            } else {
                callbackOnClose = true;
            }
        };

        // Wrap contents in a dialog div with an OK and cancel button
        contents = $DIV().append(
            $DIV().css({
                "min-height": 35
            }).append(
                contents
            ),
            $DIV().css({
                "margin-top": 12,
                "border-top": "1px solid #DDD",
                "padding-top": 8
            }).append(
                $DIV().css({
                    "float": "right"
                }).append(
                    G.util.makeTable([
                        $TD().css({
                            "padding-right": 8
                        }).append(
                            new G.controls.Button().set({
                                "text": okText || "Ok",
                                "disabledText": afterOkText
                            }).style({
                                "fontSize": 14,
                                "width": 50
                            }).bind({
                                "click": function() {
                                    buttonPressed(okCallback);
                                    if (afterOkText) {
                                        this.disable();
                                    }
                                }
                            }).renderHere()
                        ),
                        $TD().css({
                        }).append(
                            G.util.makeLink(
                                $DIV().css({
                                    "padding-top": 12,
                                    "padding-bottom": 12,
                                    "font-size": 12,
                                    "font-family": "helvetica, arial",
                                    "color": G.colors.gray
                                }).text("Cancel"),
                                function() {
                                    buttonPressed(cancelCallback);
                                }
                            )
                        )
                    ])
                ),
                $DIV().css("clear","both")
            )
        );

        // SetTimeout prevents KeyUp events from dismissing the dialog
        setTimeout(function() {
            contents.dialog({
                "modal": true,
                "resizable": false,
                "title": title || ""
            }).bind("dialogbeforeclose", function() {
                if (cancelCallback && callbackOnClose) {
                    return cancelCallback($(this));
                }
            });
        }, 1);

        return contents;
    },

    alertOops: function(contents) {
        G.util.alert(contents, "oops...");
    },

    alertError: function(errorData) {
        G.util.alert(errorData.msg, "Error");
    },

    popup: function(contents, options, renderCallback) {
        // Fight bad jQuery UI dialog styles
        contents.css({
            "font-family": "Helvetica, Arial",
            "line-height": "100%"
        });

        options = $.extend({
            "modal": true,
            "resizable": false
        }, options || {});

        // SetTimeout prevents KeyUp events from dismissing the alert
        setTimeout(function() {
            contents.dialog(options);
            if (renderCallback) {
                renderCallback();
            }
        }, 1);

        return contents;
    },

    parseInt: function(num) {
        var autoParsed = parseInt(num, 10);
        if (autoParsed === autoParsed) {
            return autoParsed;
        } else {
            //autoParsed is NaN
            return 0;
        }
    },

    commaSeparate: function(num, decimals) {
        if (num == undefined) {
            return "???";
        }

        var numStr;
        if (decimals == null) {
            numStr = "" + num;
        } else {
            numStr = "" + num.toFixed(decimals);
        }

        if (numStr.charAt(0) == "-") {
            return "-" + G.util.commaSeparate(numStr.substring(1));
        }

        var decimalPoint = numStr.indexOf(".");
        if (decimalPoint == -1) {
            decimalPoint = numStr.length;
        }

        var ret = "";
        for (var j=0; j<decimalPoint; j++) {
            ret += numStr.charAt(j);

            if (j<decimalPoint-1 && j%3 == (decimalPoint-1)%3) {
                ret += ",";
            }
        }

        ret += numStr.substr(decimalPoint);
        return ret;
    },

    formatResultCount: function(resultCount) {
        var formatted;
        if (resultCount >= G.constants.maxResultCount) {
            formatted = G.util.commaSeparate(G.constants.maxResultCount) + "+";
        } else {
            formatted = G.util.commaSeparate(resultCount);
        }
        return formatted;
    },

    deepApply: function(value, func, arrayFunc, objectFunc) {
        // Recursively apply func on value and its sub-values.
        // There better not be any cyclical references!
        //
        // E.g. if value == {a: b, c: [d, e], f: {g: h}}:
        //     {a: func(b), c: [func(d), func(e)], f: {g: func(h)}}
        //
        // Now try setting arrayFunc = function(value) {return 5;}:
        //     {a: func(b), c: 5, f: {g: func(h)}}
        //
        // Now also set objectFunc = function(value) {
        //     if (g in value) {
        //         return 8;
        //     }
        // }:
        //     {a: func(b), c: 5, f: 8}

        var useFunction = function(f, defaultF) {
            var fRet;
            if (f) {
                fRet = f(value);
            }

            if (fRet === undefined) {
                return defaultF(value);
            } else {
                return fRet;
            }
        }

        var bottomOuter = function(value) {
            return value;
        };

        var arrayRecurser = function(arr) {
            return $.map(arr, function(v) {
                return G.util.deepApply(v, func, arrayFunc, objectFunc);
            });
        };

        var objectRecurser = function(obj) {
            var newObj = {};
            $.each(value, function(k, v) {
                if (!(v instanceof Function)) {
                    newObj[k] = G.util.deepApply(v, func, arrayFunc, objectFunc);
                }
            });
            return newObj;
        };

        if (value instanceof Array) {
            return useFunction(arrayFunc, arrayRecurser);

        } else if (
            (value instanceof Function) ||
            (value instanceof Date) ||
            (value instanceof Class)
        ) {
            return useFunction(func, bottomOuter);

        } else if (typeof value == "object" && value != null) {
            return useFunction(objectFunc, objectRecurser);

        } else {
            return useFunction(func, bottomOuter);
        }
    },

    deepExtend: function(dict, extension) {
        // Like $.extend, but recurses on objects in extension argument

        $.each(extension, function(key, value) {
            if (value == null) {
                // Don't overwrite values with null
                return true;
            } else if (typeof value == "object") {
                dict[key] = G.util.deepExtend(dict[key] || {}, value);
            } else {
                dict[key] = value;
            }
        });

        return dict;
    },

    toServer: function(value) {
        // Recursively encodes G.data objects as dicts.

        return G.util.deepApply(
            value,
            function(value) {
                if (value instanceof G.Data) {
                    return G.util.toServer(value.toServer());
                }
            }
        );
    },

    makeObj: function(param1, value1, etc) {
        /* Lets you use this syntax:
         *    var obj = G.util.makeObj(
         *        param1, value1,
         *        param2, value2,
         *        etc
         *    );
         *
         * For when you want to inline an object
         * with nontrivial keys
        */

        var obj = {};
        var args = arguments;
        $.each(args, function(i, arg) {
            if (i % 2 == 0) {
                obj[arg] = args[i+1];
            }
        });
        return obj;
    },

    makePreloader: function(caption) {
        var preloader = $DIV().css({
            "line-height": "150%"
        });

        if (caption) {
            preloader.append(
                $SPAN().text(caption),
                $BR()
            );
        }

        preloader.append(
            G.util.$IMG("loader.gif")
        );

        return preloader;
    },

    escapeHtml: function(text) {
        // Returns non-functional HTML markup
        // used to convert input text into innerHTML.
        //
        // Better than jQuery's element.text(text) because
        // it respects line breaks in the input.

        var MAP = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&#34;',
            "'": '&#39;',
            "\n": "<br/>"
        };

        var repl = function(c) {
            return MAP[c];
        };

        return text.replace(/[&<>'"\n]/g, repl);
    },

    makeDiv: function(contents) {
        if (typeof contents == "string") {
            return $DIV().html(G.util.escapeHtml(contents));
        } else {
            return contents;
        }
    },

    makeSpan: function(contents) {
        if (typeof contents == "string") {
            return $SPAN().html(G.util.escapeHtml(contents));
        } else {
            return contents;
        }
    },

    map: function(iterable, func) {
        var mapped = [];
        $.each(iterable, function(key, value) {
            mapped.push(func(key, value));
        });
        return mapped;
    },

    mapValues: function(iterable, func) {
        // Like $.map but doesn't pass element indexe
        // as second argument to func
        return $.map(iterable, function(x, i) {
            return func(x);
        });
    },

    mapDict: function(iterable, func, passKeys) {
        // Like $.map but outputs a dict with the same keys
        var mapped = {};
        $.each(iterable, function(key, value) {
            if (passKeys) {
                mapped[key] = func(value, key);
            } else {
                mapped[key] = func(value);
            }
        });
        return mapped;
    },

    mapUnique: function(iterable, func) {
        // Returns an array of unique items
        var dict = {};
        var mapped = [];
        $.each(iterable, function(key, value) {
            if (!(value in dict)) {
                dict[value] = true;

                if (func) {
                    mapped.push(func(value));
                } else {
                    mapped.push(value);
                }
            }
        });
        return mapped;
    },

    filter: function(iterable, filterFunc) {
        if (!filterFunc) {
            filterFunc = function(value, key) {
                return !!value;
            }
        }

        var filtered = [];
        $.each(iterable, function(key, value) {
            if (filterFunc(value, key)) {
                filtered.push(value);
            }
        });
        return filtered;
    },

    filterDict: function(dict, filterFunc) {
        var filtered = {};
        $.each(dict, function(key, value) {
            if (filterFunc(key, value)) {
                filtered[key] = value;
            }
        });
        return filtered;
    },

    pluralize: function(text, num, singular, plural, zeroText) {
        // Example:
        //   "You have 1 coin" vs "You have 2 coins"
        //   G.util.pluralize("You have [num] [x]", coinCount, "coin", "coins")

        text = text.replace(/\[num\]/g, (num == 0 && zeroText != undefined)? zeroText : G.util.commaSeparate(num));
        text = text.replace(/\[x\]/g, (num == 1)? singular : plural);
        return text;
    },

    increment: function(dict, key, addend) {
        dict[key] = (dict[key] || 0) + ((addend === undefined)?1:addend);
    },

    makeExtLink: function(contents, onclick, css, hoverCss) {
        var link = G.util.makeLink(contents, onclick, null, css, hoverCss);
        if (link) {
            link.attr("target", "_blank");
        }
        return link;
    },

    makeActionLink: function(contents, onclick) {
        // Make a link styled for an action that edits the site
        // (like editing or commenting)
        return G.util.makeLink(contents, onclick).css({
            "color": G.colors.action,
            "font-weight": "bold"
        });
    },

    makeEditLink: function(contents, onclick, afterContents, css, hoverCss) {
        var link = G.util.makeLink(contents, onclick, afterContents, css, hoverCss);
        link.css({
            "display": "inline-block",
            "color": G.colors.action
        });
        link.prepend(
            G.util.$IMG("pencil.gif").css({
                "width": 14,
                "height": 14
            })
        );
        return link;
    },

    makeFlagLink: function(params) {
        var msgSection;
        var reportBox = new G.controls.TextBox().set({
            "big": true
        }).style({
            "width": 350,
            "height": 80
        });
        var flagLinkSection = $SPAN();
        var flagLink = G.util.makeLink(
            $SPAN().append(
                G.util.$IMG("flag.png").css({
                    "width": 15,
                    "height": 15,
                    "padding-right": 2,
                    "position": "relative",
                    "top": 2
                }),
                $SPAN().text("report").css({
                    "color": G.colors.gray,
                    "font-size": 13,
                    "font-weight": "normal"
                })
            ),
            function() {
                var popup = G.util.popup(
                    $DIV().append(
                        $DIV().text("Please report if the information on this page is inaccurate or needs to be revised."),
                        reportBox.renderHere().css({
                            "margin-top": 8
                        }),
                        msgSection = $DIV().css({
                            "margin-top": 4
                        }).text(
                            "Thanks!"
                        ).hide()
                    ),
                    {
                        "width": 370,
                        "title": "Report",
                        "buttons": {
                            "Report": function() {
                                if (!reportBox.text || reportBox.text.match(/^\s*$/)) {
                                    reportBox.showValMsg("required");
                                    return;
                                }
                                reportBox.disable();
                                msgSection.show();
                                popup.dialog("close");
                                flagLinkSection.empty().append(
                                    $SPAN().css({
                                        "color": "red"
                                    }).text("reporting...")
                                );
                                G.post(
                                    "add_flag",
                                    $.extend(
                                        {
                                            "text": reportBox.text
                                        },
                                        params
                                    ),
                                    function(data) {
                                        if (data.rc) {
                                            flagLinkSection.empty().append(
                                                $SPAN().text(data.msg)
                                            );
                                            return;
                                        }

                                        flagLinkSection.empty().append(
                                            $SPAN().css({
                                                "color": "red"
                                            }).text("thanks!")
                                        );
                                    }
                                );
                            }
                        }
                    },
                    function() {
                        reportBox.focus();
                    }
                );
            }
        );
        return flagLinkSection.append(flagLink);
    },

    makeLink: function(contents, onclick, afterContents, css, hoverCss) {
        if (!contents) {
            return null;
        }

        if (onclick === undefined) {
            if (typeof contents != "string") {
                // Return the contents without any linking
                return contents;
            }

            onclick = contents;

        } else if (!onclick) {
            return $SPAN().text(contents)
        }

        if (!css) {
            css = {
                "text-decoration": "none"
            };
        }
        if (!hoverCss) {
            hoverCss = {
                "text-decoration": "underline"
            };
        }

        var elem;

        if (typeof onclick == "string") {
            elem = $A().attr("href", onclick).css({
                "text-decoration": "none"
            }).append(G.util.makeSpan(contents));
        } else {
            elem = $SPAN().addClass("link").css({
                "cursor": "pointer"
            }).append(G.util.makeSpan(contents)).click(function(e) {
                // Within the onclick function, we make "this" refer to
                // a jQuery object
                var ret = onclick.call($(this), e);
                if (afterContents && ret != false) {
                    elem.empty().css({
                        "color": "",
                        "cursor": "default",
                        "text-decoration": "none"
                    }).unbind("click").unbind("mouseover").append(
                        G.util.makeSpan(afterContents)
                    );
                }
                return ret;
            });
        }

        elem.css({
            "color": G.colors.quixey,
            "background": "none",
            "padding": 0
        }).css(
            css
        ).hover(
            function() {
                elem.css(hoverCss);
            },
            function() {
                elem.css(css);
            }
        );

        return elem;
    },

    makeSureLink: function(contents, onclick, afterContents, css, hoverCss) {
        // Makes a link that asks "are you sure?"

        var contentsSection = G.util.makeLink(contents, function() {
            contentsSection.hide();
            aysSection.css("display","inline");
        }, null, css, hoverCss);

        var aysSection = $SPAN().append(
            G.util.nbSpan("are you sure? "),
            G.util.makeLink("yes", function() {
                aysSection.hide();
                if (afterContents) {
                    afterContentsSection.css("display","inline");
                } else {
                    contentsSection.css("display","inline");
                }
                return onclick.apply(this, arguments);
            }),
            G.util.nbSpan(" / "),
            G.util.makeLink("no", function() {
                aysSection.hide();
                contentsSection.css("display","inline");
            })
        );

        var afterContentsSection = afterContents? G.util.makeSpan(afterContents) : $SPAN();

        return $SPAN().css({
            "color": "#666"
        }).append(
            contentsSection,
            aysSection.hide(),
            afterContentsSection.hide()
        );
    },

    nbSpan: function(text) {
        // Turns spaces into non-breaking spaces
        var span = G.util.makeSpan(text);
        return span.html(span.html().replace(/ /g, "&nbsp;"));
    },

    nbHtmlSpan: function(html) {
        // Turns spaces into non-breaking spaces
        return $SPAN().html(html.replace(/ /g, "&nbsp;"));
    },

    space: function(width) {
        return $SPAN().css({
            "word-spacing": width || 4
        }).text(" ");
    },

    nbSpace: function(width) {
        return G.util.nbSpan(" ").css({
            "word-spacing": width || 4
        });
    },

    setAll: function(dict, value) {
        $.each(dict, function(key, oldValue) {
            dict[key] = value;
        });
    },

    isValidEmail: function(str) {
        var illegalChars = /[\(\)\<\>\,\;\:\\\/\"\[\]]/;
        var emailFilter = /^.+@.+\.\w\w+$/;

        if (str.match(illegalChars)) {
            return false;
        } else if (!emailFilter.test(str)) {
            return false;
        }

        return true;
    },

    isValidUrl: function(str) {
        return /^(http|https):\/\/[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)+(:[0-9]+)?(\/[\w#!:.+=&%@!-]+)*\/?(\?.*)?$/.test(str);
    },

    trimStart: function(str) {
        return (str || "").replace(/^\s/g, "");
    },

    makeField: function(fieldName, value) {
        if (!value) {
            return $DIV();
        }

        return $DIV().css({
            "margin-bottom": 20
        }).append(
            $DIV().css({
                "font-size": 11,
                "font-weight": "bold",
                "padding-bottom": 2,
                "border-bottom": "1px solid #DDD",
                "margin-bottom": 4
            }).append(
                G.util.makeSpan(fieldName)
            ),
            $DIV().css({
                "margin-top": 4,
                "padding-left": 4
            }).append(
                G.util.makeSpan(value)
            )
        )


        var fieldNameSpan;
        if (typeof fieldName == "string" || typeof fieldName == "number") {
            fieldNameSpan = $SPAN().css({
                "font-weight": "bold"
            }).text(fieldName + "")
        } else {
            fieldNameSpan = fieldName;
        }

        var valueSpan;
        if (!value) {
            valueSpan = $SPAN().css({
                "font-style": "italic",
                "color": "#666"
            }).text("none");
        } else if (typeof value == "string" && value.indexOf("\n") >= 0) {
            valueSpan = $DIV().css({
                "margin-left": 12
            }).html(G.util.escapeHtml(value));
        } else if (typeof value == "string" || typeof value == "number") {
            valueSpan = $SPAN().text(value)
        } else {
            valueSpan = value;
        }

        return G.util.makeTable([
            $TD().css({
                "padding-right": 12,
                "vertical-align": "top"
            }).append(
                fieldNameSpan
            ),
            $TD().css({
                "vertical-align": "top"
            }).append(
                valueSpan
            )
        ]).css({
            "min-width": width || ""
        });
    },

    makeBigField: function(fieldName, value) {
        // G.util.makeField with a line break after fieldName

        if (!value) {
            value = $DIV().css({
                "font-style": "italic",
                "color": "#666"
            }).text("none");
        } else {
            value = G.util.makeDiv(value);
        }

        return G.util.makeField(fieldName, value);
    },

    getTextHeight: function(text, width, fontSize) {
        var testDiv = $DIV().css({
            "width": width,
            "opacity": 0
        }).append(G.util.makeSpan(text));
        if (fontSize) {
            testDiv.css("font-size", fontSize);
        }

        $("body").append(testDiv);
        var height = testDiv.height();
        testDiv.remove();
        return height;
    },

    fetchImgSize: (function() {
        var imgSizeByPath = {};

        return function(imgPath, callback, async) {
            if (imgPath in imgSizeByPath) {
                if (async) {
                    setTimeout(function() {
                        callback(imgSizeByPath[imgPath]);
                    }, 1);
                } else {
                    callback(imgSizeByPath[imgPath]);
                }
                return;
            }

            var testDiv = $DIV().addClass("image_size_detector").css({
                "position": "absolute",
                "width": 1,
                "height": 1,
                "overflow": "hidden"
            });
            $("body").append(testDiv);

            var img = $("<img/>").bind("load", function() {
                setTimeout(function() {
                    var size = {
                        "width": img.width(),
                        "height": img.height()
                    };

                    testDiv.remove();
                    imgSizeByPath[imgPath] = size;
                    callback(size);
                }, 1);
            }).bind("error", function() {
                setTimeout(function() {
                    callback(null);
                }, 1);
            });

            testDiv.append(
                img.attr("src", G.util.imgPath(imgPath))
            );
        };
    })(),

    compare: function(a, b) {
        // The most natural comparator function.
        //
        // JavaScript Array.sort treats numbers as strings,
        // so always pass this function as the comparator.

        if (typeof a == "string" && typeof b == "string") {
            a = a.toUpperCase();
            b = b.toUpperCase();
        } else if (typeof a == "number" || typeof b == "number") {
            a = a || 0;
            b = b || 0;
        } else if (a instanceof Class && a._class.compare) {
            return a._class.compare(a, b);
        }

        if (a == b) {
            return 0;
        } else if (a < b) {
            return -1;
        } else if (b < a) {
            return 1;
        }
    },

    fieldComparator: function(fieldName) {
        var reversed = fieldName[0] == "-";
        var realFieldName = reversed? fieldName.substring(1) : fieldName;

        return function(a, b) {
            var aField;
            var bField;

            G.assert(realFieldName in a, "Field " + fieldName + " not in " + a);
            G.assert(realFieldName in b, "Field " + fieldName + " not in " + b);

            if (reversed) {
                aField = b[realFieldName];
                bField = a[realFieldName];
            } else {
                aField = a[realFieldName];
                bField = b[realFieldName];
            }

            if (typeof aField == "function") {
                aField = aField();
            }
            if (typeof bField == "function") {
                bField = bField();
            }

            return G.util.compare(aField, bField);
        };
    },

    fieldGetter: function(obj) {
        return function(fieldName) {
            return obj[fieldName];
        };
    },

    getLines: function(text) {
        // Return an array of trimmed, non-empty lines
        var lines = text.split("\n");

        return G.util.filter(
            $.map(lines, G.util.trimStart)
        );
    },

    makeUrl: function(str) {
        if (!str) {
            return "";
        } else if (str.substring(0, 7) == "http://") {
            return str;
        } else if (str.substring(0, 8) == "https://") {
            return str;
        } else if (str.substring(0, 5) == "data:") {
            return str;
        } else {
            return "http://" + str;
        }
    },

    validateRequired: function() {
        // Returns true if all textBoxes contain text.
        // Otherwise returns false and shows valMsgs.

        var textBoxes = $.isArray(arguments[0])? arguments[0] : arguments;

        var ok = true;
        $.each(textBoxes, function(i, textBox) {
            if (!textBox.text) {
                ok = false;
                textBox.showValMsg("required");
            }
        });
        return ok;
    },

    makeParamString: function(obj, spaceToPlus) {
        if (spaceToPlus == null) {
            spaceToPlus = true;
        }

        return G.util.filter(G.util.map(obj, function(key, value) {
            if (value == null) {
                return null;
            }

            var escapedValue = encodeURIComponent("" + value);
            if (spaceToPlus) {
                escapedValue = escapedValue.replace(/[+]/g, '%2B').replace(/%20/g, '+');
            }
            return key + "=" + escapedValue;
        }), function(value) {return value != null;}).join("&");
    },

    makeOneCellTable: function() {
        // Takes multiple content arguments, just like $DIV().append()

        var td = $("<td/>");
        td.append.apply(td, arguments);

        return G.util.makeTable([td]);
    },

    makeTable: function(cells, rowSize, innerBorderX, innerBorderY) {
        // If rowSize is null, it will be a single row of cells
        rowSize = rowSize || 1000;

        var table = $("<table/>").attr({
            "cellpadding": 0,
            "cellspacing": 0
        });
        var row;

        var pos = 0;
        $.each(cells, function(i, cell) {
            if (cell) {
                // HACK quick fix: In IE, it seems we can unintentionally get undefined
                // if the caller is like fn(arg1, arg2,)
                // (trailing comma)
                if (pos % rowSize == 0) {
                    table.append(
                        row = $("<tr/>")
                    );
                }

                if (innerBorderX && i % rowSize > 0) {
                    cell.css("border-left", innerBorderX);
                }
                if (innerBorderY && i >= rowSize) {
                    cell.css("border-top", innerBorderY);
                }

                row.append(cell);

                pos += cell.attr("colspan") || 1;
            }
        });

        return table;
    },

    scrollToTop: function() {
        $.scrollTo(0, {
            "axis": "y"
        });
    },

    scrollUpTo: function(y, margin) {
        var elem = $("body").attr("scrollTop")? $("body") : $("html");
        var currentY = $("body").attr("scrollTop") || $("html").attr("scrollTop");
        if (currentY > y) {
            elem.animate({
                "scrollTop": y - (margin || 0)
            }, "normal");
        }
    },

    tryGet: function(objOrNot, key, defaultValue) {
        // G.util.tryGet(a.b, c)
        //     same as
        // (a.b || {"c":defaultValue}).c

        if (objOrNot) {
            return objOrNot[key];
        } else {
            return defaultValue;
        }
    },

    setDefault: function(obj, key, defaultValue) {
        // Same as Python obj.setdefault(key, defaultValue)
        if (key in obj) {
            return obj[key];
        } else {
            obj[key] = defaultValue;
            return defaultValue;
        }
    },

    objIsEmpty: function(obj) {
        for (var x in obj) {
            return false;
        }
        return true;
    },

    markdownToSafeHtml: (function() {
        // Instantiate a single converter object for all Markdown parsing
        var converter = new Showdown.converter();

        return function(text) {
            // Escape HTML characters while leaving ">" (Markdown
            // quote syntax) intact, then parse with Markdown

            // Text could start with "#1" but that shouldn't make it a header
            text = text.replace(/^\#\w/g, function(s) {return " " + s;});

            var escapedHtml = (text||"").replace(/&/g, "&amp;").replace(/</g, "&lt;");
            escapedHtml = escapedHtml.replace(/\n/g, "  \n"); // Improved line break syntax
            return converter.makeHtml(escapedHtml);
        }
    })(),

    makeMarkdownDiv: function(text) {
        return $DIV().css({
            "margin-bottom": -10
        }).append(
            $DIV().html(G.util.markdownToSafeHtml(text))
        );
    },

    scaleToFit: function(width, height, boxWidth, boxHeight) {
        // Maintain width:height aspect ratio while fitting
        // the rectangle into a boxWidth x boxHeight box.

        // If boxWidth or boxHeight is ommitted, it's like the
        // box is infinitely wide or high.

        var aspectRatio = width / height;

        boxWidth = boxWidth || boxHeight * aspectRatio;
        boxHeight = boxHeight || boxWidth * aspectRatio;

        var potentialWidth = boxHeight * aspectRatio;
        var potentialHeight = boxWidth / aspectRatio;

        return {
            "width": parseInt(Math.min(boxWidth, potentialWidth)),
            "height": parseInt(Math.min(boxHeight, potentialHeight))
        };
    },

    shrinkToFit: function(width, height, boxWidth, boxHeight) {
        // Like scaleToFit except never grows the image

        var scaledSize = G.util.scaleToFit(width, height, boxWidth, boxHeight);

        if (scaledSize.width <= width) {
            return scaledSize;
        } else {
            // Fitting it to the box would require scaling up
            // so don't change its size
            return {
                "width": width,
                "height": height
            };
        }
    },

    reverseEach: function(arr, f) {
        // Like $.each except backtracks through arrays
        G.assert($.isArray(arr));

        for (var i=arr.length-1; i>=0; i--) {
            var ret = f(i, arr[i]);
            if (ret === false) {
                return;
            }
        }
    },

    removeFromArray: function(arr, item) {
        var itemIndex = $.inArray(arr, item);
        if (itemIndex == -1) {
            return false;
        }
        arr.splice(itemIndex, 1);
        return true;
    },

    constantFunc: function(value) {
        return function() {
            return value;
        };
    },

    dictKeys: function(dict) {
        var keys = [];
        $.each(dict, function(key, value) {
            keys.push(key);
        });
        return keys;
    },

    dictValues: function(dict) {
        var values = [];
        $.each(dict, function(key, value) {
            values.push(value);
        });
        return values;
    },

    getKey: function(dict, value) {
        var key;
        $.each(dict, function(k, v) {
            if (v == value) {
                key = k;
                return false;
            }
        });
        return key;
    },

    thread: function() {
        // Execute arguments functions in a thread

        var funcArgs = arguments;
        var argIndex = -1;

        var executeArg = function() {
            argIndex += 1;

            funcArgs[argIndex]();

            if (argIndex < funcArgs.length - 1) {
                setTimeout(executeArg, 1);
            }
        };

        if (funcArgs.length) {
            setTimeout(executeArg, 1);
        }
    },

    highlight: function(elem) {
        return elem.css({
            "background-color": G.colors.highlight
        });
    },

    findHighlights: function(query, text) {
        if (!query) {
            return [];
        }
        var highlights = [];

        var ucaseQuery = query.toUpperCase();
        var queryTokens = ucaseQuery.split(/\W/);

        var tokenPattern = /\b\S+?\b/g;
        var match;
        while (match = tokenPattern.exec(text)) {
            var token = match[0];
            if ($.inArray(token.toUpperCase(), queryTokens) != -1) {
                highlights.push([match.index, match.index + token.length]);
            }
        }

        return highlights;
    },

    makeHighlightedText: function(text, highlights, highlightCSS) {
        // highlights: [[start, end], ...]
        if (!highlightCSS) {
            highlightCSS = {"font-weight": "bold", "text-decoration": "underline"}
        }

        var endByStart = {};
        $.each(highlights, function(i, highlight) {
            endByStart[highlight[0]] = highlight[1];
        });

        var elem = $SPAN();

        var highlighting = false;
        var checkpoint = 0;
        var end;
        for (var i=0; i<text.length; i++) {
            if (highlighting) {
                if (i in endByStart) {
                    end = Math.max(end, endByStart[i]);
                }
                if (i == end) {
                    elem.append(
                        $SPAN().css(
                            highlightCSS
                        ).text(text.substring(checkpoint, i))
                    );
                    highlighting = false;
                    checkpoint = i;
                }
            } else {
                if (i in endByStart) {
                    elem.append(
                        $SPAN().text(text.substring(checkpoint, i))
                    );
                    highlighting = true;
                    checkpoint = i;
                    end = endByStart[i];
                }
            }
        }
        elem.append(
            $SPAN().css(
                highlighting?highlightCSS:{}
            ).text(text.substring(checkpoint))
        );

        return elem;
    },

    weakHash: function(str) {
        // Hashes a string to enable better equality comparison and sort.
        // Example: "pizza-eating fun & games!" -> "PIZZA EATING FUN GAMES"

        var hashed = $.trim(str.replace(/\W+/g, " ")).toUpperCase();

        if (hashed) {
            return hashed;
        } else {
            return $.trim(str).toUpperCase();
        }
    },

    haveSameHash: function(a, b) {
        return G.util.weakHash(a) == G.util.weakHash(b);
    },

    forceReflow: function() {
        // This forces a reflow
        var x = $("body").offset();
    },

    shortenText: function(text, maxWordLength, maxLength, showEllipsis) {
        // Also shortenText(text, maxLength)
        if (!maxLength) {
            maxLength = maxWordLength;
        }
        showEllipsis = showEllipsis != false;

        // First enforce the maxWordLength
        var newText = "";
        var cutoffWord = false;
        $.each(text.split(" "), function(i, word) {
            if (newText) {
                newText += " ";
            }

            if (word.length > maxWordLength) {
                // Cut off the string before any of the words
                // in it is over the maxWordLength.
                cutoffWord = true;
                newText += word.substring(0, maxWordLength - 3);
                return false;
            } else {
                newText += word;
            }
        });
        text = newText;

        if (!cutoffWord && text.length <= maxLength) {
            return text;
        } else {
            if (showEllipsis) {
                return text.substring(0, maxLength - 3) + "...";
            } else {
                return text.substring(0, maxLength);
            }
        }
    },

    makeShortenedText: function(shortText, fullText, marginTop) {
        if (shortText == fullText) {
            return G.util.makeSpan(shortText);
        }

        var elems = {};
        return $DIV().append(
            elems.shortSection = $DIV().css({
                "cursor": "pointer"
            }).append(
                G.util.makeSpan(shortText),
                $SPAN().text(" "),
                elems.moreLink = $DIV().append(
                    $SPAN().addClass("link").text("(more)").css({
                        "font-weight": "normal"
                    })
                ).css({
                    "margin-top": marginTop || 0
                })
            ).hover(
                function() {
                    elems.moreLink.css({
                        "text-decoration": "underline"
                    });
                },
                function() {
                    elems.moreLink.css({
                        "text-decoration": "none"
                    });
                }
            ).click(function() {
                elems.shortSection.hide();
                elems.fullSection.show();
            }),
            elems.fullSection = $DIV().css({
            }).append(
                G.util.makeSpan(fullText),
                $SPAN().text(" "),
                elems.lessLink = G.util.makeLink("(less)", function() {
                    elems.fullSection.hide();
                    elems.shortSection.show();
                }).css({
                    "color": G.colors.gray,
                    "font-weight": "normal"
                })
            ).hide()
        );
    },

    makeShortenedHighlightedText: function(text, maxLength, highlights, highlightCSS) {
        // makeHighlightedText returns distinct objects so have to special-case this
        var highlightedText = G.util.makeHighlightedText(text, highlights, highlightCSS);
        var shortText = G.util.shortenText(text, maxLength);
        if (shortText != text) {
            return G.util.makeShortenedText(
                G.util.makeHighlightedText(shortText, highlights, highlightCSS),
                highlightedText
            );
        } else {
            return highlightedText;
        }
    },

    makeShortenedMarkdownDiv: function(contents, maxLength, maxLines, marginTop) {
        if (maxLines) {
            var lineBreakPos = -1;
            for (var i=0; i<maxLines; i++) {
                var startIndex;
                if (lineBreakPos == -1) {
                    startIndex = 0;
                } else {
                    startIndex = lineBreakPos;
                    while (startIndex < contents.length && contents[startIndex].match(/\s/)) {
                        startIndex += 1;
                    }
                }
                lineBreakPos = contents.indexOf("\n", startIndex);
                if (lineBreakPos == -1) {
                    break;
                }
            }
            if (lineBreakPos >= 0) {
                var startIndex = lineBreakPos;
                while (startIndex < contents.length && contents[startIndex].match(/\s/)) {
                    startIndex += 1;
                }
                var nextLineBreakPos = contents.indexOf("\n", startIndex);
                if (nextLineBreakPos >= 0) {
                    if (maxLength) {
                        maxLength = Math.min(maxLength, lineBreakPos);
                    } else {
                        maxLength = lineBreakPos;
                    }
                }
            }
        }

        if (contents.length <= maxLength) {
            return G.util.makeMarkdownDiv(contents);
        } else {
            return G.util.makeShortenedText(
                G.util.makeMarkdownDiv(
                    G.util.shortenText(
                        contents,
                        maxLength,
                        null,
                        false
                    )
                ),
                G.util.makeMarkdownDiv(
                    contents
                ),
                marginTop
            );
        }
    },

    makeShortenedLink: function(shortContents, fullText, onClick) {
        return G.util.makeLink(shortContents, onClick || fullText).attr({
            "title": fullText
        });
    },

    objToStr: function(obj) {
        // Pretty print objects

        if (typeof obj == "object") {
            var str = "";
            $.each(obj, function(key, value) {
                if (str) {
                    str += "\n";
                }
                str += "\"" + key + "\": " + $.toJSON(value);
            });
            return str;
        } else {
            return $.toJSON(obj);
        }
    },

    makeClickableUrls: function(contents, linkCss, linkHoverCss) {
        // Returns a span where the URLs in the text
        // are turned into hyperlinks.

        if (typeof contents == "string") {
            contents = $SPAN().text(contents);
        }

        var span = $SPAN();

        contents.children().each(function(i, elem) {
            if (!$(elem).is("span")) {
                return;
            }

            var text = $(elem).text();
            var tokens = text.split(" ");
            var pos = 0;
            $.each(tokens, function(tokenIndex, token) {
                if (token.substring(0, 7) == "http://") {
                    var tokenPos = text.indexOf(token, pos);
                    span.append(
                        $(elem).clone().text(text.substring(pos, tokenPos)),
                        G.util.makeLink(token, token, null, linkCss, linkHoverCss)
                    );
                    pos = tokenPos + token.length;
                }
            });
            span.append(
                $(elem).clone().text(text.substring(pos))
            );
        });

        return span;
    },

    getDomain: function(url) {
        // FIXME: Handle *.co.uk etc. sanely, either by only splitting off www., or by using something like
        // http://mxr.mozilla.org/mozilla-central/source/netwerk/dns/effective_tld_names.dat?raw=1
        var afterProtocol = url;
        if (url.indexOf("//") >= 0) {
            afterProtocol = url.substring(url.indexOf("//") + 2);
        }
        var fullDomain = afterProtocol.substring(0, (afterProtocol + "/").indexOf("/"));
        var tokens = fullDomain.split(".");
        return tokens[tokens.length - 2] + "." + tokens[tokens.length - 1];
    },

    getUrlPath: function(url) {
        var afterProtocol = url.substring(url.indexOf("//") + 2);
        return afterProtocol.substring((afterProtocol + "/").indexOf("/") + 1);
    },

    getUrlParts: function(url) {
        return $.map(
            G.util.filter(
                [G.util.getDomain(url)].concat(
                    G.util.getUrlPath(url).split("/")
                )
            ),
            function(part) {
                return part.toUpperCase();
            }
        );
    },

    makeAddress: function(text) {
        return $.trim(text.replace(/[\W_]+/g, " ")).replace(/ /g, "-").toLowerCase();
    },

    forRange: function(minOrMax, maxOrF, stepOrF, f) {
        // Same as Python "[f(i) for i in range(...)]"
        var min;
        var max;
        var step;
        if (typeof maxOrF == "function") {
            min = 0;
            max = minOrMax;
            step = 1;
            f = maxOrF;
        } else {
            min = minOrMax;
            max = maxOrF;
            if (typeof stepOrF == "function") {
                step = 1;
                f = stepOrF;
            } else {
                step = stepOrF;
            }
        }

        for (var i=min; (min<max)?(i<max):(i>max); i+=step) {
            f(i);
        }
    },

    randInt: function(a, b) {
        // Return random integer in range [a, b], including both end points.
        return Math.floor(Math.random() * (b - a + 1)) + a;
    },

    wordCount: function(str) {
        // Count whitespace-separated words, ignoring beginning and ending whitespace.
        return str.replace(/^\s+/, "").replace(/\s+$/, "").split(/\s+/).length;
    },

    sentenceCase: function(str) {
        // Convert upper-case sentences (things between .!?, newlines, or the
        // beginning or end of the string) of more than 3 words to sentence case.

        return $.map(str.split("\n"), function (line) {
            // process per-line because newlines should terminate sentences
            // and because . doesn't match \n
            var sentence_re = /^(.*?[.!?]\s*)??([^a-z.!?]+)([.!?].*)?$/;
            var result = "";
            var match;
            while (match = sentence_re.exec(line)) {
                var pre = match[1] ? match[1] : ""; // before the sentence
                var sentence = match[2]; // the sentence excluding terminating punctuation
                var post = match[3] ? match[3] : ""; // the rest
                if (G.util.wordCount(sentence) > 3) {
                    sentence = sentence.charAt(0) + sentence.substr(1).toLowerCase();
                }
                result += pre + sentence;
                line = post;
            }

            return result + line;
        }).join("\n");
    },

    formatByteSize: function(byteSize, decimals) {
        if (byteSize == null) {
            return "";
        }

        if (decimals === undefined) {
            decimals = 2;
        }

        if (byteSize < 1024) {
            return G.util.commaSeparate(byteSize, 0) + " bytes";
        } else if (byteSize < 1024 * 1024) {
            return G.util.commaSeparate(byteSize / 1024, decimals) + " kb";
        } else if (byteSize < 1024 * 1024 * 1024) {
            return G.util.commaSeparate(byteSize / (1024 * 1024), decimals) + " MB";
        } else {
            return G.util.commaSeparate(byteSize / (1024 * 1024 * 1024), decimals) + " GB";
        }
    },

    formatUrl: function(url) {
        return url.replace(/https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    },

    makeSet: function(arr) {
        // ["foo", "bar"] -> {"foo":true, "bar":true}
        var set = {};
        $.each(arr, function(i, value) {
            set[value] = true;
        });
        return set;
    },

    pageCount: function(n, pageSize) {
        if (n == 0) {
            return 0;
        } else {
            return parseInt((n - 1) / pageSize) + 1;
        }
    },

    equal: function(a, b) {
        if (a instanceof Object && b instanceof Object) {
            if ($.isArray(a) && $.isArray(b) && a.length != b.length) {
                return false;
            }

            var equal = true;
            $.each(a, function(aKey, aValue) {
                if (!(aKey in b && G.util.equal(b[aKey], aValue))) {
                    equal = false;
                    return false;
                }
            });

            if (equal) {
                if ($.isArray(a) && $.isArray(b)) {
                    return true;
                } else {
                    $.each(b, function(bKey, bValue) {
                        if (!(bKey in a && G.util.equal(a[bKey], bValue))) {
                            equal = false;
                            return false;
                        }
                    });

                    return equal;
                }

            } else {
                return false;
            }

        } else {
            return a == b;
        }
    },

    realTypeOf: function(v) {
      if (typeof(v) == "object") {
        if (v === null) return "null";
        if (v.constructor == (new Array).constructor) return "array";
        if (v.constructor == (new Date).constructor) return "date";
        if (v.constructor == (new RegExp).constructor) return "regex";
        return "object";
      }
      return typeof(v);
    },

    formatJson: function(oData, sIndent) {
        // Returns a JSON-formatted string good for putting
        // into an input textbox or a <pre> element.

        var formatJson = function(oData, sIndent) {
            var sIndentStyle = "    ";
            var sDataType = G.util.realTypeOf(oData);

            // open object
            if (sDataType == "array") {
                if (oData.length == 0) {
                    return "[]";
                }
                var sHTML = "[";
            } else {
                var iCount = 0;
                $.each(oData, function() {
                    iCount++;
                    return;
                });
                if (iCount == 0) { // object is empty
                    return "{}";
                }
                var sHTML = "{";
            }

            // loop through items
            var iCount = 0;
            $.each(oData, function(sKey, vValue) {
                if (iCount > 0) {
                    sHTML += ",";
                }
                if (sDataType == "array") {
                    sHTML += ("\n" + sIndent + sIndentStyle);
                } else {
                    sHTML += ("\n" + sIndent + sIndentStyle + "\"" + sKey + "\"" + ": ");
                }

                // display relevant data type
                switch (G.util.realTypeOf(vValue)) {
                    case "array":
                    case "object":
                        sHTML += formatJson(vValue, (sIndent + sIndentStyle));
                        break;
                    case "boolean":
                    case "number":
                        sHTML += vValue.toString();
                        break;
                    case "null":
                        sHTML += "null";
                        break;
                    case "string":
                        sHTML += ("\"" + vValue + "\"");
                        break;
                    default:
                        sHTML += ("TYPEOF: " + typeof(vValue));
                }

                // loop
                iCount++;
            });

            // close object
            if (sDataType == "array") {
                sHTML += ("\n" + sIndent + "]");
            } else {
                sHTML += ("\n" + sIndent + "}");
            }

            return sHTML;
        };

        return formatJson(oData, "");
    },

    makeMixpanelPlatform: function(bucketInfo) {
        return new Mixpanel.Platform(
            G.constants.mixpanelApiKey,
            bucketInfo.secret,
            bucketInfo.bucket
        );
    },

    isMobile: function() {
        // Based on http://plugins.jquery.com/project/advbrowsercheck
        var ua = ua = (navigator.userAgent || navigator.vendor || window.opera);
        return (/android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4)) || $.browser.ithing);
    }
};

// Common manually-created DOM elements
$DIV = function() {
    return $("<div/>");
};
$RDIV = function() {
    return $("<div/>").addClass("ui-corner-all");
};
$SPAN = function() {
    return $("<span/>");
};
$P = function() {
    return $("<p/>");
};
$A = function() {
    return $("<a/>");
};
$INPUT = function() {
    return $("<input/>");
};
$LABEL = function() {
    return $("<label/>");
};
$BR = function() {
    return $("<br/>");
};
$CENTER = function() {
    return $("<center/>");
};
$TD = function() {
    return $("<td/>");
};
$UL = function() {
    return $("<ul/>");
};
$OL = function() {
    return $("<ol/>");
};
$LI = function() {
    return $("<li/>");
};
$IFRAME = function(src) {
    return $("<iframe src=\"" + src + "\">").css({
        "border": 0
    });
};

G.colors = {
    "text": "#333",
    "quixey": "#0461B4",
    "primary": "#0461B4",
    "secondary": "#599FE0",
    "selectedBg": "#EEEEFF",
    "gray": "#A0A0A0",
    "lightGray": "#CCC",
    "lightGrayBg": "#F6F6F6",
    "facebook": "#3B5998",
    "action": "#007E06",
    "highlight": "#FF0",
    "lightHighlight": "#FFB"
};
