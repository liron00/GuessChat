/*
 * OOP framework for JavaScript
*/

(function(){
    var globalContext = this;
    var extending = false;

    // The base Class implementation
    var BaseClass = globalContext.Class = function() {
        if (!extending) {
            throw "You may not create instances of the base class.";
        }
    };
    BaseClass.isClass = true;
    BaseClass.isSubclassOf = function(C) {
        return C == BaseClass;
    };

    // Create a new Class that inherits from this Class
    Class.extend = function(props, classProps) {
        props = props || {};
        classProps = classProps || {};

        var parentClass = this;

        // Instantiate a parent class (but only create the instance,
        // don't run the init constructor)
        extending =  true;
        var prototype = new parentClass();
        extending = false;

        // Copy the class props into the prototype on top of the parent class props
        for (var propName in props) {
            var oldProp = prototype[propName];

            prototype[propName] = props[propName];

            if (typeof props[propName] == "function" && typeof oldProp == "function") {
                // In order to implement the _super reference,
                // store parent class's raw function as a property of the child class's function.
                prototype[propName].superFunc = oldProp;

                // (Note that we might be building a chain of functions referencing parents,
                // one for each level of inheritance.)
            }
        }

        // Class constructor
        var Class = function() {
            var _this = this;

            if (!extending) {
                // Return an initialized instance with wrapped functions

                for (var propName in _this) {
                    if (typeof _this[propName] == "function") {

                        // Wrap every function in the newly created instance.

                        // Note that if the instance function were being called via a child's
                        // _super(), then we don't want to setThis, i.e. overwrite
                        // the _this variable from the child.
                        var makeInstanceFunc = function(funcName, func, setThis) {

                            var wrappedFunc = function() {
                                // Magically put _this and _super in the global context
                                // for the duration of the object method call
                                var oldThis = globalContext._this;
                                var oldSuper = globalContext._super;

                                if (setThis) {
                                    globalContext._this = _this;
                                }

                                globalContext._super = function() {
                                    if ("superFunc" in func) {
                                        // Surround the raw superFunc source code with wrapper code to
                                        // set up the correct behavior for its own _super calls.
                                        // (The correct behavior involves a recursive call to another
                                        // just-in-time wrap.)
                                        wrappedSuperFunc = makeInstanceFunc(funcName, func.superFunc, false);

                                        // Now call the newly wrapped func, keeping the global _this
                                        // variable pointing to the child instance (the one being
                                        // instantiated a few nested closures up).
                                        return wrappedSuperFunc.apply(_this, arguments);

                                    } else {
                                        G.error("The parent class has no instance function named '" + funcName + "'");
                                    }
                                };

                                // Note that when _super(*args) is called, the base class's code
                                // is run with _this properly pointing to the child instance.

                                // Always call an instance method with the instance as the context
                                var ret = func.apply(_this, arguments);

                                // Restore the old values of _this and _super
                                globalContext._this = oldThis;
                                globalContext._super = oldSuper;

                                // Make all instance methods return the instance by default.
                                // Enables method chaining, i.e. obj.method1().method2()
                                if (ret === undefined) {
                                    return _this;
                                } else {
                                    return ret;
                                }
                            };

                            // Store a reference to the source function
                            // for easy debugging
                            wrappedFunc.source = func;

                            return wrappedFunc;

                        };

                        _this[propName] = makeInstanceFunc(propName, _this[propName], true);
                    }
                }

                // Make instances reference their class
                _this._class = _this.constructor = Class;

                // All construction is done in the init method
                if (_this.init) {
                    _this.init.apply(_this, arguments);
                }
            }
        };

        // Parent class
        Class.parent = parentClass;

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Make this class extendable
        Class.extend = arguments.callee;

        // Make this JS object identifiable as a Class
        Class.isClass = true;

        Class.isSubclassOf = function(C) {
            G.assert(C.isClass);

            // Keep following parent references until
            // we get to BaseClass or C

            if (Class == C) {
                return true;
            } else if (Class == BaseClass) {
                return false;
            } else {
                return Class.parent.isSubclassOf(C);
            }
        };

        // Implicitly define all the parent's class functions as child class functions
        // (except for the ones that are explicitly overridden)
        for (var parentPropName in Class.parent) {
            var parentProp = Class.parent[parentPropName];

            if (parentProp.isClassFunc && !(parentPropName in classProps)) {
                classProps[parentPropName] = function() {
                    // The child class gets a separate function with a call to _super
                    // so that the parent function will be invoked with the right value
                    // for _class
                    return _super.apply(Class, arguments);
                };
            }
        }

        // Add the class props as properties of the object representing the Class
        for (propName in classProps) {
            if (typeof classProps[propName] == "function") {

                // Wrap class functions to set up their _class and _super variables.
                // But if class function is being called asSuper, i.e. via its child
                // class's _super(), then we don't want to setClass, i.e. overwrite
                // the _class variable from the child.
                var makeClassFunc = function(funcName, func, setClass) {

                    var wrappedFunc = function() {
                        // Magically put _class and _super in the global context
                        // for the duration of the class method call.
                        var oldClass = globalContext._class;
                        var oldSuper = globalContext._super;

                        if (setClass) {
                            globalContext._class = Class;
                        }

                        if (funcName in Class.parent && Class.parent[funcName].isClassFunc) {
                            globalContext._super = Class.parent[funcName].asSuper;
                        } else {
                            globalContext._super = function() {
                                G.error("The parent class has no class function named '" + funcName + "'");
                            }
                        }

                        // Note that when _super(*args) is called, the base class's code
                        // is run with _class properly pointing to the child class.

                        var ret = func.apply(Class, arguments);

                        // Restore the old values of _class and _super
                        globalContext._class = oldClass;
                        globalContext._super = oldSuper;

                        return ret;
                    };

                    // Store a reference to the source function
                    // for easy debugging
                    wrappedFunc.source = func;

                    return wrappedFunc;

                };

                Class[propName] = makeClassFunc(propName, classProps[propName], true);
                Class[propName].asSuper = makeClassFunc(propName, classProps[propName], false);

                // Record that this class object field is meant to be a class function
                Class[propName].isClassFunc = true;

            } else {
                Class[propName] = classProps[propName];
            }
        }

        return Class;
    };
})();
