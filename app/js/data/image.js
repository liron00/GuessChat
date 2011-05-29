/*
 * Image
*/

G.defineData("Image", {
    _init: function() {
        _this.createFields({
            "id": Number(),

            // Manually set image path,
            // usually for images that don't
            // exist on the server
            "path": String()
        });
    },

    _fromServer: function(data) {
        _this.set("id", data.id);
    },

    isValid: function() {
        return !!(_this.id || _this.path);
    },

    getPath: function() {
        if (_this.path) {
            return G.util.imgPath(_this.path);
        } else if (_this.id) {
            return G.util.imgPath(_this.id);
        } else {
            return null;
        }
    },

    makeImg: function() {
        if (_this.exists()) {
            return G.util.$IMG(_this.getPath()).css({
                "border": "1px solid #999"
            });
        } else {
            return $SPAN().css({
                "font-style": "italic"
            }).text("no image");
        }
    }
}, {
    fromPath: function(path) {
        return new _class({
            "path": path
        });
    }
});
