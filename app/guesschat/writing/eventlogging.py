from google.appengine.ext import db

from models import *

def log_event(name, **properties):
    eventlog = EventLog(name=name, **properties)
    eventlog.put()
