'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { MODES, applyPaintMode, floodPaint } = require('../paint-model.js');

const step = (colour, direction) => colour + (direction > 0 ? '+' : '-');
const mix = (current, colour, amount) => `${current}:${colour}:${amount}`;

test('offers all four paint modes and applies each one', () => {
  assert.deepEqual(MODES, ['solid', 'tint', 'darken', 'lighten']);
  assert.equal(applyPaintMode('#111', '#abc', 'solid', step, mix), '#abc');
  assert.equal(applyPaintMode('#111', '#abc', 'tint', step, mix), '#111:#abc:0.35');
  assert.equal(applyPaintMode('#111', '#abc', 'darken', step, mix), '#111-');
  assert.equal(applyPaintMode('#111', '#abc', 'lighten', step, mix), '#111+');
});

test('non-solid paint preserves transparent pixels', () => {
  for (const mode of ['tint', 'darken', 'lighten']) {
    assert.equal(applyPaintMode(null, '#abc', mode, step, mix), null);
  }
});

test('fill transforms only the connected source-colour region', () => {
  const pixels = ['a', 'a', 'b', 'a', 'b', 'b'];
  floodPaint(pixels, 3, 2, 0, 0, colour => colour.toUpperCase());
  assert.deepEqual(pixels, ['A', 'A', 'b', 'A', 'b', 'b']);
});

test('paint strength controls tint and shade blending, including zero effect', () => {
  assert.equal(applyPaintMode('a', 'b', 'tint', step, mix, 70), 'a:b:0.7');
  assert.equal(applyPaintMode('a', 'b', 'darken', step, mix, 20), 'a:a-:0.2');
  assert.equal(applyPaintMode('a', 'b', 'lighten', step, mix, 80), 'a:a+:0.8');
  for (const mode of ['tint', 'darken', 'lighten']) {
    assert.equal(applyPaintMode('a', 'b', mode, step, mix, 0), 'a');
    assert.equal(applyPaintMode(null, 'b', mode, step, mix, 80), null);
  }
});

test('restores independent strengths and supplies defaults for old projects', () => {
  const { paintStrengths } = require('../paint-model.js');
  assert.deepEqual(paintStrengths(), {tint:35, darken:100, lighten:100});
  assert.deepEqual(paintStrengths({tint:70, darken:20, lighten:80}), {tint:70, darken:20, lighten:80});
  assert.deepEqual(paintStrengths({tint:-5, darken:120, lighten:'bad'}), {tint:0, darken:100, lighten:100});
});
