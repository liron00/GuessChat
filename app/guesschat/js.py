from __future__ import with_statement

import os
import StringIO
import time
import logging

from tipfy import json
import jsmin

from guesschat import constants

jsdir = os.path.join(os.path.curdir, 'js')

_cached_js = {} # jsfilepath: {'modifytime': , 'js': }

def add_js_dir(js_file_paths, jsdirpath):
    path = os.path.join(jsdir, jsdirpath)
    for filename in os.listdir(path):
        if filename.endswith('.js') and os.path.isfile(os.path.join(path, filename)):
            js_file_paths.append(os.path.join(jsdirpath, filename))

def get_js_file_paths(deb=False):
    ''' Returns an ordered list of paths relative to the JS directory. '''

    js_file_paths = []

    # Lib
    for libfilename in (
        'jquery-1.4.2.js' if deb else 'jquery-1.4.2.min.js',
        'jquery-ui.min.js',
        'jquery.json.js',
        'jquery.prettydate.js',
        'jquery.elastic.min.js',
        'jquery.caret.js',
        'jquery.scrollTo.js',
        'jquery.hashchange.js',
        'date.js',
        'md5.js',
        'showdown.js'
    ):
        libfilepath = os.path.join('lib', libfilename)
        js_file_paths.append(libfilepath)

    # G Framework
    js_file_paths.append('class.js')
    js_file_paths.append('util.js')

    # G.Data
    js_file_paths.append('data.js')
    add_js_dir(js_file_paths, 'data')

    # G.Controls
    js_file_paths.append('control.js')
    add_js_dir(js_file_paths, 'controls')

    # G.Pages
    js_file_paths.append('page.js')
    add_js_dir(js_file_paths, 'pages')

    # Constants
    js_file_paths.append('constants.js')

    return js_file_paths

def set_g_constants():
    return 'G.constants = %s;' % json.json_encode(constants.client_constants)

def get_js_from_paths(file_paths, include_constants=False):
    output = StringIO.StringIO()

    def get_js_file(jsfilepath):
        path = os.path.join(jsdir, jsfilepath)
        modifytime = os.path.getmtime(path)

        cached = _cached_js.get(jsfilepath)
        cached_modifytime = cached['modifytime'] if cached else None
        if cached_modifytime == modifytime:
            return cached['js']

        logging.info('Reloading %s' % jsfilepath)

        file_output = StringIO.StringIO()
        file_output.write('/' + '*'*25 + jsfilepath + '*'*25 + '/' + '\n'*5)

        with open(path) as f:
            # Minify
            file_output.write(jsmin.jsmin(f.read()))

        file_output.write('\n'*5)

        js = file_output.getvalue()
        _cached_js[jsfilepath] = {'modifytime': modifytime, 'js': js}
        return js

    for jsfilepath in file_paths:
        output.write(get_js_file(jsfilepath))

    if include_constants:
        output.write('/' + '*'*25 + 'Dynamic Constants' + '*'*25 + '/' + '\n'*5)
        output.write(set_g_constants())

    return output.getvalue()

def get_js(include_constants=False):
    return get_js_from_paths(get_js_file_paths(), include_constants=include_constants)

def get_constants():
    return set_g_constants() + "G.processConstants();"

def get_script_tags(debugging=False):
    if debugging:
        js_file_paths = get_js_file_paths(deb=True)
        return [
            '''<script type="text/javascript" src="/js/%s"></script>''' % (
                jsfilepath.replace('\\', '/')
            ) for jsfilepath in js_file_paths
        ] + [
            '''<script type="text/javascript">%s</script>''' % get_constants()
        ]

    else:
        return [
            '''<script type="text/javascript" src="/guesschat.js"></script>''',
            '''<script type="text/javascript" src="/constants.js"></script>'''
        ]
