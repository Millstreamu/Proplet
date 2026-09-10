(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PixelStudioPreview = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Return an aspect-ratio-preserving CSS size contained by a square box. */
  function fitDimensions(box, width, height) {
    if (![box, width, height].every(Number.isFinite) || box <= 0 || width <= 0 || height <= 0) {
      throw new RangeError('Preview dimensions must be positive finite numbers');
    }
    const scale = Math.min(box / width, box / height);
    return { width: width * scale, height: height * scale, scale };
  }

  return { fitDimensions };
});
