from google.appengine.ext import db

from guesschat.models import *

def log_event(name, **properties):
    eventlog = EventLog(name=name, **properties)
    eventlog.put()
