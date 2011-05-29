/*
 * Slider
 * (wraps jQuery.ui.slider)
*/

G.defineControl("Slider", {
    _init: function() {
        _this.jqSlider = $DIV();

        // Properties
        _this.createFields({
            "min": 0,
            "max": 100,
            "uiMin": null, // can't drag slider lower than this value
            "uiMax": null, // can't drag slider higher than this value
            "range": "min",
            "minCaption": "",
            "maxCaption": "",
            "orientation": "horizontal",
            "animate": false,
            "showValue": true, // show current value on slider handle
            "valueLabelFunc": function(value) {return value;},
            "showHandle": true
        });

        // State
        _this.createFields({
            "value": null
        });

        _this.style({
            "width": 100,
            "height": 10,
            "color": "#FFF",
            "handleWidth": null,
            "handleBackground": ""
        });

        _this.createField("events", ["change"]);
    },

    _render: function() {
        var elems = _this.domElems;

        elems.sliderContainer = $DIV().css({
            "float": "left",
            "font-size": 11,
            "color": "#777",
            "height": _this.style.height,
            "margin": "0"
        }).append(
            $DIV().text(_this.minCaption).css({
                "float": "left",
                "cursor": "pointer",
                "position": "relative",
                "top": (_this.style.height - 10)/2
            }).click(_this.func(function() {
                _this.setValue(_this.min);
                _this.trigger("change", _this.min);
            })),
            elems.slider = _this.jqSlider.empty().css({
                "float": "left",
                "width": _this.style.width,
                "height": _this.style.height,
                "margin-top": 2,
                "margin-left": _this.minCaption? 14 : 0,
                "margin-right": _this.maxCaption? 14 : 0
            }).slider({
                "animate": _this.animate,
                "min": _this.min,
                "max": _this.max,
                "range": _this.range,
                "orientation": "horizontal",
                "change": _this.func(function(event, ui) {
                    _this.value = $(this).slider("value");
                    _this.trigger("change", _this.value);
                }),
                "start": _this.func(function(event, ui) {
                    _this.render("value");
                }),
                "slide": _this.func(function(event, ui) {
                    if (
                        (_this.uiMin != null && ui.value < _this.uiMin) ||
                        (_this.uiMax != null && ui.value > _this.uiMax)
                    ) {
                        return false;
                    }

                    _this.render("value", ui.value);
                })
            }),
            $DIV().text(_this.maxCaption).css({
                "float": "left",
                "cursor": "pointer",
                "position": "relative",
                "top": (_this.style.height - 10)/2
            }).click(_this.func(function() {
                _this.setValue(_this.max);
                _this.trigger("change", _this.max);
            })),
            $DIV().css("clear","both")
        )

        _this.domRoot.append(
            elems.sliderContainer,
            $DIV().css("clear","both")
        );

        // Overlay div for disabling the UI
        var disablerWidth = _this.style.width + (_this.minCaption?100:10) + (_this.maxCaption?100:10);
        elems.disabler = $DIV().css({
            "position": "absolute",
            "margin-top": -_this.style.height - 8,
            "margin-left": (_this.minCaption?-100:-10),
            "background-color": "#FFF",
            "width": disablerWidth,
            "height": _this.style.height + 16,
            "opacity": 0,
            "z-index": 100
        });

        elems.slider.find(".ui-slider-handle").css({
            "border-color": _this.enabled? "" : "#CCC",
            "width": _this.style.handleWidth || 28,
            "background": _this.enabled? _this.style.handleBackground : "#FFF",
            "font-weight": "bold",
            "font-size": 14,
            "text-align": "center",
            "margin-top": -1,
            "margin-left": 2 - (_this.style.handleWidth || 28)
        });
        elems.slider.find(".ui-slider-range").css({
            "background": _this.enabled?"":"#CCC"
        });

        if (!_this.showHandle) {
            elems.slider.find(".ui-slider-handle").hide();
        }

        if (_this.enabled) {
            elems.slider.find(".ui-slider-handle").css({
                "color": "#FFF",
                "text-decoration": "none"
            });
        } else {
            elems.sliderContainer.append(elems.disabler);

            elems.slider.find(".ui-slider-handle").css({
                "color": "#000",
                "text-decoration": "none",
                "cursor": "default"
            });
        }

        $.extend(_this.render, {
            "value": function(value) {
                if (value == null) {
                    value = _this.value;
                }

                if (_this.showValue) {
                    elems.slider.find(".ui-slider-handle").text(
                        _this.valueLabelFunc(value)
                    );
                }
            }
        });

        _this.setValue(_this.value);
    },

    setValue: function(value) {
        if (value == null) {
            value = _this.min;
        }

        if (_this.uiMin != null && value < _this.uiMin) {
            value = _this.uiMin;
        } else if (_this.uiMax != null && value >= _this.uiMax) {
            value = _this.uiMax;
        }

        _this.value = value;
        _this.jqSlider.slider("option", "value", value);
        _this.render("value");
    }
});
