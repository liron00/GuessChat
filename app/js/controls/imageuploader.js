G.defineControl("ImageUploader", {
    _init: function(image) {
        // Properties
        _this.createFields({
            "canDelete": true,
            "addText": null,
            "deleteText": "Delete",
            "label": "",
            "zoomable": true,
            "centerX": false,
            "centerY": false
        });

        _this.style({
            "width": null,
            "imgWidth": null,
            "imgBackground": "#FFF",
            "height": null,
            "border": {
                "width": 1
            },
            "deleteWidth": 100
        });

        // State
        _this.createFields({
            "image": image || new G.data.Image()
        });

        _this.createField("controls", {
            "uploader": null,

            "imageViewer": new G.controls.ImageViewer(new G.data.Image())
        });

        _this.createEvents("change", "upload", "delete");

    },

    _render: function() {
        var elems = _this.domElems;

        elems.addContainer = $DIV();

        elems.deleteContainer = $DIV().append(
            G.util.makeLink(
                $SPAN().css({
                    "color": G.colors.gray
                }).text("remove/replace"),
                _this.deleteImage
            )
        );

        _this.controls.imageViewer.set({
            "zoomable": _this.zoomable,
            "centerX": _this.centerX,
            "centerY": _this.centerY
        }).style({
            "width": _this.style.imgWidth || _this.style.width,
            "height": _this.style.height,
            "border": _this.style.border
        });

        if (_this.label) {
            _this.domRoot.append(
                G.util.makeDiv(_this.label).css({
                    "color": G.colors.gray
                })
            );
        }

        _this.domRoot.append(
            elems.beforeImage = $DIV().append(
                elems.addContainer
            ).hide(),
            elems.afterImage = G.util.makeTable([
                $TD().css({
                    "vertical-align": "bottom"
                }).append(
                    elems.imgContainer = $DIV().css({
                        "background": _this.style.imgBackground,
                        "max-width": _this.style.imgWidth || _this.style.width
                    })
                ),
                $TD().css({
                    "vertical-align": "bottom",
                    "padding-left": 8
                }).append(
                    elems.deleteContainer
                )
            ]).hide(),
            elems.uploading = $DIV().append(
                G.util.makeTable([
                    $TD().css({
                        "padding-right": 4
                    }).append(
                        new G.controls.ImageViewer(G.data.Image.fromPath("loader.gif")).style({
                            "width": _this.style.width - 50,
                            "border": {"width": 0}
                        }).renderHere()
                    ),
                    $TD().append(
                        G.util.makeLink("Cancel", _this.func(function() {
                            _this.cancel();
                        }))
                    )
                ])
            ).hide(),
            elems.valMsg = $SPAN().css({
                "color": "red",
                "font-size": 11,
                "font-weight": "bold"
            })
        );

        if (!_this.canDelete) {
            elems.deleteContainer.hide();
        }

        $.extend(_this.render, {
            "refreshUploaders": function() {
                if (_this.controls.uploader) {
                    _this.controls.uploader.unbind("complete");
                }

                _this.controls.uploader = new G.controls.Uploader().set({
                    "caption": _this.addText
                }).style({
                    "width": _this.style.width
                }).bind({
                    "submit": _this.func(function() {
                        _this.render("uploading");
                    }),
                    "complete": _this.func(function(response) {
                        _this.uploaded(response);
                    }),
                    "transloadError": _this.func(function(data) {
                        _this.showValMsg(data.msg);
                    })
                });

                _this.render("uploader");
            },

            "uploader": function() {
                elems.addContainer.empty().append(
                    elems.uploader = _this.controls.uploader.renderHere()
                );
            },

            "beforeImage": function() {
                elems.uploading.hide();
                elems.afterImage.hide();
                elems.beforeImage.show();

                // Refresh the uploader in case it already has a file path
                _this.render("uploader");
            },

            "afterImage": function() {
                elems.uploading.hide();
                elems.beforeImage.hide();
                elems.afterImage.show();

                _this.controls.imageViewer.set({
                    "image": _this.image
                }).renderTo(elems.imgContainer);
            },

            "uploading": function() {
                elems.beforeImage.hide();
                elems.afterImage.hide();
                elems.uploading.show();
            },

            "showValMsg": function(msg) {
                elems.valMsg.empty().append(
                    G.util.makeSpan(msg)
                );
            },

            "hideValMsg": function() {
                elems.valMsg.empty();
            }
        })

        _this.render("refreshUploaders");

        _this._showExistingImg = true;

        if (_this.image.exists()) {
            _this.render("afterImage");
        } else {
            _this.render("beforeImage");
        }
    },

    uploaded: function(response) {
        _this.render("hideValMsg");

        if (response.rc == 7) {
            _this.showValMsg("Sorry, that image's file size is too large (maximum 500 KB).");
            _this.image = new G.data.Image();
            _this.render("beforeImage");
            return;
        } else if (response.rc) {
            _this.showValMsg(response.msg);
            _this.image = new G.data.Image();
            _this.render("beforeImage");
            return;
        }

        _this.image = G.data.Image.fromServer(response.image);

        _this.render("afterImage");
        _this.trigger("upload", _this.image);
        _this.trigger("change");
    },

    cancel: function() {
        _this.render("refreshUploaders");
        if (_this.image.exists()) {
            _this.render("afterImage");
        } else {
            _this.render("beforeImage");
        }
    },

    deleteImage: function() {
        G.assert(_this.image.exists(), "No uploaded image to delete.");

        _this.render("hideValMsg");

        var oldImage = _this.image;
        _this.image = new G.data.Image();

        _this.render("beforeImage");
        _this.trigger("delete", oldImage);
        _this.trigger("change");
    },

    showValMsg: function(msg) {
        // Show a red message under the control
        // (useful for validation failures)
        _this.render("showValMsg", msg);
    },

    focus: function() {
        _this.controls.uploader.focus();
    }
});
