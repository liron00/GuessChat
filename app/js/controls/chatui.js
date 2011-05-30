G.defineControl("ChatUI", {
    _init: function() {
        _this.createFields({
        });

        _this.createField("controls", {
            "chatBox": new G.controls.ChatBox()
        });
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            G.util.makeTable([
                $TD().css({
                }).append(
                    _this.controls.chatBox.renderHere().css({
                        "margin-right": 20
                    })
                ),
                $TD().css({
                    "width": 250
                }).append(
                )
            ]).css({
                "width": "100%"
            })
        );
    }
});
