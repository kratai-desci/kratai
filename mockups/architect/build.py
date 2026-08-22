#!/usr/bin/env python3
"""Stitches head.html + three.module.min.js + app.js + both datasets into
dist.html - a single self-contained file you can open directly in a browser.
This mockup unifies the layer-stack and class-diagram views behind one
switcher, so app.js embeds two datasets (data-layer.json for the 3D
drill-down, data-class.json for the 2D class diagram) via two distinct
placeholders. three.js is loaded as a real ES module (no deprecated UMD
global build): its minified source is base64-inlined directly into app.js's
import statement as a data: URI, so the page needs neither an import map
(unsupported in older Safari) nor any network request at runtime - just
plain `import ... from "<url>"`, which has worked in every ES-module-capable
browser since modules shipped."""
import base64
import os

d = os.path.dirname(os.path.abspath(__file__))

head = open(os.path.join(d, 'head.html')).read()
three = open(os.path.join(d, 'three.module.min.js'), 'rb').read()
app = open(os.path.join(d, 'app.js')).read()
data_layer = open(os.path.join(d, 'data-layer.json')).read()
data_class = open(os.path.join(d, 'data-class.json')).read()

app = app.replace('/*__DATA_LAYER__*/ null', data_layer)
app = app.replace('/*__DATA_CLASS__*/ null', data_class)

three_data_uri = 'data:text/javascript;base64,' + base64.b64encode(three).decode('ascii')
app = app.replace("from 'three';", "from '%s';" % three_data_uri, 1)

html = (
    '<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n' + head +
    '\n</head>\n<body>\n<script type="module">' + app +
    '</script>\n</body>\n</html>'
)

out_path = os.path.join(d, 'dist.html')
open(out_path, 'w').write(html)
print('wrote', out_path, len(html), 'bytes')
