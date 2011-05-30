G.defineData("ChatMessage", {
    _init: function(fromServer) {
        _this.createFields({
            "id": Number()
        });
    },

    _fromServer: function(data) {
        _this.set({
            "id": data.id,
            "userId": data.userId,
            "text": data.text
        });
    }
});
