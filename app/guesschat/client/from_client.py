from guesschat.models import *

def from_client(func_name, *args, **kwargs):
    return globals()[func_name](*args, **kwargs)

def chatmessage(chatmessage_data, user):
    chatmessage = ChatMessage() # Client can't supply id

    chatmessage.chatroom = ChatRoom.get_by_id(chatmessage_data['chatroomId'])
    chatmessage.user = user
    chatmessage.text = chatmessage_data['text']
    return chatmessage
