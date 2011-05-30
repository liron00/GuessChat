import logging

from google.appengine.ext import db
from google.appengine.api import urlfetch, channel
from tipfy.app import Response
from tipfy.handler import RequestHandler
from tipfy.sessions import SessionMiddleware
from tipfy import json

from guesschat.models import *
from guesschat.errors import *
from guesschat.writing import eventlogging
from guesschat.client import to_client, from_client

ready_chatroom = None

def channel_send(client_id, message_obj):
    channel.send_message(client_id, json.json_encode(message_obj))

class GetHandlers(RequestHandler):
    pass

class PostHandlers(RequestHandler):
    def start_chat(self, fb_uid, fb_access_token):
        global ready_chatroom

        # Verify that fb_uid is accurate by testing its access token
        response = urlfetch.fetch(
            'https://graph.facebook.com/%s?access_token=%s' % (fb_uid, fb_access_token)
        )
        response_obj = json.json_decode(response.content)
        if 'error' in response_obj:
            raise BadAccessTokenError()

        user = User.get_or_insert(
            response_obj['id'],
            fb_access_token=fb_access_token
        )
        self.session['fb_uid'] = response_obj['id']

        if ready_chatroom and ready_chatroom.users[0].name() == user.key().name():
             # If user starts two chatrooms in a row,
             # forget about the old one (leave it forever unjoined)
            ready_chatroom = None

        if ready_chatroom:
            chatroom = ready_chatroom
            chatroom.users.append(user.key())
            chatroom.put()

            ready_chatroom = None
            matched = True

            other_client_id = '%s_%s' % (
                chatroom.key().id(), chatroom.users[0].name()
            )
            channel_send(other_client_id, {
                'kind': 'partner_joined'
            })

        else:
            chatroom = ChatRoom(
                users = [user.key()]
            )
            chatroom.put()
            ready_chatroom = chatroom

            matched = False

        client_id = '%s_%s' % (
            chatroom.key().id(), user.key().name()
        )
        channel_token = channel.create_channel(client_id)

        self.log_event('start chat', matched=matched)

        return {
            'chatRoom': to_client.chatroom(chatroom),
            'channelToken': channel_token,
            'matched': matched
        }

    def send_chatmessage(self, chatmessage):
        fb_uid = self.session.get('fb_uid')
        assert fb_uid, 'No user'

        chatmessage = from_client.chatmessage(chatmessage, User(key_name=fb_uid))

        if not chatmessage.chatroom:
            raise Error('Missing or invalid chatroom')
        elif not any(user_key.name() == fb_uid for user_key in chatmessage.chatroom.users):
            raise Error('You are not in this chatroom.')
        elif chatmessage.chatroom.end_dt:
            raise Error('Chat has ended.')

        chatmessage.put()

        # Send the message on the other users' channels
        for user_key in chatmessage.chatroom.users:
            if user_key.name() != fb_uid:
                client_id = '%s_%s' % (
                    chatmessage.chatroom.key().id(), user_key.name()
                )
                channel_send(client_id, {
                    'kind': 'chatmessage',
                    'chatMessage': to_client.chatmessage(chatmessage)
                })

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
