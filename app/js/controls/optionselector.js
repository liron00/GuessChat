/*
 * Base class for option selector controls
 *
 * Child classes should provide methods:
 *   _render():
 *     - Renders the control
 *     - Sets up a trigger for the "select" event
*/

G.defineControl("OptionSelector", {
    _init: function(options) {
        /*
         * options: [{
         *     "value": ...,
         *     "text": ...,
         *     "enabled": (default)true|false
         * }, ...]
        */

        // Properties
        _this.createFields({
            "options": options || []
        });

        // State
        _this.createFields({
        });

        _this.createFields({
            "selectedIndex": -1
        });

        _this.createEvents("select", "selected");
    },

    getValue: function() {
        if (_this.selectedIndex >= 0) {
            var value = _this.options[_this.selectedIndex].value;

            // This is because control instance functions must not return undefined
            G.assert(value !== undefined, _this.toString() + " option values must not be undefined.");

            return value;
        } else {
            return null;
        }
    },

    setValue: function(value) {
        var index = _this.indexOf(value);

        if (index >= 0) {
            _this.selectedIndex = index;
            if (_this.isRendered) {
                _this.render();
            }
        }
    },

    clearValue: function() {
        _this.selectedIndex = -1;
        if (_this.isRendered) {
            _this.render()
        }
    },

    indexOf: function(value) {
        var index = -1;
        $.each(_this.options, function(i, option) {
            if (G.util.equal(option.value, value)) {
                index = i;
                return false;
            }
        });
        return index;
    }
});
