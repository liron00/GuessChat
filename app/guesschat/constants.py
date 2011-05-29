import os
import logging

from tipfy.app import current_app

client_constants = {
    'isLive': os.environ.get('SERVER_SOFTWARE', '').startswith('Dev'),

    'fbAppId': current_app.config['facebook']['app_id']
}
