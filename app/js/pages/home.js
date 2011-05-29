G.definePage("home", function() {
    $("#dynamic_body").empty().append(
        $DIV().text("Welcome to the home page."),
        $DIV().css({
            "margin-top": 12
        }).append(
            $("<fb:login-button>Login with Facebook</fb:login-button>")
        )
    );
});
