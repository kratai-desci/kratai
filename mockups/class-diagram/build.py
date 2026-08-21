#!/usr/bin/env python3
"""Stitches head.html + app.js + data.json into dist.html - a single
self-contained file you can open directly in a browser."""
import os

d = os.path.dirname(os.path.abspath(__file__))

head = open(os.path.join(d, 'head.html')).read()
app = open(os.path.join(d, 'app.js')).read()
data = open(os.path.join(d, 'data.json')).read()

app = app.replace('/*__DATA__*/ null', data)

html = (
    '<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n' + head +
    '\n</head>\n<body>\n<script>' + app + '</script>\n</body>\n</html>'
)

out_path = os.path.join(d, 'dist.html')
open(out_path, 'w').write(html)
print('wrote', out_path, len(html), 'bytes')
