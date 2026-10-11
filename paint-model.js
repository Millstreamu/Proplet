(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PixelStudioPaint = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MODES = ['solid', 'tint', 'darken', 'lighten'];

  const DEFAULT_STRENGTHS = { tint:35, darken:100, lighten:100 };
  function paintStrengths(saved = {}) {
    return Object.fromEntries(Object.entries(DEFAULT_STRENGTHS).map(([mode, fallback]) =>
      [mode, Number.isFinite(saved?.[mode]) ? Math.max(0, Math.min(100, saved[mode])) : fallback]));
  }

  /** Apply a paint mode to one pixel. Transparent pixels are only affected by solid paint. */
  function applyPaintMode(current, colour, mode, stepColour, mixColour, strength = DEFAULT_STRENGTHS[mode]) {
    if (mode === 'solid') return colour;
    if (current == null) return current;
    const amount = Math.max(0, Math.min(100, strength)) / 100;
    if (amount === 0) return current;
    if (mode === 'tint') return mixColour(current, colour, amount);
    if (mode === 'darken' || mode === 'lighten') {
      const target = stepColour(current, mode === 'darken' ? -1 : 1);
      return amount === 1 ? target : mixColour(current, target, amount);
    }
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

  return { MODES, DEFAULT_STRENGTHS, paintStrengths, applyPaintMode, floodPaint };
});
