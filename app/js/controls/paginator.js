/*
 * Paginator
*/

G.defineControl("OptionSelector", "Paginator", {
    _init: function() {
        _super([]);

        // Properties
        _this.createFields({
            "pageCount": 0,
            "maxRadius": 4, // ... selectedIndex-maxRadius -> selectedIndex+maxRadius ...

            "caption": ""
        });

        _this.style({
            "fontSize": 14,
            "linkSectionWidth": 24
        });
    },

    _render: function() {
        var elems = _this.domElems;

        var cells = [];
        if (_this.caption) {
            cells.push(
                $TD().css({
                    "padding-right": 8
                }).text(_this.caption)
            );
        }

        if (_this.selectedIndex >= 0 && _this.selectedIndex > 0) {
            var prevSection = elems["prevSection"] = $DIV().append(
                G.util.makeLink("< prev", _this.func(function() {
                    if (_this.trigger("select", _this.selectedIndex - 1)) {
                        _this.selectedIndex -= 1;
                        _this.render();
                    }
                }))
            );
            cells.push(
                $TD().css({
                    "padding": 8,
                    "width": 50
                }).append(prevSection)
            );
        }

        G.util.forRange(
            Math.max(
                0,
                Math.min(_this.pageCount - 1 - 2 * _this.maxRadius, _this.selectedIndex - _this.maxRadius)
            ),
            Math.min(
                _this.pageCount,
                Math.max(1 + 2 * _this.maxRadius, _this.selectedIndex + _this.maxRadius + 1)
            ),
            function(page) {
                var pageSection = elems["pageSection" + page] = $DIV();

                if (page == _this.selectedIndex) {
                    pageSection.append(
                        $SPAN().css({
                            "font-weight": "bold"
                        }).text(G.util.commaSeparate(page + 1))
                    );
                } else {
                    pageSection.append(
                        G.util.makeLink(G.util.commaSeparate(page + 1), _this.func(function() {
                            if (_this.trigger("select", page)) {
                                _this.selectedIndex = page;
                                _this.render();
                            }
                        }))
                    );
                }

                cells.push(
                    $TD().css({
                        "text-align": "center",
                        "padding": 4,
                        "width": _this.style.linkSectionWidth
                    }).append(pageSection)
                );
            }
        );

        if (_this.selectedIndex >= 0 && _this.pageCount > _this.selectedIndex + 1) {
            var nextSection = elems["nextSection"] = $DIV().append(
                G.util.makeLink("next >", _this.func(function() {
                    if (_this.trigger("select", _this.selectedIndex + 1)) {
                        _this.selectedIndex += 1;
                        _this.render();
                    }
                }))
            );
            cells.push(
                $TD().css({
                    "padding": 8,
                    "width": 50
                }).append(nextSection)
            );
        }

        _this.domRoot.css({
            "font-size": _this.style.fontSize
        }).append(
            elems.pageTable = G.util.makeTable(cells)
        );
    }
});
