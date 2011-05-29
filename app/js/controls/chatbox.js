G.defineControl("ChatBox", {
    _init: function() {
        _this.createFields({
        });

        _this.style({
            "height": null,
            "width": null
        });
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            elems.container = $DIV().append(
            )
        );
    }
});
