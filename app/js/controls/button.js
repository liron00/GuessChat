G.defineControl("Button", {
    _init: function() {
        // Properties
        _this.createFields({
            "text": "",
            "disabledText": null, //can be a SPAN
            "big": true
        });

        //State
        _this.createFields({
        });

        _this.style({
            "width": null,
            "height": null,
            "round": true,
            "fontSize": null,
            "padding": 4,
            "margin": null
        });

        _this.createField("events", ["click", "mouseOver", "mouseDown", "mouseOut"]);
    },

    _render: function() {
        var elems = _this.domElems;

        var fontSize = _this.style.fontSize || (_this.big? 16 : 11);
        var height = _this.style.height? _this.style.height - 2 : (_this.big? 20 : 12);

        _this.domRoot.append(
            elems.button = $CENTER(),
            $DIV().css("clear","both"),
            elems.valMsg = $DIV().css({
                "margin-top": 4,
                "color": "red",
                "font-size": 11,
                "font-weight": "bold"
            }).hide()
        );

        elems.button.addClass("ui-state-default").css({
            "min-width": _this.style.width? _this.style.width - 2 : "",
            "font-size": fontSize,
            "float": "left" // floating autosets width if _this.width == null

        }).append(
            elems.buttonTable = G.util.makeOneCellTable(
                elems.buttonContents = $DIV().css({
                    "font-size": fontSize,
                    "padding": _this.style.padding
                })
            ).css({
                "margin-left": (_this.style.margin!=null)? _this.style.margin : 8,
                "margin-right": (_this.style.margin!=null)? _this.style.margin : 8,
                "text-align": "center",
                "height": height
            })
        ).hover(
            _this.func(function() {
                if (_this.enabled) {
                    _this.trigger("mouseOver");
                }
            }),
            _this.func(function() {
                if (_this.enabled) {
                    _this.render("normal");
                    _this.trigger("mouseOut");
                }
            })

        ).mousedown(_this.func(function(e) {
            if (e.button == 2) {
                // Browsers disagree on mouse button codes,
                // but all use 2 for right click, so ignore
                // that.
                return false;
            }

            if (_this.enabled) {
                _this.render("pressed");
                _this.trigger("mouseDown", e);
            }

            // This prevents button clicks from
            // selecting the caption and ruining
            // the effect
            return false;

        })).mouseup(_this.func(function(e) {
            _this.render("hideValMsg");

            if (_this.enabled) {
                _this.render("normal");
                _this.trigger("click", e);
            }

        })).bind(
            // This prevents button clicks from
            // selecting the caption and ruining
            // the effect
            "selectstart", G.util.constantFunc(false)
        );

        if (_this.style.round) {
            elems.button.addClass("ui-corner-all");
        }

        $.extend(_this.render, {
            normal: function() {
                elems.button.css("opacity", 1);
                elems.button.removeClass("ui-state-hover");
            },

            hover: function() {
                elems.button.css("opacity", 1);
            },

            pressed: function() {
                elems.button.css("opacity", 1);
                elems.button.addClass("ui-state-hover");
            },

            enabled: function() {
                elems.button.css({
                    "opacity": 1,
                    "cursor": "pointer"
                });

                var textHtml = G.util.makeSpan(_this.text).html();
                elems.buttonContents.html(textHtml);
            },

            disabled: function() {
                elems.button.css({
                    "opacity": 0.5,
                    "cursor": "default"
                });

                var disabledText = _this.disabledText != null? _this.disabledText : _this.text;
                var disabledTextHtml = G.util.makeSpan(disabledText).html();
                elems.buttonContents.html(disabledTextHtml);
            },

            showValMsg: function(msg, doFlash) {
                elems.valMsg.empty().show().append(
                    G.util.makeSpan(msg)
                );

                if (doFlash != false) {
                    // Quickly disable and enable
                    _this.render("disabled", _this.text);

                    setTimeout(_this.func(function() {
                        if (_this.enabled) {
                            _this.render("enabled");
                        }
                    }), 500);
                }
            },

            hideValMsg: function() {
                elems.valMsg.hide();
            }
        });

        _this.render("normal");

        if (_this.enabled) {
            _this.render("enabled");
        } else {
            _this.render("disabled");
        }
    },

    showValMsg: function(msg) {
        // Show a red message under the textbox
        // (useful for validation failures)
        _this.render("showValMsg", msg);
    }
});
