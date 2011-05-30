G.defineControl("ChatUI", {
    _init: function() {
        // State
        _this.createFields({
            "socket": null,
            "chatRoom": null,
            "chatting": false
        });

        _this.createField("controls", {
            "inputBox": new G.controls.TextBox().set({
                "big": true,
                "elastic": false,
                "trim": false,
                "maxLength": 500
            }).style({
                "text": {
                    "padding": 0,
                    "border": 0,
                    "width": "100%"
                }
            }).bind({
                "enterDown": _this.func(function() {
                    setTimeout(_this.func(function() {
                        _this.sendMessage();
                    }), 1);
                    return false;
                })
            }),

            "disconnectButton": new G.controls.Button().set({
                "text": "Disconnect"
            }).bind({
                "click": _this.disconnect
            }),
            "sendButton": new G.controls.Button().set({
                "text": "Send"
            }).bind({
                "click": _this.sendMessage
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
                        "word-wrap": "break-word",
                        "overflow": "auto",
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

    logChatMessage: function(chatMessage) {
        if (chatMessage.userId == FB.getSession().uid) {
            _this.logMsg(
                $DIV().append(
                    $SPAN().css({
                        "color": "blue",
                        "font-weight": "bold"
                    }).text("You: "),
                    $SPAN().text(chatMessage.text)
                )
            );
        } else {
            _this.logMsg(
                $DIV().append(
                    $SPAN().css({
                        "color": "red",
                        "font-weight": "bold"
                    }).text("Stranger: "),
                    $SPAN().text(chatMessage.text)
                )
            );
        }
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
                        data.msg
                    );
                    return;
                }

                _this.chatRoom = G.data.ChatRoom.fromServer(data.chatRoom);

                var channel = new goog.appengine.Channel(data.channelToken);
                var socket = channel.open({
                    "onopen": _this.func(function() {
                        if (data.matched) {
                            _this.clearLog();
                            _this.logOfficialMsg("You are now chatting. Say \"hi\"!");
                            _this.chatting = true;
                        } else {
                            _this.logOfficialMsg("Waiting for a chat partner...");
                        }
                    }),

                    "onmessage": _this.func(function(m) {
                        var messageObj = $.fromJSON(m.data);

                        if (messageObj.kind == "partner_joined") {
                            _this.clearLog();
                            _this.logOfficialMsg("You are now chatting. Say \"hi\"!");
                            _this.chatting = true;

                        } else if (messageObj.kind == "chatmessage") {
                            var chatMessage = G.data.ChatMessage.fromServer(messageObj.chatMessage);
                            _this.logChatMessage(chatMessage);
                        }
                    }),

                    "onerror": _this.func(function(err) {
                        _this.logErrorMsg(err.description);
                    }),

                    "onclose": _this.func(function() {
                        if (_this.socket == socket) {
                            G.log("Unexpected socket close.");
                            _this.chatting = false;
                        }
                    })
                });
                _this.socket = socket;
            })
        );
    },

    disconnect: function() {
        if (!_this.socket) {
            return;
        }

        var socket = _this.socket;
        _this.socket = null;

        socket.close();
        _this.logOfficialMsg("Disconnected.");
        _this.chatting = false;
    },

    sendMessage: function() {
        if (!_this.chatting) {
            return;
        }

        G.assert(_this.chatRoom && _this.chatRoom.id, "No chat room");

        var text = _this.controls.inputBox.text;
        if (!text) {
            return;
        }

        var chatMessage = new G.data.ChatMessage({
            "userId": FB.getSession().uid,
            "chatroomId": _this.chatRoom.id,
            "text": text
        });

        G.post(
            "send_chatmessage",
            {
                "chatmessage": chatMessage
            }
        );

        _this.controls.inputBox.setText("");
        _this.logChatMessage(chatMessage);
    }
});
