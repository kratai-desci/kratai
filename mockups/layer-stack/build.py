#!/usr/bin/env python3
"""Stitches head.html + three.min.js + app.js + data.json into dist.html - a
single self-contained file you can open directly in a browser. Deliberately
uses three.js's classic UMD build (not ES modules) as a plain <script> tag:
it's the one loading method that works everywhere, including plain file://
double-click with no local server, across every browser and version. The
UMD build does print a console deprecation warning on r150+ - that's the
known, accepted tradeoff for reliability over a clean console."""
import os

d = os.path.dirname(os.path.abspath(__file__))

head = open(os.path.join(d, 'head.html')).read()
three = open(os.path.join(d, 'three.min.js')).read()
app = open(os.path.join(d, 'app.js')).read()
data = open(os.path.join(d, 'data.json')).read()

app = app.replace('/*__DATA__*/ null', data)

html = (
    '<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n' + head +
    '\n</head>\n<body>\n<script>' + three + '</script>\n<script>' + app +
    '</script>\n</body>\n</html>'
)

out_path = os.path.join(d, 'dist.html')
open(out_path, 'w').write(html)
print('wrote', out_path, len(html), 'bytes')
