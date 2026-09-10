(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PixelStudioBackground = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BACKGROUNDS = Object.freeze({
    checker: null,
    white: '#ffffff',
    black: '#000000'
  });

  /** Resolve an editor-only canvas background to its solid fill colour. */
  function fillFor(background) {
    if (!Object.prototype.hasOwnProperty.call(BACKGROUNDS, background)) {
      throw new RangeError('Unknown canvas background: ' + background);
    }
    return BACKGROUNDS[background];
  }

  return { BACKGROUNDS, fillFor };
});
