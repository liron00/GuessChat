import os

client_constants = {
    'isLive': os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')
}
