from tipfy.app import Response
from tipfy.handler import RequestHandler
from tipfyext.jinja2 import Jinja2Mixin

class ViewHandler(RequestHandler, Jinja2Mixin):
    def tmpl(self, path, **context):
        return self.render_response(path, **context)

class Home(ViewHandler):
    def get(self):
        return self.tmpl(
            'base.tmpl'
        )

class About(ViewHandler):
    def get(self):
        return self.tmpl(
            'about.tmpl'
        )
