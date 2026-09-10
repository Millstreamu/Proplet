(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PixelStudioPaint = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MODES = ['solid', 'tint', 'darken', 'lighten'];

  /** Apply a paint mode to one pixel. Transparent pixels are only affected by solid paint. */
  function applyPaintMode(current, colour, mode, stepColour, mixColour) {
    if (mode === 'solid') return colour;
    if (current == null) return current;
    if (mode === 'tint') return mixColour(current, colour, 0.35);
    if (mode === 'darken') return stepColour(current, -1);
    if (mode === 'lighten') return stepColour(current, 1);
    throw new Error('Unknown paint mode: ' + mode);
  }

  /** Transform the connected region containing (x,y), rather than always replacing it. */
  function floodPaint(pixels, width, height, x, y, transform) {
    const target = pixels[y * width + x];
    const replacement = transform(target);
    if (replacement === target) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const i = cy * width + cx;
      if (pixels[i] !== target) continue;
      pixels[i] = replacement;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  return { MODES, applyPaintMode, floodPaint };
});
