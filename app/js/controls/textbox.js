/*
 * Smart text box
*/
G.defineControl("TextBox", {
    _init: function() {
        // Properties
        _this.createFields({
            "big": false, //true:textarea, false:input
            "multiline": true, //if false, convert line breaks to spaces (if big=true)
            "elastic": true, //auto-expand to fit text (if big=true)
            "password": false,
            "prompt": "",
            "label": "",
            "sideMsg": "",
            "bottomMsg": "",
            "hidePromptOnFocus": true, // if false, hide prompt on keydown
            "destroyPrompt": false, // make prompt go away after it's hidden
            "trim": true,
            "maxLength": null,
            "iconPath": null, //shows an icon inside the textbox on the left
            "showPreview": false,
            "autoSelect": false,
            "readonly": false,
            "previewFunc": function(s) {
                return G.util.makeShortenedMarkdownDiv(G.util.sentenceCase(s), 500, 4)
            },
            "previewMsg": $SPAN().css({
                "color": G.colors.gray
            }).append(
                G.util.nbSpan("Here's how it looks after formatting with "),
                G.util.makeExtLink("Markdown", "http://en.wikipedia.org/wiki/Markdown").css({
                    "opacity": 0.7
                }),
                G.util.nbSpan(":")
            )
        });

        // State
        _this.createFields({
            "text": "",
            "hasFocus": false,
            "iconSide": "left",

            "_promptDestroyed": false
        });

        _this.style({
            "width": 200,
            "height": 100,
            "maxHeight": 600, // (if elastic=true)
            "round": false,
            "labelOnLeft": false,
            "textColor": "#000",
            "promptColor": G.colors.gray,
            "bgColor": "#FFF",
            "disabledBgColor": "#F8F8F8",
            "previewBg": G.colors.lightGrayBg,
            "border": {
                "width": 1,
                "color": "#CCC"
            },
            "focusedBorder": {
                "width": null,
                "color": "#999"
            },
            "text": {
                "outline": "none"
            }
        });

        _this.createEvents(
            "change", "keyDown", "focus", "blur",
            "pressEnter", "pressLeft", "pressRight", "pressUp", "pressDown",
            "pressBackspace", "pressEscape",
            "pressNormal",
            "click", "mouseDown"
        );
    },

    _render: function() {
        var elems = _this.domElems;

        if (_this.password) {
            elems.inputText = $("<input type=\"password\"/>");
        } else {
            elems.inputText = _this.big? $("<textarea/>") : $("<input type=\"text\"/>");
            if (_this.maxLength != null) {
                elems.inputText.attr("maxLength", _this.maxLength);
            }
        }

        if (_this.readonly) {
            elems.inputText.attr("readonly", true);
        }

        if (!_this.text) {
            _this.text = ""; // otherwise e.g. String(_this.text)=="null" and !!_this.text==true
        }

        if (_this.big) {
            elems.inputText.css({
                "height": _this.style.height
            });
        }

        if (_this.style.round) {
            elems.inputText.css({
                "-moz-border-radius": "4px",
                "-webkit-border-radius": "4px"
            });
        }

        var padding = _this.big? 6:3;
        elems.inputText.css({
            "max-height": Math.max(_this.style.height+10, _this.style.maxHeight),
            "margin": 0,
            "font-family": "Trebuchet MS,Helvetica,sans-serif",
            "border-style": "solid",
            "border-width": _this.style.border.width,
            "border-color": _this.style.border.color,
            "padding": padding
        }).css(
            _this.style.text
        ).bind("keydown", _this.func(function(e) {
            _this.render("hideValMsg");

            if (!_this._promptDestroyed) {
                $(this).val("");
                _this._promptDestroyed = true;
            }

            _this.trigger("keyDown", e);

            if (e.keyCode == 13) {
                // When this key comes up, we'll trigger a pressEnter
                // (but doing so now would cut off text input)
            } else if (e.keyCode == 37) {
                _this.trigger("pressLeft");
            } else if (e.keyCode == 38) {
                return _this.trigger("pressUp");
            } else if (e.keyCode == 39) {
                _this.trigger("pressRight");
            } else if (e.keyCode == 40) {
                _this.trigger("pressDown");
            } else if (e.keyCode == 8) {
                _this.trigger("pressBackspace");
            } else if (e.keyCode == 27) {
                _this.trigger("pressEscape");
            } else if (
                (e.keyCode >= 48 && e.keyCode <= 90) ||
                (e.keyCode >= 96 && e.keyCode <= 111) ||
                (e.keyCode == 32) ||
                (e.keyCode >= 186 && e.keyCode <= 222)
            ) {
                _this.trigger("pressNormal", e.keyCode);
            }

        })).bind("keyup", _this.func(function(e) {
            if (e.keyCode == 13) {
                _this.trigger("pressEnter");
            }

            _this._handleInputTextChange(
                _this._promptDestroyed? $(this).val() : ""
            );

        })).bind("change", _this.func(function() {
            _this._handleInputTextChange($(this).val());

        })).bind("paste", _this.func(function() {
            // The textbox value hasn't updated yet
            setTimeout(_this.func(function() {
                _this._handleInputTextChange(elems.inputText.val());
            }), 1);

        })).bind("focus", _this.func(function() {
            _this.hasFocus = true;

            if (_this.hidePromptOnFocus) {
                _this._promptDestroyed = true;

                if (!_this.text) {
                    $(this).val("").css("color", _this.style.textColor);
                }
            } else {
                if (!_this.text) {
                    $(this).caret(0, 0);
                }
            }

            $(this).css({
                "border-color": _this.style.focusedBorder.color
            });

            _this.trigger("focus");

        })).bind("blur", _this.func(function() {
            $(this).css("border-color",_this.style.border.color);

            _this.render("blurred");

            _this.trigger("blur");

        })).bind("click", _this.func(function() {
            if (_this._promptDestroyed) {
                if (_this.autoSelect) {
                    elems.inputText.select();
                }
            } else {
                _this._promptDestroyed = true;
                $(this).val("");
            }

            return _this.trigger("click");

        })).bind("mousedown", _this.func(function() {
            _this.trigger("mouseDown");

        }));

        if (_this.iconPath) {
            elems.inputText.css({
                "background": "#FFF url(" + G.util.imgPath(_this.iconPath) + ") no-repeat scroll " + _this.style.iconSide + " center",
                "padding-left": 16
            });
        }

        var textWidth = _this.style.text.width || _this.style.width - 2 - (parseInt(elems.inputText.css("padding-left")) || 0) - (parseInt(elems.inputText.css("padding-right") || 0));
        if ($.browser.msie && _this.big) {
            textWidth -= 10; // HACK
        }
        elems.inputText.css({
            "width": $.browser.opera // HACK
                ? (_this.big ? "90%" : "95%")
                : textWidth
        });

        if (_this.label) {
            _this.domRoot.append(
                $("<label/>").attr("for", _this.makeElemId("inputText")).css({
                    "max-width": _this.style.width
                }).append(
                    (_this.style.labelOnLeft?
                        $SPAN().append(
                            G.util.makeSpan(_this.label),
                            G.util.nbSpan(" ")
                        )
                    :
                        $DIV().append(
                            G.util.makeSpan(_this.label)
                        )
                    ).css({
                        "color": G.colors.gray
                    })
                )
            );
        }

        _this.domRoot.append(
            elems.inputText,
            elems.sideMsg = $("<label/>").attr("for", _this.makeElemId("inputText")).css({
                "font-size": 12,
                "color": G.colors.gray
            }).append(
                G.util.space(4),
                G.util.makeSpan(_this.sideMsg)
            ),
            elems.bottomMsg = $("<label/>").attr("for", _this.makeElemId("inputText")).css({
                "color": G.colors.gray
            }).append(
                $DIV().append(
                    G.util.makeSpan(_this.bottomMsg)
                )
            ),
            elems.previewSection = $DIV().css({
                "width": _this.style.width
            }).append(
                elems.previewMsg = G.util.makeDiv(_this.previewMsg),
                elems.preview = $DIV().css({
                    "padding": "8px 16px 6px 16px",
                    "background": _this.style.previewBg,
                    "border": "1px dotted #88C"
                })
            ).hide(),
            elems.valMsg = $DIV().css({
                "color": "red",
                "font-size": 11,
                "font-weight": "bold"
            }).hide()
        );

        if (!_this.sideMsg) {
            elems.sideMsg.hide();
        }
        if (!_this.bottomMsg) {
            elems.bottomMsg.hide();
        }

        _this._promptDestroyed = !!_this.text;

        $.extend(_this.render, {
            text: function() {
                if (_this.text || _this.hasFocus || _this._promptDestroyed) {
                    elems.inputText.css({
                        "color": _this.style.textColor
                    });

                    // jQuery val() would make text box lose focus
                    if (elems.inputText[0].value != (_this.text || "")) {
                        elems.inputText[0].value = _this.text || "";
                    }

                    if (_this.showPreview) {
                        elems.preview.empty().append(
                            _this.previewFunc(_this.text)
                        );
                        if (_this.text) {
                            elems.previewSection.show();
                        } else {
                            elems.previewSection.hide();
                        }
                    }

                } else {
                    if (!($.browser.opera || $.browser.msie)) {
                        // Known broken in these
                        elems.inputText.css({
                            "color": _this.style.promptColor
                        }).val(_this.prompt);
                    }
                    elems.previewSection.hide();
                }
            },

            focus: function(hidePrompt) {
                if (hidePrompt === undefined) {
                    elems.inputText.focus();
                } else {
                    var usualHideSetting = _this.hidePromptOnFocus;
                    _this.hidePromptOnFocus = hidePrompt;
                    elems.inputText.focus();
                    _this.hidePromptOnFocus = usualHideSetting;
                }
            },

            blur: function() {
                elems.inputText.blur();

                _this.render("blurred");
            },

            blurred: function() {
                _this.hasFocus = false;

                if (_this.trim) {
                    _this.text = _this.text.replace(/^\s*/, "").replace(/\s*$/, "");
                }

                if (!_this.destroyPrompt && !_this.text) {
                    _this._promptDestroyed = false;
                }

                _this.render("text");
            },

            enabled: function() {
                elems.inputText.attr("disabled", false);
                elems.inputText.css({
                    "background-color": _this.style.bgColor
                });
            },

            disabled: function() {
                elems.inputText.attr("disabled", true);
                elems.inputText.css({
                    "background-color": _this.style.disabledBgColor
                });
            },

            showValMsg: function(msg, color) {
                elems.valMsg.empty().show().append(
                    G.util.makeSpan(msg)
                ).css({
                    "color": color || "red"
                });
            },

            hideValMsg: function() {
                elems.valMsg.hide();
            },

            select: function() {
                elems.inputText.select();
            }
        });

        _this.render("text");

        if (!_this.enabled) {
            _this.render("disabled");
        }

        if (_this.big && _this.elastic) {
            // The spacer trickery is to prevent re-rendering
            // from causing the page to scroll up
            $("body").append(
                elems.spacer = $DIV().css({
                    "height": _this.style.maxHeight
                })
            );
            setTimeout(_this.func(function() {
                elems.inputText.elastic();
                elems.spacer.remove();
            }), 1);
        }
    },

    _handleInputTextChange: function(text) {
        if (!_this.multiline && text.indexOf("\n") >= 0) {
            text = text.replace(/\n/g, " ");
        }

        if (_this.big && _this.maxLength != null && text.length > _this.maxLength) {
            _this.showValMsg("Limit " + _this.maxLength + " characters (you entered " + text.length + ")");
            text = text.substring(0, _this.maxLength);
        }

        var changeOutput = _this.trigger("change", text);
        // onChange event handler might stop the text from changing
        // or change it to something else.
        if (changeOutput !== false) {
            _this.text = (changeOutput == true)? text : changeOutput;
        }

        _this.render("text");
    },

    setText: function(text) {
        _this.text = text;
        _this._promptDestroyed = !!text;
        _this.render("text");
    },

    showValMsg: function(msg, color) {
        // Show a red (or other color) message under the textbox
        // (useful for validation failures)
        _this.render("showValMsg", msg, color);
    },

    focus: function(hidePrompt) {
        _this.render("focus", hidePrompt);
    },

    blur: function() {
        _this.render("blur");
    },

    getValidEmail: function(allowBlank) {
        if ((allowBlank && _this.text == "") || G.util.isValidEmail(_this.text)) {
            return _this.text;
        } else {
            _this.showValMsg("invalid email");
            return null;
        }
    },

    getValidUrl: function(allowBlank) {
        if ((allowBlank && _this.text == "") || G.util.isValidUrl(_this.text)) {
            return _this.text;
        } else {
            _this.showValMsg("invalid url");
            return null;
        }
    },

    select: function() {
        _this.render("select");
    }
});
