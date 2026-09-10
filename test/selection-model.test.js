'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { create, composite, move, transform } = require('../selection-model.js');

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

test('an off-canvas pasted pixel returns when the selection moves in bounds', () => {
  const pasted = create(new Array(16).fill(null), { x:3, y:1, w:2, h:1 }, ['red', 'green']);

  assert.deepEqual(composite(pasted, 4, 4).slice(4, 8), [null, null, null, 'red']);
  const moved = move(pasted, 1, 1);
  assert.deepEqual(composite(moved, 4, 4).slice(4, 8), [null, 'red', 'green', null]);
  assert.deepEqual(moved.pixels, ['red', 'green']);
});

test('pastes survive crossing every canvas edge and corner', () => {
  const payload = ['a', 'b', 'c', 'd'];
  const outsideOrigins = [
    [-1, 1], [3, 1], [1, -1], [1, 3],
    [-1, -1], [3, -1], [-1, 3], [3, 3]
  ];

  for (const [x, y] of outsideOrigins) {
    const pasted = create(new Array(16).fill(null), { x, y, w:2, h:2 }, payload);
    const restored = composite(move(pasted, 1, 1), 4, 4);
    assert.deepEqual([restored[5], restored[6], restored[9], restored[10]], payload);
  }
});

test('a paste can move fully outside the canvas and return intact', () => {
  const pasted = create(new Array(16).fill(null), { x:1, y:1, w:2, h:2 }, ['a', 'b', 'c', 'd']);
  const outside = move(pasted, -3, 5);

  assert.deepEqual(composite(outside, 4, 4), new Array(16).fill(null));
  const returned = composite(move(outside, 1, 1), 4, 4);
  assert.deepEqual([returned[5], returned[6], returned[9], returned[10]], ['a', 'b', 'c', 'd']);
});

test('transforms include invisible pixels in a non-square floating selection', () => {
  const pasted = create(new Array(16).fill(null), { x:3, y:1, w:2, h:1 }, ['red', 'green']);

  const flipped = move(transform(pasted, 'flipH'), 1, 1);
  assert.deepEqual(composite(flipped, 4, 4).slice(4, 8), [null, 'green', 'red', null]);

  const rotated = move(transform(pasted, 'rot'), 1, 1);
  assert.deepEqual(rotated.rect, { x:1, y:1, w:1, h:2 });
  const result = composite(rotated, 4, 4);
  assert.deepEqual([result[5], result[9]], ['red', 'green']);
});
