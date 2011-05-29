/*
 * Displays an image with zooming and other functionality
 *
 * Setting the style.width and/or style.height properties to define
 * a constraint on the zoomed out dimensions, and it will auto-scale
 * to meet the constraint.
 *
 * Set centerX and/or centerY to center the zoomed-out image in its rectangle
 * along one or both dimensions defined by style.width and style.height
*/

G.defineControl("ImageViewer", {
    _init: function(image) {
        // Properties
        _this.createFields({
            "image": image,
            "caption": null,
            "zoomable": false, // auto-false if height and width are not set
            "centerX": false, // auto-false if width not set
            "centerY": false, // auto-false if height not set
            "pointlessZoom": false, // if true, show mag glass cursor for images too small to zoom
            "clickable": false, // if true, show hand cursor (when not showing mag glass)
            "transparent": false,
            "stretch": false // if true, stretch image's width or height to _this.style.width or height
        });

        // State
        _this.createFields({
            "selected": false,
            "zoomedIn": false,
            "_imgSize": null // image's natural dimensions
        });

        _this.style({
            "width": null, // if necessary, shrinks to this width (properly scaled)
            "height": null, // if necessary, shrinks to this height (properly scaled)
            "minWidth": null,
            "minHeight": null,

            //Constraints on zooming
            "zoomWidth": null, // same as width attribute, but after zoom
            "zoomHeight": null, // same as height attribute, but after zoom
            "zoomBox": {
                // boundary for zoomed-in image,
                // in absolute document coordinates
                // (each one defaults to viewport)
                "left": null,
                "right": null,
                "top": null,
                "bottom": null
            },
            "zoomZIndex": 100,
            "viewportPadding": {
                // affects how viewport constrains zoomed-in
                // size and position
                "left": 20,
                "right": 20,
                "top": 20,
                "bottom": 20
            },

            "border": {
                "width": 1,
                "color": "#CCC"
            },
            "background": "transparent",
            "selectBorder": {
                "width": 4,
                "color": "#449"
            },
            "zoomBorder": {
                "width": 4,
                "color": "#449"
            },
            "zoomHalo": {
                // a translucent border around the zoomed-in image
                "width": 5,
                "color": "#DDD",
                "opacity": 0.2
            },
            "captionBorder": {
                "color": "#449"
            },
            "captionColor": "#000",
            "captionBackground": "#BBD",
            "captionOpacity": 1,
            "smallCaptionFontSize": 10,
            "captionFontSize": 12,
            "captionMargin": 4,
            "captionMoreHeight": 0
        });

        _this.createEvents("click", "load", "loadError", "mouseOver", "mouseOut");
    },

    _render: function() {
        var elems = _this.domElems;

        G.assert(_this.image.isValid(), _this.toString() + " needs valid image to render.");

        _this.domRoot.css({
            "position": "relative"
        });

        _this.domRoot.append(
            elems.imgContainer = $DIV().css({
                "position": "relative",
                "overflow": "hidden",
                "width": _this.style.width || "",
                "height": _this.style.height || ""
            }).append(
                elems.img = G.util.$IMG(_this.image.getPath()).attr({
                    "title": _this.caption || ""
                }).css({
                    "border-width": _this.style.border.width,
                    "border-color": _this.style.border.color,
                    "border-style": "solid",
                    "background": _this.style.background
                }).hide(),
                elems.captionContainer = $DIV().css({
                    "text-align": "center",
                    "font-size": _this.style.smallCaptionFontSize,
                    "background": _this.style.captionBackground,
                    "font-weight": "bold",
                    "color": _this.style.captionColor,
                    "opacity": _this.style.captionOpacity,
                    "border-style": "solid",
                    "border-color": _this.style.captionBorder.color || _this.style.border.color,
                    "border-width": _this.style.border.width,
                    "overflow": "hidden"
                }).append(
                    elems.caption = $DIV().css({
                        "margin": _this.style.captionMargin
                    }).text(_this.caption || "")
                ).hide(),
                elems.captionMore = $DIV().css({
                    "position": "absolute",
                    "height": _this.style.captionMoreHeight,
                    "text-align": "center",
                    "font-size": _this.style.smallCaptionFontSize,
                    "background": "#000",
                    "border": "1px solid #000",
                    "color": "#FFF",
                    "font-weight": "bold",
                    "opacity": 0.7
                }).append(
                    $DIV().css({
                        "margin": 4
                    }).text(". . .")
                ).hide()
            ).hover(
                _this.func(function() {
                    _this.trigger("mouseOver");
                }),
                _this.func(function() {
                    if (!_this.selected) {
                        _this.trigger("mouseOut");
                    }
                })
            ).mousedown(_this.click)
        );

        if ($.browser.mozilla) {
            elems.captionMore.css("cursor", "-moz-zoom-in");
        } else {
            elems.captionMore.css("cursor", "url(" + G.util.imgPath("zoomin.cur") + "), pointer");
        }

        $.extend(_this.render, {
            select: function() {
                if (_this.selected) {
                    return;
                }
                _this.selected = true;

                var zoomedOutSize = _this.getZoomedOutSize();

                elems.imgContainer.append(
                    elems.selectBorder = $DIV().css({
                        "position": "absolute",
                        "z-index": _this.style.zoomZIndex,
                        "top": 0,
                        "width": zoomedOutSize.width - 2*_this.style.selectBorder.width,
                        "height": zoomedOutSize.height - 2*_this.style.selectBorder.width,
                        "border-width": _this.style.selectBorder.width,
                        "border-color": _this.style.selectBorder.color,
                        "border-style": "solid",
                        "cursor": elems.img.css("cursor")
                    })
                );
            },

            deselect: function() {
                if (!_this.selected) {
                    return;
                }
                _this.selected = false;

                elems.selectBorder.remove();
            },

            zoomIn: function() {
                // Precondition: zoomed out, have _this._imgSize fetched

                var zoomedInSize = _this.getZoomedInSize();
                var zoomedOutSize = _this.getZoomedOutSize();

                if (zoomedInSize.width <= zoomedOutSize.width && !_this.caption) {
                    // There's no reason to have a separate zoomed-in state
                    return;
                }

                _this.zoomedIn = true;

                elems.imgContainer.hide();
                if (elems.selectBorder) {
                    elems.selectBorder.hide();
                }

                // Make a zoomer div that is absolutely positioned over the
                // document so that this control can transcend its containers.
                var absoluteCenter = _this.getAbsoluteCenter();
                $("body").append(
                    elems.zoomer = $DIV().css({
                        "position": "absolute",
                        "z-index": _this.style.zoomZIndex,
                        "left": absoluteCenter.left - zoomedOutSize.width/2 - _this.style.zoomHalo.width,
                        "top": absoluteCenter["top"] - zoomedOutSize.height/2 - _this.style.zoomHalo.width
                    }).empty().append(
                        elems.zoomerTop = $DIV().css({
                            "height": _this.style.zoomHalo.width
                        }),
                        G.util.makeTable([
                            elems.zoomerLeft = $TD().css({
                                "width": _this.style.zoomHalo.width
                            }),
                            elems.zoomerBody = $TD().css({
                                "width": zoomedOutSize.width,
                                "background-color": _this.transparent? "" : "#FFF"
                            }).mousedown(_this.zoomOut).append(
                                elems.zoomerImg = G.util.$IMG(_this.image.getPath()).css({
                                    "width": zoomedOutSize.width,
                                    "height": zoomedOutSize.height,
                                    "display": "block",
                                    "border-width": _this.style.zoomBorder.width,
                                    "border-color": _this.style.zoomBorder.color,
                                    "border-style": "solid"
                                }),
                                elems.zoomerCaptionContainer = $DIV().css({
                                    "position": "relative",
                                    "top": Math.min(0, -_this.style.zoomBorder.width + 2),
                                    "text-align": "center",
                                    "font-size": _this.style.captionFontSize,
                                    "background": _this.style.captionBackground,
                                    "font-weight": "bold",
                                    "color": _this.style.captionColor,
                                    "opacity": _this.style.captionOpacity,
                                    "border-style": "solid",
                                    "border-color": _this.style.captionBorder.color || _this.style.zoomBorder.color,
                                    "border-width": _this.style.zoomBorder.width,
                                    "border-top": "none"
                                }).append(
                                    elems.zoomerCaption = $DIV().css({
                                        "padding": 4
                                    }).text(_this.caption || "")
                                ).hide()
                            ),
                            elems.zoomerRight = $TD().css({
                                "width": _this.style.zoomHalo.width
                            })
                        ]),
                        elems.zoomerBottom = $DIV().css({
                            "height": _this.style.zoomHalo.width
                        })
                    )
                );

                if ($.browser.mozilla) {
                    elems.zoomerBody.css("cursor", "-moz-zoom-out");
                } else {
                    elems.zoomerBody.css("cursor", "url(" + G.util.imgPath("zoomout.cur") + "), pointer");
                }

                var doAfterZoomIn = _this.func(function() {
                    elems.zoomerLeft.add(elems.zoomerTop).css({
                        "background-color": _this.style.zoomHalo.color,
                        "opacity": _this.style.zoomHalo.opacity
                    });
                    elems.zoomerRight.add(elems.zoomerBottom).css({
                        "background-color": _this.style.zoomHalo.color,
                        "opacity": _this.style.zoomHalo.opacity
                    });

                    if (_this.caption) {
                        elems.zoomerCaptionContainer.show("slide", {"direction":"up"}, "fast");
                    }
                });

                if (
                    zoomedInSize.width > zoomedOutSize.width ||
                    zoomedInSize.height > zoomedOutSize.height ||
                    Math.abs(zoomedInSize.left + zoomedInSize.width/2 - absoluteCenter.left) > 2 ||
                    Math.abs(zoomedInSize["top"] + zoomedInSize.height/2 - absoluteCenter["top"]) > 2
                ) {
                    elems.zoomer.animate({
                        "left": zoomedInSize.left - zoomedInSize.width/2 - _this.style.zoomBorder.width - _this.style.zoomHalo.width,
                        "top": zoomedInSize["top"] - zoomedInSize.height/2 - _this.style.zoomBorder.width - _this.style.zoomHalo.width
                    }, 100, doAfterZoomIn);
                } else {
                    doAfterZoomIn();
                }

                elems.zoomerImg.animate({
                    "width": zoomedInSize.width,
                    "height": zoomedInSize.height
                }, 100);
            },

            zoomOut: function() {
                // Precondition: zoomed in

                elems.zoomerLeft.add(elems.zoomerRight).add(elems.zoomerTop).add(elems.zoomerBottom).css({
                    "background-color": "",
                    "opacity": 1
                });

                var zoomedOutSize = _this.getZoomedOutSize();
                var absoluteCenter = _this.getAbsoluteCenter();

                _this.zoomedIn = false;

                var doAfter = _this.func(function() {
                    elems.zoomer.remove();
                    elems.imgContainer.show();
                    if (_this._shouldShowCaption()) {
                        elems.captionContainer.hide().show("slide", {"direction":"down"}, "fast");
                    }
                });

                if (_this.caption) {
                    elems.zoomerCaptionContainer.css({
                        "overflow": "hidden"
                    }).animate({
                        "height": 0
                    }, 100);
                }

                elems.zoomer.animate({
                    "left": absoluteCenter.left - zoomedOutSize.width/2 - _this.style.zoomHalo.width,
                    "top": absoluteCenter["top"] - zoomedOutSize.height/2 - _this.style.zoomHalo.width
                }, 100, doAfter);

                elems.zoomerImg.animate({
                    "width": zoomedOutSize.width,
                    "height": zoomedOutSize.height
                }, 100);
            },

            zoomedOut: function() {
                if (elems.zoomer) {
                    elems.zoomer.remove();
                    elems.imgContainer.show();
                }

                var zoomedOutSize = _this.getZoomedOutSize();

                if (_this.centerX) {
                    elems.imgContainer.css("left", (_this.style.width || zoomedOutSize.width)/2 - zoomedOutSize.width/2);
                }
                if (_this.centerY) {
                    elems.imgContainer.css("top", (_this.style.height || zoomedOutSize.height)/2 - zoomedOutSize.height/2);
                }

                _this.render("caption");
            },

            border: function() {
                var zoomedOutSize = _this.getZoomedOutSize();

                elems.img.css({
                    "border-width": _this.style.border.width,
                    "border-color": _this.style.border.color,
                    "width": zoomedOutSize.width - 2*_this.style.border.width,
                    "height": zoomedOutSize.height - 2*_this.style.border.width
                });

                if (_this.zoomedOut) {
                    _this.render("zoomedOut");
                }
            },

            caption: function(height, animate) {
                if (_this._shouldShowCaption()) {
                    elems.captionContainer.show();
                }

                if (_this.caption && _this.isZoomable()) {
                    var zoomedOutSize = _this.getZoomedOutSize();

                    elems.captionContainer.css({
                        "position": "absolute",
                        "width": zoomedOutSize.width - 2*_this.style.border.width
                    });

                    if ($.browser.mozilla) {
                        elems.captionContainer.css("cursor", "-moz-zoom-in");
                    } else {
                        elems.captionContainer.css("cursor", "url(" + G.util.imgPath("zoomin.cur") + "), pointer");
                    }

                    if (!height) {
                        var captionHeight = G.util.getTextHeight(
                            $SPAN().text(_this.caption).css("font-weight","bold"),
                            zoomedOutSize.width - 2*_this.style.captionMargin - 2*_this.style.border.width,
                            _this.style.smallCaptionFontSize
                        );

                        height = captionHeight + 2*_this.style.captionMargin;
                    }

                    if (height > zoomedOutSize.height * 0.4) {
                        height = 0.33 * zoomedOutSize.height;

                        elems.captionMore.show().css({
                            "width": zoomedOutSize.width - 2*_this.style.border.width,
                            "top": zoomedOutSize.height - _this.style.captionMoreHeight
                        });
                    } else {
                        elems.captionMore.hide();
                    }

                    elems.captionContainer.css({
                        "height": height,
                        "top": zoomedOutSize.height - height - 2*_this.style.border.width
                    });
                }
            }
        });

        _this._imgSize = null;
        G.util.fetchImgSize(_this.image.getPath(), _this.func(function(size) {
            if (!size) {
                _this.trigger("loadError");
                return;
            }

            _this._imgSize = size;

            var zoomedOutSize = _this.getZoomedOutSize();
            var zoomedInSize = _this.getZoomedInSize();

            if (_this.centerX && _this.style.width) {
                _this.domRoot.css("width", _this.style.width);
            } else {
                _this.domRoot.css("width", zoomedOutSize.width);
            }
            if (_this.centerY && _this.style.height) {
                _this.domRoot.css("height", _this.style.height);
            } else {
                _this.domRoot.css("height", zoomedOutSize.height);
            }

            elems.img.css({
                "vertical-align": "top",
                "width": zoomedOutSize.width - 2*_this.style.border.width,
                "height": zoomedOutSize.height - 2*_this.style.border.width
            }).show();
            elems.imgContainer.css({
                "width": zoomedOutSize.width,
                "height": zoomedOutSize.height
            });

            if ((_this.isZoomable() && (
                zoomedInSize.width > zoomedOutSize.width ||
                zoomedInSize.height > zoomedOutSize.height ||
                _this.caption
            )) || _this.pointlessZoom) {
                // Show zoomable cursor
                if ($.browser.mozilla) {
                    elems.img.css("cursor", "-moz-zoom-in");
                } else {
                    elems.img.css("cursor", "url(" + G.util.imgPath("zoomin.cur") + "), pointer");
                }

            } else if (_this.clickable) {
                elems.img.css("cursor", "pointer");
            }

            if (_this.isZoomable() && _this.zoomedIn) {
                _this.render("zoomIn");
            } else {
                _this.render("zoomedOut");
            }

            // Loading may be asynchronous or synchronous so
            // this makes the event consistent
            setTimeout(_this.func(function() {
                _this.trigger("load");
            }), 1);
        }));
    },

    isZoomable: function() {
        return (_this.style.height || _this.style.width) && _this.zoomable;
    },

    getAbsoluteCenter: function() {
        var zoomedOutSize = _this.getZoomedOutSize();
        var center = _this.domRoot.offset();

        if (_this.centerX && _this.style.width) {
            center.left += (_this.style.width || zoomedOutSize.width)/2;
        } else {
            center.left += zoomedOutSize.width/2;
        }
        if (_this.centerY && _this.style.height) {
            center["top"] += (_this.style.height || zoomedOutSize.height)/2;
        } else {
            center["top"] += zoomedOutSize.height/2;
        }

        return center;
    },

    getZoomedInSize: function() {
        G.assert(_this._imgSize, "Too early for " + _this.toString() + " getZoomedInSize.");

        var captionHeightGuess = 0;
        if (_this.caption) {
            // Assume the image will get zoomed in to its full size,
            // then measure the resulting captionHeight (which depends on
            // the zoomed in width, and so might actually be larger if the
            // zoomed in width is smaller)
            captionHeightGuess = G.util.getTextHeight(_this.caption, _this._imgSize.width, _this.style.captionFontSize);
        }

        // Figure out zoomed-in size

        var screenFitWidth = $(window).width() - _this.style.viewportPadding.left - _this.style.viewportPadding.right;
        var screenFitHeight = $(window).height() - _this.style.viewportPadding["top"] - _this.style.viewportPadding.bottom;

        var boxFitWidth;
        var boxFitHeight;
        if (_this.style.zoomBox.left && _this.style.zoomBox.right) {
            boxFitWidth = _this.style.zoomBox.right - _this.style.zoomBox.left;
        }
        if (_this.style.zoomBox["top"] && _this.style.zoomBox.bottom) {
            boxFitHeight = _this.style.zoomBox.bottom - _this.style.zoomBox["top"];
        }

        var zoomWidth = Math.min(
            _this.style.zoomWidth || screenFitWidth,
            boxFitWidth || screenFitWidth,
            screenFitWidth
        );
        var zoomHeight = Math.min(
            _this.style.zoomHeight || screenFitHeight,
            boxFitHeight || screenFitHeight,
            screenFitHeight
        );

        // Incorporate the captionHeightGuess to make sure size.height is small enough
        size = G.util.shrinkToFit(
            _this._imgSize.width,
            _this._imgSize.height + captionHeightGuess,
            zoomWidth - 2*_this.style.zoomBorder.width - 2*_this.style.zoomHalo.width,
            zoomHeight - 2*_this.style.zoomBorder.width - 2*_this.style.zoomHalo.width
        );

        // Reduce size.height to represent just the image height, without the caption
        size.height = size.width * _this._imgSize.height / _this._imgSize.width;

        bSize = {
            "width": size.width + 2*_this.style.zoomBorder.width + 2*_this.style.zoomHalo.width,
            "height": size.height + 2*_this.style.zoomBorder.width + 2*_this.style.zoomHalo.width
        };
        var center = _this.getAbsoluteCenter();

        // First apply the viewPort's constraints on center position

        var captionHeight = 0;
        if (_this.caption) {
            captionHeight = G.util.getTextHeight(_this.caption, size.width, _this.style.captionFontSize);
        }

        center.left = Math.max(
            center.left,
            _this.style.viewportPadding.left + bSize.width/2
        );
        center.left = Math.min(
            center.left,
            $(window).width() - _this.style.viewportPadding.right - bSize.width/2
        );

        center["top"] = Math.max(
            center["top"],
            $(window).scrollTop() + _this.style.viewportPadding["top"] + bSize.height/2
        );
        center["top"] = Math.min(
            center["top"],
            $(window).scrollTop() + $(window).height() - _this.style.viewportPadding.bottom - captionHeight - bSize.height/2
        );

        // Then apply the zoomBox's constraints on center position
        // (they are higher priority)

        center.left = Math.max(
            center.left,
            _this.style.zoomBox.left? _this.style.zoomBox.left + bSize.width/2 : center.left
        );
        center.left = Math.min(
            center.left,
            _this.style.zoomBox.right? _this.style.zoomBox.right - bSize.width/2 : center.left
        );

        center["top"] = Math.max(
            center["top"],
            _this.style.zoomBox["top"]? _this.style.zoomBox["top"] + bSize.height/2 : center["top"]
        );
        center["top"] = Math.min(
            center["top"],
            _this.style.zoomBox.bottom? _this.style.zoomBox.bottom - captionHeight - bSize.height/2 : center["top"]
        );

        // Include center coordinates as part of return value
        $.extend(size, center);

        return size;
    },

    zoomOut: function() {
        _this.render("zoomOut");
    },

    getZoomedOutSize: function() {
        if (_this._imgSize) {
            if (_this.stretch) {
                return G.util.scaleToFit(
                    _this._imgSize.width,
                    _this._imgSize.height,
                    _this.style.width,
                    _this.style.height
                );
            } else {
                var size = G.util.shrinkToFit(
                    _this._imgSize.width,
                    _this._imgSize.height,
                    _this.style.width,
                    _this.style.height
                );
                return {
                    "width": Math.max(_this.style.minWidth || 0, size.width),
                    "height": Math.max(_this.style.minHeight || 0, size.height)
                }
            }

        } else {
            return {
                "width": _this.style.width,
                "height": _this.style.height
            };
        }
    },

    click: function() {
        if (_this.trigger("click")) {
            if (_this.isZoomable()) {
                if (!_this._imgSize) {
                    // We don't know how big the image really is
                    return;
                }

                _this.render("zoomIn");
            }
        }
    },

    reset: function() {
        // Call this to make sure absolutely positioned zoomed-in 
        // images don't just stay out there.
        _this.zoomedIn = false;
        _this.render("zoomedOut");
    },

    select: function() {
        _this.render("select");
    },

    deselect: function() {
        _this.render("deselect");
    },

    _shouldShowCaption: function() {
        return _this.caption && (_this.style.width >= 100 || !_this.style.width) && (_this.style.height >= 100 || !_this.style.height);
    },

    _cleanup: function() {
        var elems = _this.domElems;
        if (elems.selectBorder) {
            elems.selectBorder.remove();
        }
        if (elems.zoomer) {
            elems.zoomer.remove();
        }
    }
});
