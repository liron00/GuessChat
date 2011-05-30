G.defineData("ChatMessage", {
    _init: function(fromServer) {
        _this.createFields({
            "id": Number(),
            "chatroomId": Number(),
            "userId": String(),
            "text": String()
        });
    },

    _fromServer: function(data) {
        _this.set({
            "id": data.id,
            "chatroomId": data.chatroomId,
            "userId": data.userId,
            "text": data.text
        });
    }
});
