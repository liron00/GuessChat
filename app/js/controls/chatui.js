G.defineControl("ChatUI", {
    _init: function() {
        // State
        _this.createFields({
            "socket": null,
            "chatRoom": null,
            "chatting": false,
            "strangerIds": null
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
                    _this.sendMessage();
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
            }),

            "strangerSelector": null
        });

        _this.style({
            "logHeight": 250,
            "buttonHeight": 100,
            "textPadding": 8,
            "buttonWidth": 150,
            "width": null
        });

        _this.createEvents("chatEnded");
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            G.util.makeTable([
                $TD().css({
                    "vertical-align": "top",
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
                    "vertical-align": "top",
                    "width": 250
                }).append(
                    elems.strangerSection = $DIV()
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
                elems.logBox[0].scrollTop = elems.logBox[0].scrollHeight;
            },

            "strangers": function() {
                var strangerOptions = $.map(_this.strangerIds, function(strangerId) {
                    return {
                        "text": G.util.$IMG("http://graph.facebook.com/" + strangerId + "/picture?type=square").css({
                            "cursor": "pointer"
                        }),
                        "value": strangerId
                    };
                });

                _this.controls.strangerSelector = new G.controls.RadioSelector(strangerOptions).set({
                    "rowSize": 3,
                    "showButtons": false
                }).style({
                    "normalBgStyle": {
                        "padding": 8,
                        "border": "",
                        "background": ""
                    },
                    "selectedBgStyle": {
                        "padding": 4,
                        "border": "4px solid green",
                        "background": G.colors.highlight
                    }
                }).bind({
                    "select": _this.func(function(strangerId) {
                        G.post(
                            "guess",
                            {
                                "chatroom_id": _this.chatRoom.id,
                                "stranger_id": strangerId
                            }
                        );
                    })
                });

                elems.strangerSection.empty().append(
                    $DIV().css({
                        "text-align": "center",
                        "font-size": 14,
                        "font-weight": "bold",
                        "padding-bottom": 4,
                        "color": "#666",
                        "border-bottom": "1px dotted #CCC",
                        "margin-bottom": 8
                    }).text("Your Guess"),
                    _this.controls.strangerSelector.renderHere().css({
                        "margin-bottom": 8
                    })
                );
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

                            _this.strangerIds = data.strangerIds;
                            _this.render("strangers");

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

                            _this.strangerIds = messageObj.strangerIds;
                            _this.render("strangers");

                        } else if (messageObj.kind == "chatmessage") {
                            var chatMessage = G.data.ChatMessage.fromServer(messageObj.chatMessage);
                            _this.logChatMessage(chatMessage);

                        } else if (messageObj.kind == "disconnect") {
                            _this.logOfficialMsg("Your partner has disconnected.");
                            _this.handleDisconnect();
                            _this.trigger("chatEnded", messageObj);
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
        G.post(
            "disconnect",
            {
                "chatroom_id": _this.chatRoom.id
            },
            _this.func(function(data) {
                _this.trigger("chatEnded", data);
            })
        );
        _this.handleDisconnect();
        _this.logOfficialMsg("You have disconnected.");
    },

    handleDisconnect: function() {
        if (!_this.socket) {
            return;
        }

        var socket = _this.socket;
        _this.socket = null;

        socket.close();

        _this.controls.disconnectButton.disable();
        _this.controls.sendButton.disable();

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
