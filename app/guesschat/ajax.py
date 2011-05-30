import logging

from google.appengine.ext import db
from google.appengine.api import urlfetch
from tipfy.app import Response
from tipfy.handler import RequestHandler
from tipfy.sessions import SessionMiddleware
from tipfy import json

from guesschat.models import *
from guesschat.errors import *
from guesschat.writing import eventlogging

waiter = None # User waiting to start chat

class GetHandlers(RequestHandler):
    pass

class PostHandlers(RequestHandler):
    def start_chat(self, fb_uid, fb_access_token):
        # Verify that fb_uid is accurate by testing its access token
        response = urlfetch.fetch(
            'https://graph.facebook.com/%s?access_token=%s' % (fb_uid, fb_access_token)
        )
        response_obj = json.json_decode(response.content)
        if 'error' in response_obj:
            raise BadAccessTokenError()
        elif 'username' not in response_obj:
            raise Error('FB graph node is not a user')

        user = User.get_or_insert(
            response_obj['id'],
            fb_access_token=fb_access_token
        )
        self.session['fb_uid'] = response_obj['id']

        self.log_event('start chat')


class Ajax(GetHandlers, PostHandlers):
    middleware = [SessionMiddleware()]

    def log_event(self, name, **properties):
        properties['fb_uid'] = self.session.get('fb_uid')
        properties['ip_address'] = self.request.remote_addr
        properties['path'] = self.request.path

        eventlogging.log_event(name, **properties)

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

        logging.getLogger().setLevel(logging.DEBUG)

        if '_' in kwargs:
            # Browser caching buster
            del kwargs['_']

        try:
            response_obj = func(self, **kwargs)
        except Error, err:
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
