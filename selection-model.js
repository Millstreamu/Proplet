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

  return { create, composite, move };
});
