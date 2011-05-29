/*
 * Expandable/collapsable section
*/

G.defineControl("Expandable", {
    _init: function(header, contents) {
        // Properties
        _this.createFields({
            "expandedHeader": header,
            "collapsedHeader": header,
            "contents": G.util.makeDiv(contents)
        });

        if (typeof header != "string") {
            _this.collapsedHeader = header.clone(true).css("text-decoration", "underline");
        }

        // State
        _this.createFields({
            "expanded": false
        });

        _this.style({
            "contentMargin": 4
        });

        _this.createEvents("expand", "collapse");
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            elems.headerSection = $DIV().css({
                "float": "left",
                "cursor": "pointer"
            }).append(
                elems.triangle = $DIV().css({
                    "float": "left",
                    "margin-top": 5,
                    "margin-right": 4
                }),
                elems.header = $DIV().css({
                    "float": "left",
                    "font-size": 14,
                    "position": "relative",
                    "top": 3
                }),
                $DIV().css("clear","both")
            ).click(_this.func(function() {
                _this.toggle();
                if (_this.expanded) {
                    _this.trigger("expand");
                } else {
                    _this.trigger("collapse");
                }
            })),
            $DIV().css("clear","both"),
            elems.contentsSection = $DIV().append(_this.contents)
        );

        $.extend(_this.render, {
            "expand": function(animate) {
                if (animate == undefined) {
                    animate = true;
                }

                elems.triangle.empty().append(
                    G.util.$IMG("expanded.gif")
                );

                if (typeof _this.expandedHeader == "string") {
                    elems.header.empty().text(_this.expandedHeader).css({
                        "text-decoration": "none"
                    });
                } else {
                    elems.header.empty().append(_this.expandedHeader);
                }

                elems.header.css("margin-bottom", _this.style.contentMargin);

                if (animate) {
                    elems.contentsSection.show("slide", {"direction":"up"}, "fast");
                } else {
                    elems.contentsSection.show();
                }
            },

            "collapse": function(animate) {
                if (animate == undefined) {
                    animate = true;
                }

                elems.triangle.empty().append(
                    G.util.$IMG("collapsed.gif")
                );

                if (typeof _this.collapsedHeader == "string") {
                    elems.header.empty().text(_this.collapsedHeader).css({
                        "text-decoration": "underline"
                    });
                } else {
                    elems.header.empty().append(_this.collapsedHeader);
                }

                elems.header.css("margin-bottom", 0);

                if (animate) {
                    elems.contentsSection.hide("slide", {"direction":"up"}, "fast");
                } else {
                    elems.contentsSection.hide();
                }
            }
        });

        if (_this.expanded) {
            _this.render("expand", false);
        } else {
            _this.render("collapse", false);
        }
    },

    expand: function(animate) {
        _this.expanded = true;
        _this.render("expand", animate);
    },

    collapse: function(animate) {
        _this.expanded = false;
        _this.render("collapse", animate);
    },

    toggle: function() {
        if (_this.expanded) {
            _this.collapse();
        } else {
            _this.expand();
        }
    }
});
