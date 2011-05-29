/*
 * Check box
*/

G.defineControl("Checkbox", {
    _init: function(text) {
        // Properties
        _this.createFields({
            "text": text,
            "addendum": null,
            "checked": false
        });

        // State
        _this.createFields({
        });

        _this.style({
            "font-size": 12,
            "normalStyle": {
                "color": "",
                "font-weight": "normal"
            },
            "selectedStyle": {
            }
        });

        _this.createEvents("change");
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.css({
        }).append(
            G.util.makeTable([
                $TD().css({
                }).append(
                    elems.inputCheckbox = $("<input type=\"checkbox\" />").attr({
                        "id": "element_" + _this._controlId + "_inputCheckbox",
                        "checked": _this.checked
                    }).click(_this.func(function() {
                        if (_this.trigger("change", this.checked)) {
                            _this.checked = this.checked;
                            if (_this.checked) {
                                _this.render("checked");
                            } else {
                                _this.render("unchecked");
                            }
                        } else {
                            return false;
                        }
                    }))
                ),
                $TD().css({
                }).append(
                    elems.labelSection = $DIV()
                )
            ])
        );

        if (_this.text) {
            elems.labelSection.append(
                elems.label = $("<label/>").attr({
                    "for": _this.makeElemId("inputCheckbox")
                }).css({
                    "position": "relative",
                    "top": -2
                }).css(
                    _this.styles
                ).append(
                    G.util.makeSpan(_this.text)
                )
            );

            if (_this.addendum) {
                _this.domRoot.append(_this.addendum);
            }
        }

        $.extend(_this.render, {
            enabled: function() {
                elems.inputCheckbox.attr("disabled", false).css({
                    "cursor": "pointer"
                });
                if (_this.text) {
                    elems.label.css({
                        "cursor": "pointer",
                        "color": ""
                    });
                }
                if (_this.checked) {
                    _this.render("checked");
                } else {
                    _this.render("unchecked");
                }
            },

            disabled: function() {
                elems.inputCheckbox.attr("disabled", true).css({
                    "cursor": "default"
                });
                if (_this.text) {
                    elems.label.css({
                        "cursor": "default",
                        "color": "#666"
                    });
                }
            },

            checked: function() {
                elems.inputCheckbox.attr("checked", true);
                if (_this.text) {
                    elems.label.css(_this.style.selectedStyle);
                }
            },

            unchecked: function() {
                elems.inputCheckbox.attr("checked", false);
                if (_this.text) {
                    elems.label.css(_this.style.normalStyle);
                }
            }
        });

        if (_this.enabled) {
            _this.render("enabled");
        } else {
            _this.render("disabled");
        }
    },

    check: function() {
        _this.checked = true;
        _this.render("checked");
    },

    uncheck: function() {
        _this.checked = false;
        _this.render("unchecked");
    },

    setValue: function(value) {
        if (value) {
            _this.check();
        } else {
            _this.uncheck();
        }
    }
});
