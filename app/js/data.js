/*
 * Data objects framework for G
 *
 * Dependencies: jQuery, class.js, util.js
*/

G.data = {}; // Data classes
G.dataDict = {}; // Dict of dicts of data instances by key()
G.d = G.dataDict; // Shorthand for debugging

// This is in order to allow calling G.defineData in any order,
// i.e. subclasses can be defined before their parents.
//
// G._pendingDataDefinitions = {
//     baseClassName: [{
//         "name": ...,
//         "props": ...,
//         "classProps": ...
//     }, ...],
//     ...
// }
G._pendingDataDefinitions = {};

G.defineData = function(name, props, classProps) {
    var baseClassName;
    var baseClass = G.Data;

    if (typeof arguments[1] == "string") {
        // Alternate syntax for data classes that inherit from other data classes:
        //   G.defineData(baseClassName, name, props, classProps)

        baseClassName = arguments[0];
        name = arguments[1];
        props = arguments[2];
        classProps = arguments[3];

        baseClass = G.data[baseClassName];
    }

    props = props || {};
    props._dataType = name;

    classProps = classProps || {};
    classProps._dataType = name;

    if (baseClass) {
        G.data[name] = baseClass.extend(props, classProps);
    } else {
        G.util.setDefault(G._pendingDataDefinitions, baseClassName, []).push({
            "name": name,
            "props": props,
            "classProps": classProps
        });
    }

    G.dataDict[name] = {};
}

$(function() {
    // On page load, define the pending classes in an order
    // that respects class dependencies

    var doAnotherPass = true;

    while (doAnotherPass && !G.util.objIsEmpty(G._pendingDataDefinitions)) {
        doAnotherPass = false;

        var pending = $.extend({}, G._pendingDataDefinitions);

        $.each(pending, function(baseClassName, argLists) {
            if (baseClassName in G.data) {
                // Parent class has been defined, so define child classes
                $.each(argLists, function(i, args) {
                    G.data[args.name] = G.data[baseClassName].extend(args.props, args.classProps);
                });

                // And delete parent class from the queue
                delete G._pendingDataDefinitions[baseClassName];

                doAnotherPass = true;
            }
        });
    }

    G.assert(
        G.util.objIsEmpty(G._pendingDataDefinitions),
        "There is a problem with the G.data class inheritance graph"
    );
});

G.Data = Class.extend({
    init: function(fields, fromServer) {
        // Store the names of JS object fields
        // which are actual data fields
        _this.fields = {}; //fieldName: true

        // Must be inherited by child class that defines _init method
        _this._init(fromServer);

        if (fields) {
            _this.set(fields);
        }
    },

    key: function() {
        // Creates a unique identifier for this data instance
        // to go in the dataDict.

        // This method should be overridden by data classes that
        // don't have an id property.

        return _this.id || null;
    },

    exists: function() {
        // Returns true if this object has an analogue on the server

        return !!_this.key();
    },

    createField: function(fieldName, value) {
        // Creates object fields
        var fields = {};
        fields[fieldName] = value;
        return _this.createFields(fields);
    },

    createFields: function(fields) {
        $.each(fields, function(fieldName, value) {
            G.assert(!(fieldName in _this.fields), "Field '" + fieldName + "' already exists in " + _this._dataType + " object");
            _this.fields[fieldName] = true;
            _this[fieldName] = value;
        });
    },

    func: function(arg1, arg2, arg3, etc, f) {
        var savedThis = _this; // Copy from global scope into lexical
        var funcWithContext = G.func.apply(null, arguments);

        return function() {
            var oldThis = window._this;
            window._this = savedThis;

            var ret = funcWithContext.apply(this, arguments);

            window._this = oldThis;
            return ret;
        };
    },

    get: function(fieldName, defaultValue) {
        // Wrapper for getting an object field while asserting that it exists

        G.assert(fieldName in _this.fields, _this._dataType + "." + fieldName + " does not exist.");

        if (_this[fieldName] == null) {
            // Require a defaultValue
            G.assert(arguments.length > 1, _this._dataType + "." + fieldName + " is null/undefined and no defaultValue was passed to get().");
            return defaultValue;

        } else {
            return _this[fieldName];
        }
    },

    set: function(fields, allowTypeChange) {
        // Updates the values of an object's fields

        if (typeof fields == "string") {
            var fieldsDict = {};
            fieldsDict[arguments[0]] = arguments[1];
            return _this.set(fieldsDict, arguments[2]);
        }

        $.each(fields, function(fieldName, field) {
            if (("_set_" + fieldName) in _this) {
                // Use object's setter method
                _this["_set_" + fieldName](field);
            } else {
                G.assert(fieldName in _this.fields, "Field '" + fieldName + "' does not exist in " + _this._dataType + " object");

                // Static typing
                if (!allowTypeChange) {
                    G.assert(
                        _this[fieldName] == undefined ||
                        field == undefined ||
                        _this[fieldName].constructor == field.constructor ||
                        (_this[fieldName] instanceof Class && field instanceof Class && (
                            _this[fieldName] instanceof field._class || field instanceof _this[fieldName]._class
                        ))
                    ,
                        "Cannot set " + _this._dataType + "." + fieldName + " from " + (typeof _this[fieldName]) + " to " + (typeof field) + " unless type change is allowed."
                    );
                }

                _this[fieldName] = field;
            }
        });
    },

    getFields: function() {
        return G.util.mapDict(_this.fields, function(true_, fieldName) {
            return _this[fieldName];
        }, true);
    },

    isValid: function() {
        // True if this instance's fields are considered a valid data value.
        // Child classes should often override this.
        return true;
    },

    fromServer: function(data) {
        // Update this instance using server data in dict form.

        if (!data) {
            G.warn("Called fromServer on a G.data instance (" + _this.toString() + ") with blank argument: ", data);
        }

        return _this._class.fromServer(data, _this);
    },

    clone: function() {
        var fields = {};
        $.each(_this.fields, function(fieldName) {
            fields[fieldName] = _this[fieldName];
        });
        return new _this._class(fields);
    },

    toServer: function() {
        // Converts data object into a dict for sending to server

        var d = {
            "className": _this._dataType
        };

        $.each(_this.fields, function(fieldName) {
            if (fieldName.charAt(0) == "_") {
                // Include optional fields that exist in this data instance
                if (_this[fieldName] !== null) {
                    d[fieldName.substring(1)] = _this[fieldName];
                }

            } else {
                d[fieldName] = _this[fieldName];
            }
        });

        return d;
    },

    toString: function() {
        return _this._dataType + " " + _this.key();
    }

}, {
    fromServer: function(data, instance) {
        // data: The object in dict form as given by the server.
        // instance (optional): An instance of _class that we want
        //     to turn into our server-given object to preserve
        //     variable references to it.

        if (typeof instance == "number") {
            // Hack to allow $.map(arr, G.Data.fromServer)
            // which passes an array index as its second arg
            instance = undefined;
        }

        if (instance) {
            G.assert(
                instance instanceof _class,
                instance.toString() + " is not an instance of " + _class._dataType
            );
        }

        if (!data) {
            G.error("Called " + _class._dataType + " fromServer with blank argument.");
        }

        var dataClass = _class;
        if ("className" in data) {
            dataClass = G.data[data.className];

            if (_class.isSubclassOf(dataClass)) {
                // Client has a specific subclass in mind
            } else {
                // Server has a specific subclass in mind
                G.assert(
                    dataClass.isSubclassOf(_class),
                    dataClass._dataType + " is not a subclass of " + _class._dataType
                );

                if (dataClass != _class) {
                    return dataClass.fromServer(data, instance);
                }
            }
        }

        var myDataDict = G.dataDict[_class._dataType];

        var d; // the G.Data object to return

        if (instance) {
            d = instance;
        } else {
            // The "true" argument tells the subclass's initializer
            // that the object is a mirror of server data.
            // Therefore the subclass should NOT default client-optional fields
            // to their initial values, but instead keep them null to show when
            // the server has chosen not to provide the optional data.
            d = new _class({}, true);
        }

        d._fromServer(data);

        // Now that we loaded the object, look at it's key.
        var key = d.key();

        if (key) {
            // Look at d's spot in G.dataDict.
            var dd = myDataDict[key];

            if (dd == d) {
                // We just updated the official copy of d.
            } else if (dd) {
                // It turns out that the new client-side object d refers to the same
                // server-side object as the existing client-side object dd.

                // We might still return d, but we'll update dd, and dd will stay
                // the client's official copy in G.dataDict.
                dd._fromServer(data);

                if (instance) {
                    // The same data object is going to have a copy in two memory locations.

                    if (instance instanceof G.data.User && instance.key() == G.user.key()) {
                        // OK to have separate reference for G.user's data
                    } else if (instance instanceof G.data.Image) {
                        // OK to have separate references to images
                    } else {
                        G.warn("Duplicate " + _class._dataType + " in G.dataDict with key " + key);
                    }
                } else {
                    // If we're not constricted to returning a reference to
                    // our instance param, then just retroactively change
                    // our return variable to point to the official copy.
                    d = dd;
                }
            } else {
                // Create the official version of an object with this key
                myDataDict[key] = d;

                // Copy a reference to the new object into all parent dataDicts.
                var higherClass = d._class.parent;
                while (higherClass != G.Data) {
                    G.dataDict[higherClass._dataType][key] = d;

                    higherClass = higherClass.parent;
                }
            }
        }

        return d;
    }
});
