from tipfy.app import Response
from tipfy.handler import RequestHandler
from tipfyext.jinja2 import Jinja2Mixin

class ViewHandler(RequestHandler, Jinja2Mixin):
    def tmpl(self, path, **context):
        params = dict(context)

        if context.get('title'):
            params['title'] = context['title'] + ' | GuessChat'
        else:
            params['title'] = 'GuessChat'

        return self.render_response(path, **params)

class Home(ViewHandler):
    def get(self):
        return self.tmpl(
            'base.tmpl',
            contents='yo:%s' % self.app.debug
        )

class About(ViewHandler):
    def get(self):
        return self.tmpl(
            'about.tmpl',
            title='About'
        )
