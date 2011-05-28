from google.appengine.ext import db

class EventLog(db.Expando):
    name = db.StringProperty()
