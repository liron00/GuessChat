from tipfy.routing import Rule, HandlerPrefix

rules = [
    HandlerPrefix('guesschat.view.', [
        Rule('/guesschat.js', name='js', handler='JS'),
        Rule('/constants.js', name='js_constants', handler='JS_Constants'),

        Rule('/', name='home', handler='Home'),
        Rule('/about', name='about', handler='About')
    ])
]
