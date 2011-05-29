import os

config = {}

config['env'] = {
    'is_live': not os.environ.get('SERVER_SOFTWARE', '').startswith('Dev')
}

if config['env']['is_live']:
    config['facebook'] = {
        'app_id': '169506446443336',
        'api_key': '8668d2b2402988be94753e1cfb28159d',
        'api_secret': '81e05da154aee184d12450cfdef04344'
    }
else:
    config['facebook'] = {
        'app_id': '156200234447164',
        'api_key': '3ee8364fa4315a7e3844eff047900a38',
        'api_secret': '6a35fc6901a9943637823cbf88bb7eba'
    }
