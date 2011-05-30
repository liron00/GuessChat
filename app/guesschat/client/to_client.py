from guesschat.models import *

def to_client(func_name, *args, **kwargs):
    return globals()[func_name](*args, **kwargs)

def chatroom(chatroom):
    return {
        'className': 'ChatRoom',
        'id': chatroom.key().id()
    }

def chatmessage(chatmessage):
    return {
        'className': 'ChatMessage',
        'id': chatmessage.key().id(),
        'userId': chatmessage.user.key().name(),
        'text': chatmessage.text
    }

def user(user):
    return {
        'id': user.key().id()
    }
