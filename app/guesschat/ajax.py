import logging
logging.getLogger().setLevel(logging.DEBUG)

from tipfy.app import Response
from tipfy.handler import RequestHandler
from tipfy import json
from google.appengine.ext import db

from guesschat.errors import *
from guesschat.writing import eventlogging

class GetHandlers(RequestHandler):
    pass

class PostHandlers(RequestHandler):
    def start_chat(self, fb_uid, fb_access_token):
        pass

class Ajax(GetHandlers, PostHandlers):
    def get(self, method):
        func = getattr(GetHandlers, method)
        return self.apply_handler(func, **dict(self.request.args))

    def post(self, method):
        func = getattr(PostHandlers, method)

        params = json.json_decode(self.request.form.get('params'))
        params = dict(
            (str(key), value) for key, value in params.iteritems()
        )
        return self.apply_handler(func, **params)

    def apply_handler(self, func, **kwargs):
        ''' Make all the AJAX methods return JSON '''

        if '_' in kwargs:
            # Browser caching buster
            del kwargs['_']

        try:
            response_obj = func(self, **kwargs)
        except Error, err:
            logging.info("%s: %s" % (name, err))
            response_obj = {
                'rc': err.value,
                'msg': err.message
            }
        except AssertionError, err:
            logging.exception(method)
            response_obj = {
                'rc': 2,
                'msg': 'Assert failed: %s' % (err.args[0] if err.args else '')
            }
        else:
            if response_obj is None:
                response_obj = {}
            if 'rc' not in response_obj:
                response_obj['rc'] = 0

        response = Response(
            json.json_encode(response_obj)
        )
        response.headers['content-type'] = 'application/json'
        return response
