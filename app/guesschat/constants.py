import os
import logging

from tipfy.app import current_app

client_constants = {
    'isLive': current_app.config['env']['is_live'],

    'facebookAppId': current_app.config['facebook']['app_id']
}
