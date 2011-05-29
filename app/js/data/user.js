/*
 * Quixey user
*/

G.defineData("User", {
    _init: function(fromServer) {
        _this.createFields({
            "id": Number(),
            "username": String(),
            "firstName": String(),
            "lastName": String(),
            "karma": Number(),
            "image": new G.data.Image(),
            "addDT": new Date(),
            "modifyDT": new Date(),
            "lastLoginDT": new Date(),

            "gravatarHash": null,

            "_email": fromServer? null : String(),
            "_privileges": fromServer? null : {}, // {privilegeId: true} dict
            "_authors": fromServer? null : [],
            "_partners": fromServer? null : []
        });
    },

    _fromServer: function(data) {
        _this.set({
            "id": data.id,
            "username": data.username,
            "firstName": data.firstName,
            "lastName": data.lastName,
            "karma": data.karma,
            "image": data.image? new G.data.Image(data.image) : new G.data.Image(),
            "gravatarHash": data.gravatarHash,
            "addDT": new Date(data.addDT),
            "modifyDT": new Date(data.modifyDT),
            "lastLoginDT": new Date(data.lastLoginDT)
        });

        if (data.email) {
            _this.set("_email", data.email);
        }

        if (data.privileges) {
            _this.set("_privileges", data.privileges);
        }

        if (data.authors) {
            _this.set("_authors", $.map(data.authors, G.data.Author.fromServer));
        }

        if (data.partners) {
            _this.set("_partners", $.map(data.partners, G.data.Partner.fromServer));
        }

        if (!_this.image.exists()) {
            // Make a gravatar
            var size = 106;
            var gravatarHash;
            if (_this.gravatarHash) {
                gravatarHash = _this.gravatarHash;
            } else {
                var gravatarId = (_this._email || "").toLowerCase() || ("quixey_user_" + _this.id);
                gravatarHash = MD5.hex_md5(gravatarId);
            }
            _this.set("image", new G.data.Image({
                "path": G.constants.gravatarDomain + "/avatar/" + gravatarHash + "?d=wavatar&r=pg&s=" + size
            }));
        }
    },

    getPageUrl: function() {
        return "/user/" + _this.username.toLowerCase();
    },

    getName: function() {
        var name = null;

        if (_this.firstName) {
            name = _this.firstName;
        }

        if (_this.lastName) {
            if (name) {
                name += " " + _this.lastName;
            } else {
                name = _this.lastName;
            }
        }

        return name;
    },

    hasAuthor: function(author) {
        var found = false;
        $.each(_this.get("_authors"), function(i, a) {
            if (a.key() == author.key()) {
                found = true;
                return false;
            }
        });
        return found;
    },

    hasPartner: function(partner) {
        var found = false;
        $.each(_this.get("_partners"), function(i, p) {
            if (p.key() == partner.key()) {
                found = true;
                return false;
            }
        });
        return found;
    },

    hasPrivilege: function() {
        // Takes privilege names as arguments,
        // returns true if user has any of the named privileges

        if (_this.exists()) {
            G.assert(_this._privileges, "Privileges are not loaded for " + _this.toString());
        } else if (!_this._privileges) {
            return false;
        }

        var privilegeFound = false;
        $.each(arguments, function(i, privilegeName) {
            if (_this._privileges[G.constants.privilege[privilegeName]]) {
                privilegeFound = true;
                return false;
            }
        });
        return privilegeFound;
    },

    getPrivileges: function() {
        return G.util.dictKeys(_this._privileges);
    },

    makePrivilegesList: function() {
        G.assert(_this._privileges, "Privileges are not loaded for " + _this.toString());

        if (G.util.objIsEmpty(_this._privileges)) {
            return $SPAN().css("font-style", "italic").text("[no privileges]");
        }

        return $SPAN().text($.map(
            G.util.dictKeys(_this._privileges),
            function(privilegeId) {
                return G.util.getKey(G.constants.privilege, privilegeId);
            }
        ).join(", "));
    },

    makeLink: function() {
        return G.util.makeLink(_this.username, _this.getPageUrl());
    },

    makeImage: function() {
        return new G.controls.ImageViewer(_this.image).style({
            "width": 108,
            "height": 150
        }).renderHere()
    },

    makeThumbnail: function(imageOnLeft, highlights, size) {
        size = size || 32;

        var nameKarma =
            $TD().css({
            }).append(
                $DIV().append(
                    G.util.makeHighlightedText(
                        _this.username,
                        highlights || []
                    )
                ),
                $DIV().css({
                    "text-align": imageOnLeft? "left" : "right",
                    "font-weight": "bold"
                }).append(
                    G.util.commaSeparate(_this.karma)
                ).hide()
            );
        var avatar =
            $TD().append(
                new G.controls.ImageViewer(_this.image).set({
                    "centerX": true
                }).style({
                    "width": size,
                    "height": size,
                    "background": "#FFF"
                }).renderHere()
            );
        if (imageOnLeft) {
            avatar.css("padding-right", size / 8);
        } else {
            avatar.css("padding-left", size / 8);
        }
        var table_contents =
            imageOnLeft?
            [ avatar, nameKarma ] :
            [ nameKarma, avatar ];
        return G.util.makeLink(
            G.util.makeTable(table_contents).css({
                "display": "inline-table",
                "vertical-align": "middle"
            }),
            _this.getPageUrl(),
            null,
            null,
            {
                "text-decoration": "none"
            }
        ).hover(
            function() {
                nameKarma.css("text-decoration", "underline");
            },
            function() {
                nameKarma.css("text-decoration", "none");
            }
        );
    }
});
