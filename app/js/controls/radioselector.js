/*
 * Radio button selector
 *
 * Additional option fiels:
 *     tooltip
*/

G.defineControl("OptionSelector", "RadioSelector", {
    _init: function(options) {
        _super(options);

        // Properties
        _this.createFields({
            "rowSize": null, // Set to 1 for a vertical list
            "showButtons": true
        });

        _this.style({
            "spacing": 4,
            "verticalAlign": "middle",
            "normalStyle": {
                "font-weight": "",
                "color": ""
            },
            "selectedStyle": {},
            "normalBgStyle": {
                "padding-bottom": 2
            },
            "selectedBgStyle": {
                "padding-bottom": 2
            },
            "bgClass": null,
            "width": null
        });
    },

    _render: function() {
        var elems = _this.domElems;

        var cells = [];
        $.each(_this.options, function(i, option) {
            var radioButton = elems["radioButton" + i] = $(
                "<input type=\"radio\" name=\"" + _this._controlId + "\" />"

            ).attr({
                "checked": i == _this.selectedIndex,
                "disabled": option.enabled == false

            }).css({
                "margin": 0,
                "cursor": (option.enabled != false)? "pointer" : "",
                "position": _this.showButtons? "relative": "absolute",
                "top": 1,
                "visibility": _this.showButtons? "visible" : "hidden"

            }).click(_this.func(function() {
                if (_this.trigger("select", option.value, i)) {
                    if (_this.selectedIndex >= 0) {
                        elems["label" + _this.selectedIndex].css(
                            _this.style.normalStyle
                        );
                        elems["cell" + _this.selectedIndex].css(
                            _this.style.normalBgStyle
                        );
                    }
                    _this.selectedIndex = i;
                    elems["label" + _this.selectedIndex].css(
                        _this.style.selectedStyle
                    );
                    elems["cell" + _this.selectedIndex].css(
                        _this.style.selectedBgStyle
                    );

                    _this.trigger("selected", option.value);
                }
            }));

            cells.push(
                elems["cell" + i] = $TD().css(
                    _this.style.normalBgStyle
                ).append(
                    G.util.makeTable([
                        $TD().css({
                            "vertical-align": _this.style.verticalAlign,
                            "width": _this.showButtons? 16 : 1
                        }).append(
                            radioButton
                        ),
                        $TD().css({
                            "vertical-align": _this.style.verticalAlign,
                            "padding-top": _this.showButtons? 2 : 0,
                            "cursor": (option.enabled != false)? "pointer" : "",
                            "color": (option.enabled != false)? "black" : G.colors.gray
                        }).attr({
                            "title": option.tooltip || ""
                        }).append(
                            elems["label" + i] = $("<label/>").append(
                                $DIV().append(
                                    G.util.makeSpan(option.text)
                                )
                            ).css({
                            })
                        ).click(_this.func(function() {
                            if (option.enabled != false && _this.trigger("select", option.value, i)) {
                                if (_this.selectedIndex >= 0) {
                                    elems["label" + _this.selectedIndex].css(
                                        _this.style.normalStyle
                                    );
                                    elems["cell" + _this.selectedIndex].css(
                                        _this.style.normalBgStyle
                                    );
                                }
                                _this.selectedIndex = i;
                                elems["label" + _this.selectedIndex].css(
                                    _this.style.selectedStyle
                                );
                                elems["cell" + _this.selectedIndex].css(
                                    _this.style.selectedBgStyle
                                );
                                elems["radioButton" + _this.selectedIndex].attr({
                                    "checked": true
                                });

                                _this.trigger("selected", option.value);
                            }
                        }))
                    ]).css({
                        "width": _this.style.width
                    })
                )
            );

            if (i == _this.selectedIndex) {
                elems["label" + i].css(
                    _this.style.selectedStyle
                );
                elems["cell" + i].css(
                    _this.style.selectedBgStyle
                );
            } else {
                elems["label" + i].css(
                    _this.style.normalStyle
                );
                elems["cell" + i].css(
                    _this.style.normalBgStyle
                );
            }

            if (option.style) {
                elems["cell" + i].css(option.style);
            }

            if (_this.style.bgClass) {
                elems["cell" + i].addClass(_this.style.bgClass);
            }
        });

        _this.domRoot.append(
            elems.optionsTable = G.util.makeTable(cells, _this.rowSize || _this.options.length)
        );

    }
});
