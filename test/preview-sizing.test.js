'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { fitDimensions } = require('../preview-sizing.js');

test('fits representative square and rectangular sprites inside selector boxes', () => {
  for (const [width, height] of [[16, 16], [32, 64], [66, 66], [67, 67], [200, 200], [256, 128]]) {
    const fitted = fitDimensions(66, width, height);
    assert.ok(fitted.width <= 66 && fitted.height <= 66, `${width}x${height} overflowed`);
    assert.equal(fitted.width / fitted.height, width / height);
    assert.equal(Math.max(fitted.width, fitted.height), 66);
  }
});

test('supports fractional downscaling for large sprites', () => {
  assert.deepEqual(fitDimensions(66, 200, 200), { width: 66, height: 66, scale: 0.33 });
  assert.deepEqual(fitDimensions(66, 256, 128), { width: 66, height: 33, scale: 66 / 256 });
});

test('rejects invalid dimensions', () => {
  for (const dimensions of [[0, 1, 1], [1, 0, 1], [1, 1, 0], [NaN, 1, 1]]) {
    assert.throws(() => fitDimensions(...dimensions), RangeError);
  }
});

test('the app uses the bounded preview renderer and a fixed selector container', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /drawPreview\(el, t\.px, s\.w, s\.h, 66\)/);
  assert.match(html, /drawPreview\(el, it\.px, it\.w, it\.h, 66\)/);
  assert.match(html, /drawPreview\(el, f\.px, s\.w, s\.h, 66\)/);
  assert.match(html, /data-preview-box="66"[^>]+width:66px;height:66px;overflow:hidden/);
  assert.doesNotMatch(html, /Math\.max\(1, Math\.floor\(box \/ Math\.max\(W, H\)\)\)/);
});
