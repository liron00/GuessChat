/*
 * Up/down Voting
*/

G.defineControl("UpdownVoting", {
    _init: function(votable) {
        // votable: A G.data object with upvotes, downvotes (if canDownvote), and userVote fields
        G.assert(
            typeof votable.upvotes == "number" && ("userVote" in votable),
            "Invalid votable object: " + votable
        );

        _this.createFields({
            "votable": votable,

            "canDownvote": true,
            "horizontal": true,
            "upCaption": "",
            "downCaption": ""
        });

        _this.style({
            "upImgPath": "pluscircle.png",
            "upHighlightedImgPath": "pluscircle_highlighted.png",
            "downImgPath": "downvote.png",
            "downHighlightedImgPath": "downvote_highlighted.png",

            "voteCountColor": "#808185",
            "captionColor": "#666",
            "buttonSize": 16
        });

        _this.createEvents("vote", "voteCountChange");
    },

    _render: function() {
        var elems = _this.domElems;

        elems.upSection = $DIV().css({
            "cursor": "pointer",
            "text-align": "center"
        }).append(
            elems.voteUpContainer = $DIV().css({
                "float": "left",
                "margin-right": 4
            }).append(
                elems.voteUp = G.util.$IMG(_this.style.upImgPath).css({
                    "width": _this.style.buttonSize,
                    "height": _this.style.buttonSize
                }),
                elems.votedUp = G.util.$IMG(_this.style.upHighlightedImgPath).css({
                    "width": _this.style.buttonSize,
                    "height": _this.style.buttonSize
                })
            ),
            $DIV().css({
                "float": "left"
            }).append(
                elems.upCaption = $DIV().css({
                    "text-decoration": _this.upCaption?"underline":"none",
                    "color": _this.style.captionColor
                }).append(_this._makeUpCaption())
            ),
            $DIV().css("clear","both")
        ).click(_this.func(function() {
            var value;
            if (!_this.votable.userVote || _this.votable.userVote < 0) {
                value = 1;
            } else {
                value = 0;
            }
            _this.vote(value);
        }));

        elems.downSection = $DIV().css({
            "cursor": "pointer",
            "text-align": "center"
        }).append(
            elems.voteDownContainer = $DIV().css({
                "float": "left",
                "margin-right": 4
            }).append(
                elems.voteDown = G.util.$IMG(_this.style.downImgPath).css({
                    "width": _this.style.buttonSize,
                    "height": _this.style.buttonSize
                }),
                elems.votedDown = G.util.$IMG(_this.style.downHighlightedImgPath).css({
                    "width": _this.style.buttonSize,
                    "height": _this.style.buttonSize
                })
            ),
            $DIV().css({
                "float": "left"
            }).append(
                elems.downCaption = $DIV().css({
                    "text-decoration": "underline",
                    "color": _this.style.captionColor
                }).text(_this.downCaption)
            ),
            $DIV().css("clear","both")
        ).click(_this.func(function() {
            var value;
            if (!_this.votable.userVote || _this.votable.userVote > 0) {
                value = -1;
            } else {
                value = 0;
            }
            _this.vote(value);
        }));

        if (_this.horizontal) {
            _this.domRoot.append(
                elems.upSection.css({
                    "float": "left",
                    "margin-right": 8
                }),
                elems.downSection.css({
                    "float": "left"
                }),
                $DIV().css("clear","both")
            );
        } else {
            elems.voteUpContainer.css({
                "float": "",
                "margin-right": ""
            });
            elems.voteDownContainer.css({
                "float": "",
                "margin-right": ""
            });

            _this.domRoot.append(
                $CENTER().css({
                    "width": 38
                }).append(
                    $DIV().hover(
                        _this.func(function() {
                            elems.voteUp.css({
                                "width": _this.style.buttonSize + 4,
                                "height": _this.style.buttonSize + 4
                            });
                            elems.votedUp.css({
                                "width": _this.style.buttonSize + 4,
                                "height": _this.style.buttonSize + 4
                            });
                            elems.upSection.css("padding", 6);
                        }),
                        _this.func(function() {
                            elems.voteUp.css({
                                "width": _this.style.buttonSize,
                                "height": _this.style.buttonSize
                            });
                            elems.votedUp.css({
                                "width": _this.style.buttonSize,
                                "height": _this.style.buttonSize
                            });
                            elems.upSection.css("padding", 8);
                        })
                    ).append(
                        elems.upSection.css({
                            "padding": 8
                        }),
                        elems.downSection.css({
                            "padding": 8
                        })
                    )
                )
            );
        }

        if (!_this.canDownvote) {
            elems.downSection.hide();
        }

        $.extend(_this.render, {
            "vote": function() {
                elems.upCaption.empty().append(_this._makeUpCaption());

                if (!_this.votable.userVote) {
                    elems.votedUp.hide();
                    elems.voteUp.show();
                    elems.votedDown.hide();
                    elems.voteDown.show();
                } else if (_this.votable.userVote > 0) {
                    elems.voteUp.hide();
                    elems.votedUp.show();
                    elems.votedDown.hide();
                    elems.voteDown.show();
                } else if (_this.votable.userVote < 0) {
                    elems.votedUp.hide();
                    elems.voteUp.show();
                    elems.voteDown.hide();
                    elems.votedDown.show();
                }
            }
        });

        _this.render("vote");
    },

    getScore: function() {
        if (_this.canDownvote) {
            return _this.votable.upvotes - _this.votable.downvotes;
        } else {
            return _this.votable.upvotes;
        }
    },

    vote: function(value) {
        if (!_this.trigger("vote", value, _this.votable.userVote)) {
            return;
        }

        if (_this.votable.userVote) {
            // Undo the effect of previous vote
            if (_this.votable.userVote > 0) {
                _this.votable.upvotes -= _this.votable.userVote;
            } else if (_this.votable.userVote < 0) {
                _this.votable.downvotes -= Math.abs(_this.votable.userVote);
            }
        }

        _this.votable.userVote = value;
        if (value > 0) {
            _this.votable.upvotes += value;
        } else {
            _this.votable.downvotes += Math.abs(value);
        }

        _this.render("vote");

        _this.trigger("voteCountChange", _this.votable.upvotes, _this.votable.downvotes);
    },

    _makeUpCaption: function() {
        if (_this.upCaption == null) {
            return $SPAN().append(
                $SPAN().css({
                    "font-weight": "bold"
                }).text(
                    G.util.commaSeparate(_this.votable.upvotes)
                ),
                G.util.nbSpan(" "),
                $SPAN().css({
                    "color": G.colors.gray
                }).text(
                    G.util.pluralize("[x]", _this.votable.upvotes, "vote", "votes")
                )
            );
        } else {
            return G.util.makeSpan(_this.upCaption);
        }
    }
});
