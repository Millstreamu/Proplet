'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { BACKGROUNDS, fillFor } = require('../canvas-background.js');

test('provides transparent checker, white, and black viewing backgrounds', () => {
  assert.deepEqual({ ...BACKGROUNDS }, {
    checker: null,
    white: '#ffffff',
    black: '#000000'
  });
  assert.equal(fillFor('checker'), null);
  assert.equal(fillFor('white'), '#ffffff');
  assert.equal(fillFor('black'), '#000000');
});

test('rejects unsupported background values', () => {
  assert.throws(() => fillFor('pink'), RangeError);
});

test('the background selector is editor-only and is used by the main painter', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /viewBackground:'checker'/);
  assert.match(html, /PixelStudioBackground\.fillFor\(s\.viewBackground\)/);
  assert.match(html, /Canvas background \(view only\)/);
});
