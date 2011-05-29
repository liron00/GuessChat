G.defineControl("ChatUI", {
    _init: function() {
        _this.createFields({
        });

        _this.createField("controls", {
            "chatBox": new G.controls.ChatBox()
        });
    },

    _render: function() {
        var elems = _this.domElems;

        _this.domRoot.append(
            _this.controls.chatBox.renderHere()
        );
    }
});
