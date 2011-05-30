from google.appengine.ext import db

class User(db.Model):
    # key_name: fb_uid
    fb_access_token = db.StringProperty()
    add_dt = db.DateTimeProperty(auto_now_add=True)

class ChatRoom(db.Model):
    users = db.ListProperty(db.Key)
    ender = db.ReferenceProperty(User)
    end_type = db.IntegerProperty()
    end_dt = db.DateTimeProperty()
    add_dt = db.DateTimeProperty(auto_now_add=True)

class EventLog(db.Expando):
    name = db.StringProperty()
