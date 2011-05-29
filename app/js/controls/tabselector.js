/*
 * Tab selector
 *
 * Additional option fields:
 *     url    Makes tab a link
*/

G.defineControl("OptionSelector", "TabSelector", {
    _init: function(options) {
        _super(options);

        // Properties
        _this.createFields({
        });

        _this.style({
            "vertical": false,
            "minimalist": false,

            "tab": {
                "font-weight": "bold",
                "text-decoration": "none"
            },
            "selectedTabBorder": "1px solid #AAA",
            "selectedTabBackground": G.colors.lightGrayBg,
            "minimalistSelectedTabBackground": "#FFF",
            "selectedTabPadding": 0,
            "containerPadding": 32,
            "minimalistContainerPadding": "16px 4px",
            "normalTab": {
                "text-decoration": "none"
            },
            "selectedTab": {
                "color": G.colors.text
            },
            "highlightedTab": {
                "text-decoration": "underline"
            },
            "width": null
        });
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.css({
            "width": _this.style.width,
            "position": "relative",
            "z-index": 10
        }).append(
            elems.tabsSection = $DIV()
        );

        var cells = [];
        $.each(_this.options, function(i, option) {
            var tabContents = elems["tabContents" + i] = $DIV().append(
                G.util.makeSpan(option.text)
            );

            var tab = elems["tab" + i] = $DIV().css(
                _this.style.tab
            ).append(
                $DIV().css({
                    // FIXME This style logic is specific to _this.style.vertical == false
                    "padding": (i == _this.selectedIndex)? 12 : "8px 12px 12px",
                    "border-left": (i == 0 && i != _this.selectedIndex)? "1px solid #DDD" : "",
                    "border-right": (i != _this.selectedIndex - 1 && i != _this.selectedIndex)? "1px solid #DDD" : "",
                    "border-top": (i == _this.selectedIndex)? "" : "1px solid #DDD",
                    "background": (i == _this.selectedIndex)? "" : G.colors.lightGrayBg,
                    "margin-bottom": (i == _this.selectedIndex)? 0 : 1
                }).append(
                    tabContents
                )
            );

            if (option.enabled == false) {
                tab.css({
                    "cursor": "default",
                    "color": G.colors.lightGray
                });

            } else {
                tab.css({
                    "cursor": "pointer"
                }).click(
                    _this.func(function() {
                        if (_this.trigger("select", option.value, i)) {
                            if (option.url) {
                                // browser is navigating to another page
                            } else {
                                _this.selectedIndex = i;
                                _this.render();
                            }
                        } else {
                            return false;
                        }
                    })
                );
            }

            if (_this.style.vertical) {
                if (i == _this.selectedIndex) {
                    tab.addClass("ui-corner-left");
                    tab.css(_this.style.selectedTab).css({
                        "border": _this.style.selectedTabBorder,
                        "background": _this.style.minimalist? _this.style.minimalistSelectedTabBackground : _this.style.selectedTabBackground,
                        "border-right": "none"
                    });
                    tabContents.css({
                        "padding-right": _this.style.selectedTabPadding + 1
                    });

                } else {
                    tab.css(_this.style.normalTab).css({
                        "border-right": _this.style.selectedTabBorder
                    }).hover(
                        _this.func(function() {
                            if (option.enabled != false) {
                                tab.css(_this.style.highlightedTab);
                                tabContents.css({
                                });
                            }
                        }),
                        _this.func(function() {
                            tab.css(_this.style.normalTab);
                            tabContents.css({
                                "padding-right": ""
                            });
                        })
                    );

                    if (i == _this.selectedIndex - 1) {
                        tab.css({
                            "border-bottom": "none"
                        });
                    }
                }
            } else {
                if (i == _this.selectedIndex) {
                    tab.addClass("ui-corner-top");
                    tab.css(_this.style.selectedTab).css({
                        "border": _this.style.selectedTabBorder,
                        "background": _this.style.minimalist? _this.style.minimalistSelectedTabBackground : _this.style.selectedTabBackground,
                        "border-bottom": "none"
                    });
                    tabContents.css({
                        "padding-bottom": _this.style.selectedTabPadding + 1
                    });

                } else {
                    tab.css(_this.style.normalTab).css({
                        "border-bottom": "none"
                    }).hover(
                        _this.func(function() {
                            if (option.enabled != false) {
                                tab.css(_this.style.highlightedTab);
                                tabContents.css({
                                });
                            }
                        }),
                        _this.func(function() {
                            tab.css(_this.style.normalTab);
                            tabContents.css({
                                "padding-bottom": ""
                            });
                        })
                    );

                    if (i == _this.selectedIndex - 1) {
                        tab.css({
                            "border-right": "none"
                        });
                    }
                }
            }

            var cell = $TD().css({
                "vertical-align": "bottom"
            });
            if (option.url && option.enabled != false) {
                cell.append(
                    G.util.makeLink(tab, option.url, null, null, {
                        "text-decoration": "none"
                    })
                )
            } else {
                cell.append(
                    tab
                );
            }
            cells.push(cell);
        });

        elems.tabsSection.append(
            elems.tabsTable = G.util.makeTable(
                cells,
                _this.style.vertical? 1 : null
            )
        );
    },

    makeContainer: function() {
        /* Returns a div styled for holding tab contents */

        var container = $DIV().css({
            "position": "relative",
            "z-index": 1,
            "background": _this.style.minimalist? _this.style.minimalistSelectedTabBackground : _this.style.selectedTabBackground
        });

        if (_this.style.minimalist) {
            container.css({
                "border-top": _this.style.selectedTabBorder,
                "padding": _this.style.minimalistContainerPadding
            });
        } else {
            container.css({
                "border": _this.style.selectedTabBorder,
                "padding": _this.style.containerPadding
            });
        }

        if (_this.style.vertical) {
            if (!_this.style.minimalist) {
                container.addClass("ui-corner-right");
            }
            container.css({
                "left": -1
            });
        } else {
            if (!_this.style.minimalist) {
                container.addClass("ui-corner-bottom").addClass("ui-corner-tr");
            }
            container.css({
                "top": -1
            });
        }

        return container;
    }
});
