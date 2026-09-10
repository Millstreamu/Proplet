'use strict';

const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
if (!match) throw new Error('Could not find the Pixel Studio Babel application script');

babel.transformSync(match[1], {
  filename: 'index.inline.jsx',
  presets: ['@babel/preset-react'],
  babelrc: false,
  configFile: false
});
