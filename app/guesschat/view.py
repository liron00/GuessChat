import logging
logging.getLogger().setLevel(logging.DEBUG)

from tipfy.app import Response
from tipfy.handler import RequestHandler
from tipfyext.jinja2 import Jinja2Mixin
from google.appengine.ext import db

import js
from guesschat.writing import eventlogging

class ViewHandler(RequestHandler, Jinja2Mixin):
    def tmpl(self, path, **context):
        params = dict(context)

        if context.get('title'):
            params['title'] = context['title'] + ' | GuessChat'
        else:
            params['title'] = 'GuessChat'

        params['script_tags'] = js.get_script_tags()

        return self.render_response(path, **params)

    def log_event(self, name, **properties):
        properties['ip_address'] = self.request.remote_addr
        properties['path'] = self.request.path

        eventlogging.log_event(name, **properties)

class JS(ViewHandler):
    def get(self):
        response = Response(js.get_js(minify=False))
        response.headers['Content-Type'] = 'text/javascript'
        return response

class JS_Constants(ViewHandler):
    def get(self):
        response = Response(js.get_constants())
        response.headers['Content-Type'] = 'text/javascript'
        return response

class Home(ViewHandler):
    def get(self):
        self.log_event(
            'view home page'
        )

        return self.tmpl(
            'base.tmpl',
            script='home'
        )

class About(ViewHandler):
    def get(self):
        return self.tmpl(
            'about.tmpl',
            title='About'
        )
