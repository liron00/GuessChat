/*
 * AJAX File Uploader
*/

G.defineControl("Uploader", {
    _init: function() {
        // Properties
        _this.createFields({
            "uploadable": true,
            "transloadable": true,
            "data": {},
            "caption": "",
            "fileCaption": "File",
            "urlCaption": "URL",
            "captionInline": true
        });

        _this.createField("controls", {
            "urlBox": new G.controls.TextBox().set({
            }).style({
                "labelOnLeft": true,
                "text": {
                    "font-size": 9,
                    "padding": 2
                }
            }).bind({
                "blur": _this.func(function() {
                    this.text = G.util.makeUrl(this.text);
                }),
                "pressEnter": _this.transload
            }),
            "transloadButton": new G.controls.Button().set({
                "big": false,
                "text": "Fetch",
                "disabledText": "Fetching..."
            }).style({
                "fontSize": 10,
                "height": 21,
                "round": false
            }).bind("click", _this.transload)
        });

        _this.style({
            "width": null
        });

        _this.createEvents("submit", "complete", "transloadError");
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            elems.captionSection = $DIV().append(
                G.util.makeSpan(_this.caption)
            ),
            G.util.makeTable([
                $TD().css({
                    "vertical-align": "top",
                    "padding-top": 3,
                    "padding-right": 4
                }).append(
                    elems.fileCaption = G.util.makeSpan(_this.fileCaption).css({
                        "color": G.colors.gray
                    })
                ),
                $TD().css({
                    "vertical-align": "top"
                }).append(
                    elems.uploadForm = $("<form method=\"post\" enctype=\"multipart/form-data\" action=\"/upload_image_file\" target=\"" + _this.makeElemId("uploadTarget") + "\" />").css({
                        "margin": 0
                    }).append(
                        elems.fileInput = $INPUT().attr({
                            "type": "file",
                            "name": "file"
                        }).css({
                            "width": (_this.style.width - 40) || null,
                            "height": 25,
                            "color": "#FEFEFE"
                        }).bind("change", _this.func(function() {
                            elems.uploadForm.submit();

                            _this.trigger("submit");
                        }))
                    ),
                    elems.uploadTarget = $("<iframe name=\"" + _this.makeElemId("uploadTarget") + "\" src=\"\" />").css({
                        "width": 0,
                        "height": 0,
                        "border-style": "none",
                        "position": "absolute"
                    })
                ),

                $TD().css({
                    "vertical-align": "top",
                    "padding-right": 4
                }).append(
                    elems.urlCaption = G.util.makeSpan(_this.urlCaption).css({
                        "color": G.colors.gray
                    })
                ),
                $TD().css({
                    "vertical-align": "top",
                    "padding-left": 1
                }).append(
                    elems.transloadSection = $DIV().append(
                        _this.controls.urlBox.style({
                            "width": 100
                        }).renderHere().css({
                            "float": "left"
                        }),
                        _this.controls.transloadButton.style({
                        }).renderHere().css({
                            "float": "left"
                        }),
                        $DIV().css("clear","both")
                    )
                )
            ], 2)
        );

        if (!_this.uploadable) {
            elems.fileCaption.hide();
            elems.uploadForm.hide();
        }

        if (!_this.transloadable) {
            elems.urlCaption.hide();
            elems.transloadSection.hide();
        }

        var props = $.extend({
            "callback_func": "window.parent.G._controlInstances[" + _this._controlId + "]._uploadCallback"
        }, _this.data);

        $.each(props, function(name, value) {
            elems.uploadForm.append(
                $INPUT().attr({
                    "type": "hidden",
                    "name": name,
                    "value": value
                })
            );
        });

        $.extend(_this.render, {
            focus: function() {
                if (_this.uploadable) {
                    elems.fileInput.focus();
                } else {
                    _this.controls.urlBox.focus();
                }
            }
        });
    },

    _uploadCallback: function(response) {
        _this.trigger("complete", response);
    },

    transload: function() {
        _this.controls.urlBox.setText(G.util.makeUrl(_this.controls.urlBox.text));

        var ok = true;

            if (!_this.controls.urlBox.text) {
                ok = false;
            }

        if (!ok) {
            return;
        }

        _this.controls.urlBox.disable();
        _this.controls.transloadButton.disable();

        G.post(
            "transload_image",
            {
                "url": _this.controls.urlBox.text
            },
            _this.func(function(data) {
                _this.controls.transloadButton.enable();
                _this.controls.urlBox.enable();

                if (data.rc) {
                    _this.trigger("transloadError", data);
                    return;
                }

                _this.controls.urlBox.setText("");

                _this.trigger("complete", data)
            })
        );
    },

    focus: function() {
        _this.render("focus");
    }
});
