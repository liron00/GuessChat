G.defineControl("ChatBox", {
    _init: function() {
        _this.createFields({
        });

        _this.createField("controls", {
            "inputBox": new G.controls.TextBox().set({
                "big": true,
                "elastic": false
            }).style({
                "text": {
                    "padding": 0,
                    "border": 0,
                    "width": "100%"
                }
            }),

            "disconnectButton": new G.controls.Button().set({
                "text": "Disconnect"
            }),
            "sendButton": new G.controls.Button().set({
                "text": "Send"
            })
        });

        _this.style({
            "logHeight": 250,
            "buttonHeight": 100,
            "textPadding": 8,
            "buttonWidth": 150,
            "width": null
        });
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            elems.logBox = $DIV().css({
                "border": "1px solid #CCC",
                "height": _this.style.logHeight,
                "width": _this.style.width
            }).append(
            ),
            G.util.makeTable([
                $TD().css({
                    "width": _this.style.buttonWidth
                }).append(
                    _this.controls.disconnectButton.style({
                        "width": _this.style.buttonWidth,
                        "height": _this.style.buttonHeight
                    }).renderHere()
                ),
                $TD().css({
                    "padding": _this.style.textPadding,
                    "border": "1px solid #CCC",
                    "border-top": "none"
                }).append(
                    elems.inputBox = _this.controls.inputBox.style({
                        "height": _this.style.buttonHeight - 2 * _this.style.textPadding - 2
                    }).renderHere()
                ),
                $TD().css({
                    "width": _this.style.buttonWidth
                }).append(
                    _this.controls.sendButton.style({
                        "width": _this.style.buttonWidth,
                        "height": _this.style.buttonHeight
                    }).renderHere()
                )
            ]).css({
                "width": "100%"
            })
        );
    }
});
