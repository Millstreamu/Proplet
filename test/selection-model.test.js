'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { create, composite, move } = require('../selection-model.js');

test('moving a paste restores pixels underneath it', () => {
  const base = new Array(16).fill(null);
  base[1 * 4 + 1] = '#0000ff';
  const pasted = create(base, { x:1, y:1, w:1, h:1 }, ['#ff0000']);

  assert.equal(composite(pasted, 4, 4)[5], '#ff0000');
  const moved = composite(move(pasted, 2, 1), 4, 4);
  assert.equal(moved[5], '#0000ff');
  assert.equal(moved[6], '#ff0000');
});

test('repeated movement always composites over the immutable base', () => {
  const base = ['under', null, null, null];
  const pasted = create(base, { x:0, y:0, w:1, h:1 }, ['paste']);
  const movedTwice = move(move(pasted, 1, 0), 2, 0);

  assert.deepEqual(composite(movedTwice, 4, 1), ['under', null, 'paste', null]);
  assert.deepEqual(pasted.basePixels, base);
});

test('a normal selection move remains a cut-and-move operation', () => {
  const cutBase = [null, 'neighbor', null];
  const selection = create(cutBase, { x:0, y:0, w:1, h:1 }, ['selected']);
  assert.deepEqual(composite(move(selection, 2, 0), 3, 1), [null, 'neighbor', 'selected']);
});

test('selection buffers are copied so clipboard changes cannot corrupt a paste', () => {
  const clipboard = ['paste'];
  const pasted = create(['under'], { x:0, y:0, w:1, h:1 }, clipboard);
  clipboard[0] = 'changed';

  assert.deepEqual(composite(pasted, 1, 1), ['paste']);
});
