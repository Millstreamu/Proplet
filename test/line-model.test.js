'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { rasterize, snapEndpoint } = require('../line-model.js');

test('rasterizes inclusive lines in every direction', () => {
  assert.deepEqual(rasterize({ x:1, y:2 }, { x:4, y:2 }), [
    { x:1, y:2 }, { x:2, y:2 }, { x:3, y:2 }, { x:4, y:2 }
  ]);
  assert.deepEqual(rasterize({ x:3, y:3 }, { x:1, y:1 }), [
    { x:3, y:3 }, { x:2, y:2 }, { x:1, y:1 }
  ]);
  assert.deepEqual(rasterize({ x:2, y:1 }, { x:2, y:1 }), [{ x:2, y:1 }]);
});

test('shift snapping chooses a horizontal, vertical, or diagonal endpoint', () => {
  const start = { x:4, y:4 };
  assert.deepEqual(snapEndpoint(start, { x:9, y:5 }), { x:9, y:4 });
  assert.deepEqual(snapEndpoint(start, { x:5, y:9 }), { x:4, y:9 });
  assert.deepEqual(snapEndpoint(start, { x:8, y:7 }), { x:8, y:8 });
});

test('the app exposes the line tool and its keyboard shortcut', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /id:'line', name:'Line', key:'N'/);
  assert.match(html, /n:'line'/);
  assert.match(html, /PixelStudioLine\.rasterize/);
});
