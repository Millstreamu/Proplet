(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PixelStudioLine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Return every pixel in an inclusive, one-pixel-wide line. */
  function rasterize(start, end) {
    let x = start.x, y = start.y;
    const dx = Math.abs(end.x - x), dy = Math.abs(end.y - y);
    const sx = x < end.x ? 1 : -1, sy = y < end.y ? 1 : -1;
    let error = dx - dy;
    const points = [];

    while (true) {
      points.push({ x, y });
      if (x === end.x && y === end.y) break;
      const twiceError = 2 * error;
      if (twiceError > -dy) { error -= dy; x += sx; }
      if (twiceError < dx) { error += dx; y += sy; }
    }
    return points;
  }

  /** Snap an endpoint to the nearest horizontal, vertical, or 45-degree line. */
  function snapEndpoint(start, end) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    if (!distance) return { ...end };
    const angle = Math.atan2(dy, dx);
    const direction = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
    const directions = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    const [stepX, stepY] = directions[direction];
    return {
      x: start.x + stepX * distance,
      y: start.y + stepY * distance
    };
  }

  return { rasterize, snapEndpoint };
});
