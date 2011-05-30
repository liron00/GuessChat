G.defineControl("ChatUI", {
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
            G.util.makeTable([
                $TD().css({
                    "padding-right": 20
                }).append(
                    elems.logBox = $DIV().css({
                        "border": "1px solid #CCC",
                        "padding": 12,
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
                ),
                $TD().css({
                    "width": 250
                }).append(

                )
            ]).css({
                "width": "100%"
            })
        );

        $.extend(_this.render, {
            "clearLog": function() {
                elems.logBox.empty();
            },

            "logMsg": function(msgContents) {
                var msgDiv = G.util.makeDiv(msgContents);
                msgDiv.css({
                    "margin-bottom": 8
                });
                elems.logBox.append(msgDiv);
            }
        });
    },

    logMsg: function(msgContents) {
        _this.render("logMsg", msgContents);
    },

    logOfficialMsg: function(text) {
        _this.logMsg(
            $DIV().css({
                "font-weight": "bold"
            }).text(text)
        );
    },

    logErrorMsg: function(text) {
        _this.logMsg(
            $DIV().css({
                "font-weight": "bold",
                "color": "red"
            }).text(text)
        );
    },

    clearLog: function() {
        _this.render("clearLog");
    },

    focus: function() {
        _this.controls.inputBox.focus();
    },

    requestNewChat: function() {
        _this.clearLog();
        _this.logOfficialMsg(
            "Connecting to server..."
        );

        var fbSession = FB.getSession();
        G.post(
            "start_chat",
            {
                "fb_uid": fbSession.uid,
                "fb_access_token": fbSession.access_token
            },
            _this.func(function(data) {
                if (data.rc) {
                    _this.logErrorMsg(
                        "Error connecting to chat server."
                    );
                    return;
                }

                var channel = new goog.appengine.Channel(data.channelToken);
                var socket = channel.open({
                    "onopen": _this.func(function() {
                        if (data.matched) {
                            _this.clearLog();
                            _this.logOfficialMsg("You are now chatting. Say \"hi\"!");
                        } else {
                            _this.logOfficialMsg("Waiting for a chat partner...");
                        }
                    }),

                    "onmessage": _this.func(function(message) {
                        console.log("Message: ", message);
                    }),

                    "onerror": _this.func(function(err) {
                        _this.logErrorMsg(err.description);
                    }),

                    "onclose": _this.func(function() {
                        _this.logOfficialMsg("Disconnected.");
                    })
                });
            })
        );
    }
});
