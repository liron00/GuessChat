from tipfy.routing import Rule, HandlerPrefix

rules = [
    HandlerPrefix('guesschat.view.', [
        Rule('/', name='home', handler='Home'),
        Rule('/about', name='about', handler='About')
    ])
]
