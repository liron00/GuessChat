/*
 * Checkbox List
*/

G.defineControl("CheckboxList", {
    _init: function(items) {
        /* items: [{
         *   "value": ...
         *   "text": ...
         *   "checked": [true|false],
         *   "enabled": [(default)true|false]
         * }, ...]
        */

        // Properties
        _this.createFields({
            "items": items,

            "showSelectAll": false,
            "showClearAll": false,
            "showOnly": false
        });

        // State
        _this.createFields({
        });

        _this.style({
            "rowSize": 1,
            "itemStyle": {
                "padding": "0 8px 0 2px"
            },
            "itemSelectedStyle": {
                "padding": "0 8px 0 2px"
            }
        });

        _this.createField("controls", {
            "checkboxes": []
        });

        _this.createEvents("change", "selectAll", "clearAll");
    },

    _render: function() {
        var elems = _this.domElems;

        var triggerAll = _this.func(function() {
            $.each(_this.items, function(i, item) {
                _this.trigger("change", item.value, item.checked);
            });
        });

        _this.domRoot.append(
            elems.manageAllSection = $DIV().css({
                "font-size": 12,
                "margin-bottom": 2
            }).append(
                elems.selectAllSection = $SPAN().append(
                    G.util.makeLink("Select All", _this.func(function() {
                        _this.selectAll();

                        if ("selectAll" in _this._eventHandlers) {
                            _this.trigger("selectAll");
                        } else {
                            triggerAll();
                        }
                    })).css(_this.style.itemStyle)
                ),
                elems.selectAllSeparator = G.util.nbSpan("   |   ").css("color", G.colors.gray),
                elems.clearAllSection = $SPAN().append(
                    G.util.makeLink("Clear", _this.func(function() {
                        _this.clearAll();

                        if ("clearAll" in _this._eventHandlers) {
                            _this.trigger("clearAll");
                        } else {
                            triggerAll();
                        }
                    })).css(_this.style.itemStyle)
                )
            ),
            elems.checkboxesSection = $DIV(),
            elems.valMsg = $DIV().css({
                "color": "red",
                "font-size": 11,
                "font-weight": "bold"
            }).hide()
        );

        if (_this.items.length > 0) {
            if (!_this.showSelectAll) {
                elems.selectAllSection.hide();
            }
            if (!_this.showClearAll) {
                elems.clearAllSection.hide();
            }
            if (!_this.showSelectAll || !_this.showClearAll) {
                elems.selectAllSeparator.hide();
            }
        } else {
            elems.manageAllSection.hide();
        }

        _this.controls.checkboxes = [];
        var checkboxCells = [];
        $.each(_this.items, function(i, item) {
            var addendum = null;
            if (_this.showOnly) {
                addendum = $SPAN().css({
                    "position": "relative",
                    "top": -2
                }).append(
                    G.util.nbSpan(" "),
                    G.util.makeLink("only", _this.func(function() {
                        _this.clearAll();
                        if ("clearAll" in _this._eventHandlers) {
                            _this.trigger("clearAll");
                        }
                        if (_this.trigger("change", item.value, true)) {
                            _this.items[i].checked = true;
                            _this.controls.checkboxes[i].check();
                        }
                    })).css({
                        "font-size": 12,
                        "text-decoration": "underline",
                        "vertical-align": "text-top"
                    })
                );
            }

            var checkbox = new G.controls.Checkbox(item.text).set({
                "checked": item.checked,
                "enabled": item.enabled != false,
                "addendum": (item.enabled == false)? null : addendum
            }).style({
                "normalStyle": _this.style.itemStyle,
                "selectedStyle": _this.style.itemSelectedStyle
            }).bind({
                "change": _this.func(function(checked) {
                    _this.render("hideValMsg");

                    var oldCheckValue = item.checked;
                    item.checked = checked;
                    if (!_this.trigger("change", item.value, checked)) {
                        item.checked = oldCheckValue;
                        return false;
                    }
                })
            });
            checkboxCells.push(
                $TD().append(
                    checkbox.renderHere()
                )
            );
        });

        elems.checkboxesSection.append(
            G.util.makeTable(checkboxCells, _this.style.rowSize).attr({
                "cellpadding": 2
            })
        );

        $.extend(_this.render, {
            enabled: function() {
                $.each(_this.controls.checkboxes, function(i, checkbox) {
                    if (_this.items[i].enabled != false) {
                        checkbox.enable();
                    } else {
                        checkbox.disable();
                    }
                });
            },

            disabled: function() {
                $.each(_this.controls.checkboxes, function(i, checkbox) {
                    checkbox.disable();
                });
            },

            showValMsg: function(msg) {
                elems.valMsg.empty().show().append(
                    G.util.makeSpan(msg)
                )
            },

            hideValMsg: function() {
                elems.valMsg.hide()
            }
        });

        if (_this.enabled) {
            _this.render("enabled");
        } else {
            _this.render("disabled");
        }
    },

    getByValue: function(value) {
        var index = _this.indexOf(value);
        if (index == -1) {
            return null;
        } else {
            return _this.items[index];
        }
    },

    selectAll: function(includeDisabled) {
        _this.setAll(true);
    },

    clearAll: function(includeDisabled) {
        _this.setAll(false);
    },

    setAll: function(checked, includeDisabled) {
        $.each(_this.items, function(i, item) {
            if (item.enabled != false || includeDisabled) {
                _this.setByIndex(i, checked);
            }
        });
    },

    setByIndex: function(index, checked) {
        var item = _this.items[index];
        var checkbox = _this.controls.checkboxes[index];
        item.checked = checked;
        checkbox.setValue(checked);
    },

    setByValue: function(value, checked) {
        $.each(_this.items, function(i, item) {
            if (item.value == value) {
                _this.setByIndex(i, checked);
            }
        });
    },

    indexOf: function(value) {
        var index = -1;
        $.each(_this.items, function(i, item) {
            if (item.value == value) {
                index = i;
                return false;
            }
        });
        return index;
    },

    getValidInput: function() {
        var selectedValues = [];
        $.each(_this.items, function(i, item) {
            if (item.checked) {
                selectedValues.push(item.value);
            }
        });
        return selectedValues;
    },

    showValMsg: function(msg) {
        _this.render("showValMsg", msg);
    }
});
