from google.appengine.ext import db

class User(db.Model):
    # key_name: fb_uid
    fb_access_token = db.StringProperty()
    add_dt = db.DateTimeProperty(auto_now_add=True)

class EventLog(db.Expando):
    name = db.StringProperty()
