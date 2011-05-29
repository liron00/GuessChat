import os
import logging

from tipfy.app import current_app

client_constants = {
    'isLive': current_app.config['env']['is_live'],

    'fbAppId': current_app.config['facebook']['app_id']
}
