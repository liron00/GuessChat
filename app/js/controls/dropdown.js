/*
 * Smart drop down
*/

G.defineControl("OptionSelector", "DropDown", {
    _init: function(options) {
        _super(options);

        if (_this.options.length) {
            _this.set("selectedIndex", 0);
        }

        _this.createFields({
            "label": ""
        });

        _this.style({
            "width": null
        })
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.css({
            "display": "inline"
        }).append(
            elems.dropDown = $("<select/>")
        );

        if (_this.style.width) {
            elems.dropDown.css({
                "width": _this.style.width
            });
        }

        $.each(_this.options, function(i, option) {
            var optionElem = $("<option value=\"" + i + "\" />").attr({
                "selected": i == _this.selectedIndex
            }).text(option.text);

            elems.dropDown.append(optionElem);
        });

        elems.dropDown.bind("change", _this.func(function() {
            var optionIndex = parseInt($(this).val());
            var option = _this.options[optionIndex];

            _this.selectedIndex = optionIndex;
            _this.trigger("select", option.value);
        }));

        if (_this.label) {
            _this.domRoot.prepend(
                $("<label/>").attr("for", _this.makeElemId("dropDown")).append(
                    G.util.makeSpan(_this.label).css({
                        "color": G.colors.gray
                    })
                ),
                $BR()
            );
        }

        $.extend(_this.render, {
            enabled: function() {
                elems.dropDown.attr("disabled", false);
            },

            disabled: function() {
                elems.dropDown.attr("disabled", true);
            },

            focus: function() {
                elems.dropDown.focus();
            }
        });

        if (!_this.enabled) {
            _this.render("disabled");
        }
    },

    focus: function() {
        _this.render("focus");
    }
});
