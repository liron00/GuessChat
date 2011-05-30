G.definePage("home", function() {
    var elems = {};

    $("#dynamic_body").empty().append(
        elems.homeSection = $DIV().css({
            "margin": 12
        }).append(
            $DIV().css({
                "margin-bottom": 12
            }).text("Welcome to the home page."),
            elems.startButton = new G.controls.Button().set({
                "text": "Enter"
            }).style({
                "width": 200,
                "height": 50,
                "padding": 12,
                "fontSize": 20
            }).bind({
                "click": function() {
                    enter();
                }
            }).renderHere(),
            $DIV().css({
                "margin-top": 20
            }).append(
                $("<fb:facepile></fb:facepile>")
            )
        ),
        elems.chatSection = $DIV().css({
            "margin": 12
        }).hide()
    );

    var enter = function() {
        var fbSession = FB.getSession();
        if (fbSession) {
            startChat();
        } else {
            FB.login(function(response) {
                if (response.session) {
                    startChat();
                } else {
                    // Cancelled FB login
                }
            });
        }
    };

    var chatUI;

    var startChat = function() {
        var fbSession = FB.getSession();

        elems.homeSection.hide();

        chatUI = new G.controls.ChatUI();

        elems.chatSection.show().append(
            chatUI.renderHere()
        );

        chatUI.requestNewChat();
        chatUI.focus();
    };
});
