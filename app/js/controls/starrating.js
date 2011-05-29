/*
 * Display/edit star rating control
*/

G.defineControl("StarRating", {
    _init: function(maxRating) {
        // Properties
        _this.createFields({
            "maxRating": maxRating || 5
        });

        // State
        _this.createFields({
            "rating": 0
        });

        _this.style({
            "highlightedStarImg": "starratings/orange_star.gif",
            "grayStarImg": "starratings/gray_star.gif"
        });

        _this.createField("events", ["rate"]);
    },

    _render: function() {
        var elems = _this.domElems;

        for (var i=0; i<_this.maxRating; i++) {
            _this.domRoot.append(
                elems["star" + i] = $("<div/>").css({
                    "float": "left"
                }).append(
                    elems["highlightedStar" + i] = G.util.$IMG(_this.style.highlightedStarImg),
                    elems["grayStar" + i] = G.util.$IMG(_this.style.grayStarImg)
                )
            );
        }

        $.extend(_this.render, {
            rating: function(rating) {
                if (rating === undefined) {
                    rating = _this.rating;
                }

                for(var i=0; i<_this.maxRating; i++) {
                    if(i+1 <= rating) {
                        elems["grayStar" + i].hide();
                        elems["highlightedStar" + i].show();
                    } else {
                        elems["highlightedStar" + i].hide();
                        elems["grayStar" + i].show();
                    }
                }
            },

            enabled: function() {
                for (var i=0; i<_this.maxRating; i++) {
                    elems["star" + i].css({
                        "cursor": "pointer"

                    }).bind("mouseover", _this.func(i, function(i) {
                        _this.render("rating", i + 1);

                    })).bind("mouseout", _this.func(function() {
                        _this.render("rating");

                    })).bind("mousedown", _this.func(i, function(i) {
                        if (_this.trigger("rate", i + 1)) {
                            _this.rating = i + 1;
                        }
                    }));
                }
            },

            disabled: function() {
                for(var i=0; i<_this.maxRating; i++) {
                    elems["star" + i].css({
                        "cursor": "default"
                    }).unbind("mouseover").unbind("mousedown").unbind("mouseout");
                }

                _this.render("rating");
            }
        });

        _this.render("rating");

        if (_this.enabled) {
            _this.render("enabled");
        } else {
            _this.render("disabled");
        }
    },

    setRating: function(rating) {
        _this.rating = rating;
        _this.render("rating");
    }
});
