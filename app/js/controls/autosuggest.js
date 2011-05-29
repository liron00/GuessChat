/*
 * AJAX autocomplete
*/

G.defineControl("AutoSuggest", {
    _init: function(suggestionType) {
        // Properties
        _this.createFields({
            "suggestionType": suggestionType || false,
            "suggestionParams": {},

            "enableSuggest": true,

            "prompt": "",
            "hidePromptOnFocus": true,
            "label": "",
            "maxLength": null,
            "buttonText": null,
            "buttonDisabledText": null,
            "linkObjects": false, // If true, make links for apps/authors/users/molecules
            "linkObjectTarget": "_self",
            "implicitSelect": true, // If true, pressing enter or clicking suggestions triggers select
            "autoSelect": false,
            "autoHighlight": false, // If true, ensure that whenever suggestions are shown, one is highlighted
            "prefixMatchesOnly": false, // If true, only show cached suggestions when they prefix-match
            "clearAfterSelect": false,
            "setTextOnSelect": false,
            "limit": null,
            "iconPath": null,

            "ajaxInterval": 100, // min amount of time in ms to wait between ajax requests
            "logInterval": 0 // period between logging control's text (or 0 to disable)
        });

        // State
        _this.createFields({
            "text": "",

            "suggestions": {
                "": [] // List of G.data.Synonym objects for each inputted string (might be guessed from previous server responses)
            },

            "showingMenu": false,

            "_sugText": "", // the current text for which suggestions are shown
            "_receivedSuggestions": {}, // text with successful server requests for suggestions
            "_requestedSuggestions": {}, // text with pending server requests for suggestions
            "_sugIndex": -1, // index of selected suggestion in the dropdown menu
            "_lastSuggestion": null, // the last suggestion selected, cleared when text is typed
            "_menuFrozen": false,
            "_dontBlur": false,
            "_didntBlur": false,

            "_ajaxRequests": [],
            "_lastAjaxTime": null,
            "_logIntervalId": null,
            "_lastLoggedText": null
        });

        _this.style({
            "width": null,
            "round": false,
            "buttonWidth": 80,
            "buttonHeight": 26,
            "bgColor": "#FFF",
            "hlColor": "#EEF",
            "text": {},
            "promptColor": null,
            "border": null,
            "focusedBorder": null,
            "iconSide": "left"
        });

        var doBeforeForcingMenu = function(_this) {
            // When user forces an unprepared menu to be shown by pressing the up/down arrow key
            if (_this._sugIndex == -1) {
                if (!_this.suggestions[_this.text]) {
                    // Temporarily reuse previous suggestions list when showing the forced menu
                    // (filtered for prefix matches)
                    _this.suggestions[_this.text.toUpperCase()] = G.util.filter(_this.suggestions[_this._sugText], function(suggestion) {
                        if (_this.prefixMatchesOnly) {
                            return suggestion.name.toUpperCase().substring(0, _this.text.length) == _this.text.toUpperCase();
                        } else {
                            return true;
                        }
                    });
                }
                _this._sugText = _this.text.toUpperCase();
            }
        }

        _this.createField("controls", {
            "textBox": new G.controls.TextBox().bind({
                "keyDown": _this.hideValMsg,
                "change": _this.func(function(text) {
                    _this.onChange(text);
                    return _this.trigger("change", text);
                }),
                "focus": _this.func(function() {
                    if (!_this._didntBlur) {
                        _this._didntBlur = false;
                        _this._sugIndex = -1;
                        _this._menuFrozen = true;
                        _this.render("suggestions");
                        _this._menuFrozen = false;
                    }
                }),
                "blur": _this.func(function() {
                    if (_this._dontBlur) {
                        _this._dontBlur = false;
                        _this._didntBlur = true;
                        this.focus();
                    } else {
                        _this.render("idle");
                        _this.trigger("blur");
                    }
                }),
                "pressEnter": _this.func(function() {
                    _this.text = _this.controls.textBox.text; // Quickfix for mobile devices

                    var suggestion = null;
                    if (_this._sugIndex >= 0) {
                        suggestion = _this.getSuggestion();
                    }
                    _this.select(false, suggestion);
                }),
                "pressEscape": _this.func(function() {
                    _this.controls.textBox.blur();
                }),
                "pressUp": _this.func(function() {
                    if (_this.suggestions[_this._sugText].length > 0) {
                        if (_this._sugIndex == -1) {
                            _this._sugIndex = _this.suggestions[_this._sugText].length - 1;
                        } else if (_this._sugIndex == 0) {
                            if (_this.autoHighlight) {
                                _this._sugIndex = _this.suggestions[_this._sugText].length - 1;
                            } else {
                                _this._sugIndex -= 1;
                            }
                        } else {
                            _this._sugIndex -= 1;
                        }

                        _this.render("highlight");
                    }
                    return false;
                }),
                "pressDown": _this.func(function() {
                    if (_this.suggestions[_this._sugText].length > 0) {
                        if (_this._sugIndex == _this.suggestions[_this._sugText].length - 1) {
                            if (_this.autoHighlight) {
                                _this._sugIndex = 0;
                            } else {
                                _this._sugIndex = -1;
                            }
                        } else {
                            _this._sugIndex += 1;
                        }

                        _this.render("highlight");
                    }
                    return false;
                })
            }),
            "selectButton": new G.controls.Button()
        });

        _this.createEvents("select", "change", "blur");
    },

    _render: function() {
        var elems = _this.domElems;

        _this.controls.textBox.set({
            "prompt": _this.prompt,
            "text": _this.text,
            "maxLength": _this.maxLength,
            "iconPath": _this.iconPath,
            "autoSelect": _this.autoSelect
        }).style({
            "text": _this.style.text,
            "round": _this.style.round,
            "promptColor": _this.style.promptColor,
            "border": _this.style.border,
            "focusedBorder": _this.style.focusedBorder,
            "iconSide": _this.style.iconSide
        });

        if (_this.style.width) {
            _this.controls.textBox.style({
                "width": _this.style.width - (_this.buttonText? _this.style.buttonWidth : 0)
            });
        }

        if (_this.label) {
            _this.domRoot.append(
                $("<label/>").attr("for", _this.controls.textBox.makeElemId("inputText")).append(
                    G.util.makeDiv(_this.label)
                )
            );
        }

        _this.domRoot.css({
            "width": _this.style.width
        }).append(
            elems.tbSection = $DIV(),
            elems.valMsg = $DIV().css({
                "color": "red",
                "font-size": 11,
                "font-weight": "bold"
            }).hide()
        );

        var cells = [];
        cells.push(
            $TD().css({
                "vertical-align": "top"
            }).append(
                _this.controls.textBox.renderHere(),
                elems.suggestions = $DIV().css({
                    "text-align": "left",
                    "margin-top": -2,
                    "width": _this.style.width? (
                        _this.style.width - (_this.buttonText?_this.style.buttonWidth:0) - 2
                    ) : (
                        _this.controls.textBox.style.width - 2
                    ),
                    "border": "1px solid #AAA",
                    "background": "#FFF",
                    "position": "absolute",
                    "z-index": 1000000
                }).hide()
            )
        );

        if (_this.buttonText) {
            _this.controls.selectButton.set({
                "big": false,
                "text": _this.buttonText,
                "disabledText": _this.buttonDisabledText
            }).style({
                "width": _this.style.buttonWidth,
                "height": _this.style.buttonHeight,
                "round": false
            }).bind({
                "click": _this.func(function() {
                    _this.select(true, _this.getSuggestion());
                })
            });

            cells.push(
                $TD().css({
                    "vertical-align": "top"
                }).append(
                    _this.controls.selectButton.renderHere()
                )
            );
        }

        elems.tbSection.append(
            G.util.makeTable(cells)
        );

        $.extend(_this.render, {
            suggestions: function() {
                if (!_this._menuFrozen && (true || _this._sugIndex == -1) && _this.text.toUpperCase() in _this.suggestions) {
                    _this._sugText = _this.text.toUpperCase();
                } else {
                    // Keep the old sugText
                }

                if (_this.autoHighlight && _this._sugIndex == -1 && _this.suggestions[_this._sugText].length) {
                    _this._sugIndex = 0;
                    _this.render("highlight");
                }


                var matchLength = _this._menuFrozen? _this._sugText.length : _this.text.length;

                elems.suggestions.empty();

                var sDivs = elems.sDivs = [];
                var makeSuggestion = function(sugIndex, suggestion) {
                    var sDivContents = null;
                    var sPaddingBottom = 4;
                    var app = null, author = null, user = null, molecule = null;

                    if (suggestion.data) {
                        if (suggestion.data instanceof G.data.App) {
                            sDivContents = suggestion.data.makeIcon(suggestion.highlights);
                            sPaddingBottom = 2;
                        } else if (suggestion.data instanceof G.data.Author) {
                            sDivContents = suggestion.data.makeIconLink(28, suggestion.highlights)
                        } else if (suggestion.data instanceof G.data.User) {
                            sDivContents = suggestion.data.makeThumbnail(true, suggestion.highlights, 28);
                        } else if (suggestion.data instanceof G.data.Molecule) {
                            sDivContents = $DIV().append(
                                suggestion.data.makeIcon(suggestion.highlights, suggestion.name)
                            );
                        }
                    }
                    if (!sDivContents) {
                        if (suggestion.highlights) {
                            sDivContents = G.util.makeHighlightedText(suggestion.name, suggestion.highlights);
                        } else {
                            sDivContents = $SPAN().append(
                                $SPAN().text(suggestion.name.substring(0, matchLength)),
                                $SPAN().css({
                                    "font-weight": "bold"
                                }).text(suggestion.name.substring(matchLength))
                            );
                        }
                    }

                    var sDiv = sDivs[sugIndex] = $DIV().css({
                        "padding-left": 8,
                        "padding-right": 8,
                        "padding-top": 4,
                        "padding-bottom": sPaddingBottom,
                        "cursor": "pointer",
                        "background-color": (sugIndex == _this._sugIndex)? _this.style.hlColor : _this.style.bgColor
                    }).append(
                        sDivContents
                    ).bind("mousemove", _this.func(function() {
                        _this._sugIndex = sugIndex;
                        _this.render("highlight");
                    })).bind("mousedown", _this.func(function() {
                        // Fight the text box blur event that hides the menu
                        _this._dontBlur = true;
                    }));

                    var href = null;
                    if (_this.linkObjects) {
                        href = suggestion.data.getPageUrl();
                    }

                    if (href) {
                        return G.util.makeLink(sDiv, href).attr({
                            "target": _this.linkObjectTarget
                        }).bind("click", _this.func(function() {
                            if (_this.setTextOnSelect) {
                                _this.text = suggestion.name;
                                _this.render("text");
                            }
                            _this.select(false, suggestion);
                            return false;
                        }));
                    } else {
                        return sDiv.click(_this.func(function(event) {
                            if (event.which != 1) {
                                return;
                            }
                            _this.text = suggestion.name;
                            _this.render("text");
                            _this.select(false, suggestion);
                            return false;
                        }));
                    }
                }

                var suggestionCount = 0;
                $.each(_this.suggestions[_this._sugText] || [], function(sugIndex, suggestion) {
                    if (
                        // Make sure _this.text is a prefix match for the sugText suggestions
                        (suggestion.name.toUpperCase().substring(0, _this.text.length) == _this.text.toUpperCase())
                        // or that prefix matches aren't required.
                        || !_this.prefixMatchesOnly
                        // And if user is interacting with the menu, don't try to smartly delete stuff from it
                        || _this._sugIndex >= 0 || _this._menuFrozen
                    ) {
                        suggestionCount += 1;
                        elems.suggestions.append(makeSuggestion(sugIndex, suggestion));

                        if (sugIndex == _this._sugIndex && _this._menuFrozen) {
                            _this.text = suggestion.name;
                            _this.render("text");
                        }
                    }
                });

                if (suggestionCount) {
                    _this.render("menu");
                } else {
                    _this.render("idle");
                }
            },

            highlight: function() {
                $.each(elems.sDivs, function(i, sDiv) {
                    if (sDiv) {
                        if (i == _this._sugIndex) {
                            sDiv.css({
                                "background-color": _this.style.hlColor
                            });
                        } else {
                            sDiv.css({
                                "background-color": _this.style.bgColor
                            });
                        }
                    }
                });
            },

            menu: function() {
                _this.showingMenu = true;
                elems.suggestions.show();
            },

            idle: function() {
                _this.showingMenu = false;

                // We don't care about pending suggestion requests anymore
                $.each(_this._requestedSuggestions, function(text, value) {
                    _this._requestedSuggestions[text] = false;
                });

                elems.suggestions.hide();
            },

            text: function() {
                _this.controls.textBox.setText(_this.text);
            },

            enabled: function() {
                _this.controls.textBox.enable();
                _this.controls.selectButton.enable();
            },

            disabled: function() {
                _this.controls.textBox.disable();
                _this.controls.selectButton.disable();
            },

            showValMsg: function(msg) {
                elems.valMsg.empty().append(
                    G.util.makeSpan(msg)
                ).show();
            },

            hideValMsg: function() {
                elems.valMsg.hide();
            }
        });

        _this.startLogInterval();
    },

    hide: function() {
        _this.stopLogInterval();
        _super();
    },

    startLogInterval: function() {
        _this.stopLogInterval();
        if (_this.logInterval) {
            _this._logIntervalId = setInterval(_this.func(function() {
                if (_this.text && _this.text != _this._lastLoggedText && _this.text != _this._class._lastLoggedTextByType[_this.suggestionType]) {
                    G.logEvent(
                        "enter autosuggest text",
                        {
                            "type": _this.suggestionType,
                            "text": _this.text
                        }
                    );
                    _this._lastLoggedText = _this.text;
                    _this._class._lastLoggedTextByType[_this.suggestionType] = _this.text;
                }
            }), _this.logInterval);
        }
    },

    stopLogInterval: function() {
        if (_this._logIntervalId) {
            clearInterval(_this._logIntervalId);
        }
    },

    getSuggestion: function() {
        if (_this._sugIndex >= 0) {
            return _this.suggestions[_this._sugText][_this._sugIndex];
        } else if (_this._lastSuggestion) {
            return _this._lastSuggestion;
        } else {
            return null;
        }
    },

    onChange: function(text) {
        if (text == _this.text) {
            // This change event is news to our text box but it's old news to us

        } else if (text.length < _this.text.length) {
            _this._lastSuggestion = null;
            _this._sugIndex = -1;
            _this.getSuggestions(text);

        } else {
            _this._lastSuggestion = null;
            if (_this._sugIndex >= 0) {
                if ((_this.getSuggestion().name || "").toUpperCase().substring(0, text.length) != text.toUpperCase()) {
                    // FIXME not congruent with hashing
                    _this._sugIndex = -1;
                }
            }
            _this.getSuggestions(text);
        }
    },

    getSuggestions: function(text) {
        if (!_this.enableSuggest) {
            return;
        }

        if (text === undefined) {
            text = _this.controls.textBox.text;
        }

        if (_this.text == text) {
            //return;
        }

        _this.text = text;

        if (text == "") {
            _this.render("suggestions");
            return;
        }

        if (text.toUpperCase() in _this._receivedSuggestions) {
            // Suggestions already received
            _this.render("suggestions");

        } else if (text.toUpperCase() in _this._requestedSuggestions) {
            // Suggestions already requested

        } else if (_this._ajaxRequests.length && _this._lastAjaxTime && new Date() - _this._lastAjaxTime < _this.ajaxInterval) {
            // Too soon after earlier AJAX request

            setTimeout(_this.func(function() {
                _this.getSuggestions();
            }), _this.ajaxInterval);

        } else {
            _this._requestedSuggestions[text.toUpperCase()] = true;

            var query = {
                "q": text
            };
            if (_this.limit != null) {
                query["limit"] = _this.limit;
            }
            $.extend(query, _this.suggestionParams);

            _this.abortAJAX();

            var requestIndex;
            var request = G.get(
                _this.suggestionType,
                query,
                _this.func(function(data) {
                    // Remove this request from _this._ajaxRequests
                    var rest = _this._ajaxRequests.slice(requestIndex + 1);
                    _this._ajaxRequests.length = requestIndex;
                    _this._ajaxRequests = _this._ajaxRequests.concat(rest);

                    var wasRequested = _this._requestedSuggestions[text.toUpperCase()];
                    delete _this._requestedSuggestions[text.toUpperCase()];
                    // Delete the request on error as well as success, so we try again next time

                    if (!data) {
                        // Probably means user left page
                        return;
                    } else if (data.rc) {
                        return;
                    }

                    var suggestions = data.suggestions;
                    $.each(suggestions, function(i, suggestion) {
                        if (suggestion.data) {
                            suggestion.data = G.Data.fromServer(suggestion.data);
                        }
                    });

                    _this.suggestions[text.toUpperCase()] = suggestions;
                    _this._receivedSuggestions[text.toUpperCase()] = suggestions;

                    if (!(_this.text.toUpperCase() in _this.suggestions)) {
                        // User typed new text while we were loading suggestions.
                        if (!_this.prefixMatchesOnly || (_this.text.toUpperCase().substring(0, text.length) == text.toUpperCase())) {
                            // Our loaded suggestions are still worth showing (temporarily)
                            _this.suggestions[_this.text.toUpperCase()] = suggestions;
                        }
                    }

                    if (wasRequested) {
                        if (_this._sugIndex == -1) {
                            _this.render("suggestions");
                        }
                    }
                })
            );

            requestIndex = _this._ajaxRequests.length;
            _this._ajaxRequests.push(request);
            _this._lastAjaxTime = new Date();
        }
    },

    select: function(explicit, suggestion) {
        if (!explicit && !_this.implicitSelect && _this._sugIndex != -1) {
            // don't let implicitSelect affect pressing enter on the textbox proper
            _this._lastSuggestion = _this.getSuggestion();
            _this._sugIndex = -1;
            _this.render("idle");
            _this.controls.textBox.render("blur");
            return;
        }

        if (!_this.text) {
            return;
        }

        _this.controls.textBox.render("blur");

        _this._sugIndex = -1;

        _this.abortAJAX();

        if (_this.setTextOnSelect && suggestion) {
            _this.setText(suggestion.name);
        }
        if (_this.trigger("select", suggestion ? suggestion.name : _this.text, suggestion)) {
            if (_this.clearAfterSelect) {
                _this.setText("");
            }
        }
    },

    showValMsg: function(msg, color) {
        _this.render("showValMsg", msg);
    },

    hideValMsg: function() {
        _this.render("hideValMsg");
    },

    setText: function(text) {
        _this.text = text;
        _this._lastLoggedText = text;
        _this._sugText = "";
        _this.render("text");
    },

    reset: function() {
        _this.setText("");
        _this.controls.textBox.blur();
    },

    clearSuggestions: function() {
        _this.suggestions = {
            "": []
        };
        _this.requestedSuggestions = [];
        _this.abortAJAX();
    },

    focus: function() {
        _this.controls.textBox.focus.apply(_this, arguments);
    },

    abortAJAX: function() {
        $.each(_this._ajaxRequests, function(i, request) {
            request.abort();
        });
        _this._ajaxRequests = [];
    },

    _set_hidePromptOnFocus: function(value) {
        _this.controls.textBox.set("hidePromptOnFocus", value);
    },

    _set_prompt: function(value) {
        _this["prompt"] = value;
        _this.controls.textBox.set("prompt", value).render();
    }
}, {
    _lastLoggedTextByType: {} // suggestionType: lastLoggedText
});
