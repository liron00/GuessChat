from tipfy.app import Response
from tipfy.handler import RequestHandler
from tipfyext.jinja2 import Jinja2Mixin
from google.appengine.ext import db

from guesschat.writing import eventlogging

class ViewHandler(RequestHandler, Jinja2Mixin):
    def tmpl(self, path, **context):
        params = dict(context)

        if context.get('title'):
            params['title'] = context['title'] + ' | GuessChat'
        else:
            params['title'] = 'GuessChat'

        return self.render_response(path, **params)

    def log_event(self, name, **properties):
        properties['ip_address'] = self.request.remote_addr
        properties['path'] = self.request.path

        eventlogging.log_event(name, **properties)

class Home(ViewHandler):
    def get(self):
        self.log_event(
            'view home page'
        )

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
