from google.appengine.ext import db

class User(db.Model):
    # key_name: fb_uid
    fb_access_token = db.StringProperty()
    random = db.FloatProperty()
    add_dt = db.DateTimeProperty(auto_now_add=True)

class ChatRoom(db.Model):
    users = db.ListProperty(db.Key)
    ender = db.ReferenceProperty(User)
    end_type = db.IntegerProperty()
    end_dt = db.DateTimeProperty()
    add_dt = db.DateTimeProperty(auto_now_add=True)

class ChatMessage(db.Model):
    chatroom = db.ReferenceProperty(ChatRoom)
    user = db.ReferenceProperty(User)
    text = db.StringProperty()
    add_dt = db.DateTimeProperty(auto_now_add=True)

class ChatGuess(db.Model):
    # key_name: '[chatroom id]_[user key name]'
    chatroom = db.ReferenceProperty(ChatRoom)
    user = db.ReferenceProperty(User)
    guess = db.ReferenceProperty(User, collection_name='chatguess_target_set')
    correct = db.BooleanProperty()
    add_dt = db.DateTimeProperty(auto_now_add=True)

class EventLog(db.Expando):
    name = db.StringProperty()
