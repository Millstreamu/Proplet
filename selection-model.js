(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PixelStudioSelection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function create(basePixels, rect, pixels) {
    return {
      basePixels: basePixels.slice(),
      rect: { ...rect },
      pixels: pixels.slice()
    };
  }

  function composite(selection, width, height) {
    const output = selection.basePixels.slice();
    const { rect, pixels } = selection;
    for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
      const dx = rect.x + x, dy = rect.y + y;
      if (dx >= 0 && dx < width && dy >= 0 && dy < height) {
        output[dy * width + dx] = pixels[y * rect.w + x];
      }
    }
    return output;
  }

  function move(selection, x, y) {
    return { ...selection, rect: { ...selection.rect, x, y } };
  }

  function transform(selection, kind) {
    const { rect, pixels } = selection;
    let transformed;
    let transformedRect = { ...rect };

    if (kind === 'flipH') {
      transformed = new Array(rect.w * rect.h);
      for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
        transformed[y * rect.w + x] = pixels[y * rect.w + (rect.w - 1 - x)];
      }
    } else if (kind === 'flipV') {
      transformed = new Array(rect.w * rect.h);
      for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
        transformed[y * rect.w + x] = pixels[(rect.h - 1 - y) * rect.w + x];
      }
    } else if (kind === 'rot') {
      transformed = new Array(rect.w * rect.h);
      for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
        transformed[x * rect.h + (rect.h - 1 - y)] = pixels[y * rect.w + x];
      }
      transformedRect = { ...rect, w: rect.h, h: rect.w };
    } else {
      throw new RangeError(`Unknown selection transform: ${kind}`);
    }

    return create(selection.basePixels, transformedRect, transformed);
  }

  return { create, composite, move, transform };
});
