G.defineControl("EndingUI", {
    _init: function(endingData) {
        _this.createFields({
            "endingData": endingData
        });

        _this.createField("controls", {
            "nextButton": new G.controls.Button().set({
                "text": "Next"
            }).bind({
                "click": _this.func(function() {
                    _this.trigger("startNewChat");
                })
            }).style({
                "width": 200,
                "height": 100,
                "fontSize": 24
            }),
        });

        _this.createEvents("startNewChat");
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            G.util.makeTable([
                $TD().css({
                    "vertical-align": "top"
                }).append(
                    G.util.makeTable([
                        $TD().css({
                            "vertical-align": "top",
                            "width": 250,
                            "padding-right": 20
                        }).append(
                            $CENTER().append(
                                $DIV().css({
                                    "font-size": 36,
                                    "font-weight": "bold"
                                }).text("Your Guess")
                            )
                        ),
                        $TD().css({
                            "vertical-align": "top",
                            "width": 250,
                            "padding-left": 20
                        }).append(
                            $CENTER().append(
                                $DIV().css({
                                    "font-size": 36,
                                    "font-weight": "bold"
                                }).text("Their Guess")
                            )
                        ),
                        $TD().css({
                            "padding-right": 20,
                            "padding-bottom": 8
                        }).append(
                            $CENTER().append(
                                elems.yourCorrectnessSection = $DIV()
                            )
                        ),
                        $TD().css({
                            "padding-left": 20,
                            "padding-bottom": 8
                        }).append(
                            $CENTER().append(
                                elems.theirCorrectnessSection = $DIV()
                            )
                        ),
                        $TD().css({
                            "vertical-align": "top",
                            "padding-right": 20
                        }).append(
                            $CENTER().append(
                                elems.yourGuessSection = $DIV()
                            )
                        ),
                        $TD().css({
                            "vertical-align": "top",
                            "padding-left": 20
                        }).append(
                            $CENTER().append(
                                elems.theirGuessSection = $DIV()
                            )
                        ),
                    ], 2)
                ),
                $TD().css({
                    "vertical-align": "top",
                    "width": 300,
                    "padding-left": 20,
                    "padding-top": 12
                }).append(
                    $CENTER().append(
                        elems.outcomeSection = $DIV().css({
                            "margin-bottom": 20
                        }),
                        elems.nextSection = _this.controls.nextButton.renderHere().css({
                            "width": 200
                        })
                    )
                )
            ])
        );

        var makeGuessSection = function(guessId, guessCorrect, guessSection, correctnessSection) {
            if (guessId) {
                guessSection.append(
                    $DIV().css({
                        "margin-bottom": 12
                    }).append(
                        G.util.$IMG("http://graph.facebook.com/" + guessId + "/picture?type=large")
                    )
                );

                if (guessCorrect) {
                    correctnessSection.append(
                        $DIV().css({
                            "font-size": 24,
                            "font-family": "Impact",
                            "color": "green"
                        }).text("Right!")
                    );
                } else {
                    correctnessSection.append(
                        $DIV().css({
                            "font-size": 24,
                            "font-family": "Impact",
                            "color": "red"
                        }).text("Wrong")
                    );
                }

            } else {
                guessSection.append(
                    $DIV().css({
                        "font-size": 24,
                        "color": G.colors.gray,
                        "font-weight": "bold",
                        "font-style": "italic"
                    }).text("no guess")
                );
            }
        };

        makeGuessSection(
            _this.endingData.yourGuessId,
            _this.endingData.yourGuessCorrect,
            elems.yourGuessSection,
            elems.yourCorrectnessSection
        );
        makeGuessSection(
            _this.endingData.theirGuessId,
            _this.endingData.theirGuessCorrect,
            elems.theirGuessSection,
            elems.theirCorrectnessSection
        );

        var mutual = _this.endingData.yourGuessCorrect && _this.endingData.theirGuessCorrect;
        if (mutual) {
            elems.outcomeSection.append(
                $DIV().css({
                    "font-size": 18,
                    "font-family": "Impact",
                    "color": "green"
                }).text("You made a GuessChat connection!")
            );
        } else {
            elems.outcomeSection.append(
                $DIV().css({
                    "font-size": 18,
                    "font-family": "Impact",
                    "color": "red"
                }).text("No GuessChat connection.")
            );
        }
    }
});
