/*
 * UI control base class for G
 *
 * Dependencies: jQuery, class.js, util.js
*/

G.controls = {}; // Classes that extend G.Control
G._controlInstances = [];
G.controlDict = {}; // Dict of dicts of control instances by controlId

// Shorthand for debugging
G.c = G.controlDict;
G.ci = G._controlInstances;

// This is in order to allow calling G.defineControl in any order,
// i.e. subclasses can be defined before their parents.
//
// G._pendingControlDefinitions = {
//     baseClassName: [{
//         "name": ...,
//         "props": ...,
//         "classProps": ...
//     }, ...],
//     ...
// }
G._pendingControlDefinitions = {};

G.defineControl = function(name, props, classProps) {
    var baseClassName;
    var baseClass = G.Control;

    if (typeof arguments[1] == "string") {
        // Alternate syntax for control classes that inherit from other control classes:
        //   G.defineControl(baseClassName, name, props, classProps)

        baseClassName = arguments[0];
        name = arguments[1];
        props = arguments[2];
        classProps = arguments[3];

        baseClass = G.controls[baseClassName];
    }

    props = props || {};
    props._controlName = name;

    classProps = classProps || {};
    classProps._controlName = name;

    if (baseClass) {
        G.controls[name] = baseClass.extend(props, classProps);
    } else {
        G.util.setDefault(G._pendingControlDefinitions, baseClassName, []).push({
            "name": name,
            "props": props,
            "classProps": classProps
        });
    }
};

$(function() {
    // On page load, define the pending classes in an order
    // that respects class dependencies

    var doAnotherPass = true;

    while (doAnotherPass && !G.util.objIsEmpty(G._pendingControlDefinitions)) {
        doAnotherPass = false;

        var pending = $.extend({}, G._pendingControlDefinitions);

        $.each(pending, function(baseClassName, argLists) {
            if (baseClassName in G.controls) {
                // Parent class has been defined, so define child classes
                $.each(argLists, function(i, args) {
                    G.controls[args.name] = G.controls[baseClassName].extend(args.props, args.classProps);
                });

                // And delete parent class from the queue
                delete G._pendingControlDefinitions[baseClassName];

                doAnotherPass = true;
            }
        });
    }

    G.assert(
        G.util.objIsEmpty(G._pendingControlDefinitions),
        "There is a problem with the G.controls class inheritance graph"
    );
});

G.Control = Class.extend({
    init: function() {
        _this._controlId = G._controlInstances.length;
        G._controlInstances.push(_this);

        G.util.setDefault(G.controlDict, _this._controlName, {})[_this._controlId] = _this;

        _this.containers = null; // jQuery collection of elements into which this renders
        _this.domRoot = $DIV(); // The control's DOM tree renders into here
        _this.domElems = {}; // jQuery objects in the control's DOM tree

        // State variables for all controls
        _this.isRendered = false;
        _this.visible = true; // when not visible, calls to sub-render function are no-ops
        _this.enabled = true;

        // Style attributes
        _this.styles = {};

        // Functions that get triggered by control events
        _this._eventHandlers = {};

        if (_this._init) {
            _this._init.apply(_this, arguments);
        }
    },

    createField: function(fieldName, value) {
        // Creates object fields

        G.assert(typeof fieldName == "string", "Cannot create field " + fieldName + " in " + _this.toString());
        G.assert(!(fieldName in _this), "Field '" + fieldName + "' already exists in " + _this.toString());
        _this[fieldName] = value;
    },

    createFields: function(fields) {
        G.assert(typeof fields == "object", "Bad input to createFields: " + fields);
        $.each(fields, function(fieldName, value) {
            G.assert(!(fieldName in _this), "Field '" + fieldName + "' already exists in " + _this.toString());
            _this[fieldName] = value;
        });
    },

    get: function(fieldName, defaultValue) {
        // Wrapper for getting an object field while asserting that it exists

        if (_this[fieldName] == null) {
            // Require a defaultValue
            G.assert(arguments.length > 1, _this._dataType + "." + fieldName + " is null/undefined and no defaultValue was passed to get().");
            return defaultValue;

        } else {
            return _this[fieldName];
        }
    },

    set: function(fields) {
        // Updates the values of a control object's fields

        if (typeof fields == "string") {
            var fieldsDict = {};
            fieldsDict[arguments[0]] = arguments[1];
            return _this.set(fieldsDict);
        }

        $.each(fields, function(fieldName, field) {
            if (("_set_" + fieldName) in _this) {
                // Use control's setter method
                _this["_set_" + fieldName](field);
            } else {
                G.assert(fieldName in _this, "Field '" + fieldName + "' does not exist in " + _this.toString());
                _this[fieldName] = field;
            }
        });
    },

    style: function(fields) {
        // Updates the values of a control object's style attributes

        if (typeof fields == "string") {
            var fieldsDict = {};
            fieldsDict[arguments[0]] = arguments[1];
            return _this.style(fieldsDict);
        }

        G.util.deepExtend(_this.style, fields); // For writing _this.style.x
        G.util.deepExtend(_this.styles, fields); // For writing elem.css(_this.styles)
    },

    createEvents: function() {
        // Declare names of supported events

        if (!_this.events) {
            _this.events = [];
        }

        $.each(arguments, function(i, arg) {
            G.assert($.inArray(arg, _this.events) == -1, "Event '" + arg + "' is already created for " + _this.toString());
            _this.events.push(arg);
        });
    },

    bind: function(events, func) {
        // Bind event handlers to a control

        if (typeof events == "string") {
            var fieldsDict = {};
            fieldsDict[arguments[0]] = arguments[1];
            return _this.bind(fieldsDict);
        }

        G.assert(_this.events, _this.toString() + " does not support events.");

        $.each(events, function(eventName, handler) {
            G.assert($.inArray(eventName, _this.events) >= 0, "'" + eventName + "' is not a supported event for " + _this.toString());

            _this._eventHandlers[eventName] = handler;
        });
    },

    unbind: function(eventName) {
        // Unbind an event handler

        G.assert(_this.events, _this.toString() + " does not support events.");

        if (_this._eventHandlers[eventName]) {
            delete _this._eventHandlers[eventName];
        }
    },

    render: function() {
        // Renders a DOM tree containing the control's UI into _this.domRoot.
        // If _this.domRoot is not attached to the document's DOM tree, it will function like a frame buffer.
        // NOTE: The control needs to have a _render() method for this render() method to work.

        if (!_this.visible) {
            return;
        }

        if (arguments.length == 0) {
            // Do a full render

            var reuseContainer = _this.containers && _this.containers.size() == 1 && _this.containers[0] == _this.domRoot.parent()[0];

            if (_this.isRendered) {
                var tempHeight = parseFloat(_this.domRoot.css("height")) + 0.01;
                if (reuseContainer && !isNaN(tempHeight)) {
                    // Keep domRoot rendered into its container so the container isn't
                    // temporarily empty (which can cause scrolling)
                    _this.domRoot.css("height", tempHeight + "px");
                } else {
                    _this.domRoot.remove();
                }
                _this.cleanup();
            }
            _this.domElems = {};

            _this.isRendered = true;
            _this._render();

            if (_this.containers) {
                if (_this.containers.size() == 1) {
                    _this.idElements();
                    if (reuseContainer && !isNaN(tempHeight)) {
                        if (_this.domRoot.css("height") == tempHeight + "px") {
                            _this.domRoot.css("height", "");
                        }
                    } else {
                        _this.containers.append(_this.domRoot);
                    }
                } else {
                    // Only some controls support multi-container rendering
                    _this.containers.each(function(i, c) {
                        var container = $(c);
                        var domRootCopy = _this.domRoot.clone(true);
                        container.empty().append(domRootCopy);
                    });
                }
            }

        } else {
            // Render part of the control's UI to create or manifest
            // a state update.
            // NOTE: The control must have a _this.render[arguments[0]] function.

            if (!(_this.isRendered)) {
                return;

            } else {
                var funcName = arguments[0];
                G.assert(funcName in _this.render, _this._controlName + ".render." + funcName + " does not exist.");

                var args = [];
                for (var j=1; j<arguments.length; j++) {
                    args.push(arguments[j]);
                }

                _this.render[funcName].apply(_this, args);
            }
        }
    },

    idElements: function(containerIndex) {
        // Set the ID attributes for the control's rendered DOM elements.
        // This is supposed to be just for debugging purposes.

        var containerSuffix = containerIndex? ("_" + containerIndex) : "";

        _this.domRoot.attr("id", "domroot_" + _this._controlId + "_" + _this._controlName + containerSuffix);

        $.each(_this.domElems, function(elemName, element) {
            if ((element instanceof $) && element.size() == 1 && !element.attr("id")) {
                element.attr("id", _this.makeElemId(elemName, containerIndex));
            }
        });
    },

    makeElemId: function(elemName, containerIndex) {
        var containerSuffix = containerIndex? ("_" + containerIndex) : "";
        return "element_" + _this._controlId + "_" + elemName + containerSuffix;
    },

    getElemName: function(elemId) {
        return elemId.substring(("element_" + _this._controlId + "_").length);
    },

    renderTo: function(containers) {
        // Renders the control's DOM tree into the specified container.

        _this.containers = containers;
        _this.render();
    },

    renderHere: function() {
        // Returns a DOM element with the control rendered into it

        var newContainer = $DIV();
        _this.renderTo(newContainer);
        return newContainer;
    },

    trigger: function(eventName, arg1, arg2, etc) {
        // Checks if a handler function for eventName has been bound to the control.
        // If so, call it. If the handler function returns false, pass that along.

        G.assert(_this.events, _this.toString() + " does not support events.");
        G.assert($.inArray(eventName, _this.events) >= 0, eventName + "' is not a supported event for " + _this.toString());

        var handler = _this._eventHandlers[eventName];

        var handlerReturn;
        var args = [];
        for (var j=1; j<arguments.length; j++) {
            args.push(arguments[j]);
        }
        if (handler) {
            handlerReturn = handler.apply(_this, args);
        }
        return (handlerReturn === undefined)? true : handlerReturn;
    },

    show: function() {
        if (!(_this.isRendered && _this.visible)) {
            _this.visible = true;
            _this.render.apply(_this, []);
            _this.domRoot.show.apply(_this.domRoot, arguments);
        }
    },

    hide: function() {
        if (_this.isRendered && _this.visible) {
            _this.visible = false;
            _this.domRoot.hide.apply(_this.domRoot, arguments);
            _this.cleanup();
        }
    },

    enable: function() {
        if (!_this.enabled) {
            _this.enabled = true;

            if ("enabled" in _this.render) {
                _this.render("enabled");
            } else {
                _this.render();
            }
        }
    },

    disable: function() {
        if (_this.enabled) {
            _this.enabled = false;

            if ("disabled" in _this.render) {
                _this.render("disabled");
            } else {
                _this.render();
            }
        }
    },

    focus: function() {
        // Child classes should override this and set focus to
        // the most prominent part of the rendered control.
        return;
    },

    cleanup: function() {
        _this.domRoot.empty();

        // In case some elements are not attached to _this.domRoot,
        // the instance's _cleanup function should delete them.
        if (_this._cleanup) {
            _this._cleanup();
        }
        G.util.deepApply(_this.controls || {}, function(control) {
            if (control) {
                if (control._cleanup) {
                    control._cleanup();
                }
            }
        })
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

    toString: function() {
        return _this._controlName + " #" + _this._controlId;
    }
});
