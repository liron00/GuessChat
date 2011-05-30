import random

from google.appengine.ext import db

def get_random_uids(n, exclude=[]):
    from guesschat.models import *

    uids = set()
    for i in xrange(n):
        user_keys = User.all(keys_only=True).filter('random >=', random.random()).fetch(n)
        uids.update(key.name() for key in user_keys)
        uids.difference_update(exclude)
    if len(uids) < n:
        user_keys = User.all(keys_only=True).fetch(n + 1)
        uids.update(key.name() for key in user_keys)
        uids.difference_update(exclude)

    uids = list(uids)
    random.shuffle(uids)

    return uids
