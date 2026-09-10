# Pixel Studio: sprite preview and pasted-selection data-loss bugs

## Scope and test environment

This report documents three reproducible defects in the standalone Pixel Studio app in `index.html`. No fixes are included in this change; the implementation guidance and regression cases below are intended for a future coding session.

The issues were reproduced on 10 September 2026 using Chromium 140 in a 1440 × 1000 headless browser viewport. The app was served with `python3 -m http.server`, with its pinned React, ReactDOM, and Babel browser dependencies mirrored locally because the browser could not reach the external CDN through the test environment's proxy.

For deterministic pixel-state checks, the reproduction script obtained the mounted React class component and invoked the same production methods used by the UI. It did not replace or modify the selection algorithms. The recorded values below therefore come from the application implementation rather than a separate reimplementation.

## Summary

| ID | Defect | Severity | Confirmed result |
| --- | --- | --- | --- |
| PS-01 | Large sprites make selector thumbnails overflow their cards | Medium | A 200 × 200 sprite produced a 200 × 200 thumbnail inside an 86 px-wide card. |
| PS-02 | Moving a pasted selection destroys the pixels beneath it | High | Moving a pasted red pixel away from a blue pixel left the original location transparent instead of blue. |
| PS-03 | Pasted pixels outside the canvas are permanently discarded | High | The off-canvas green pixel in a 2 × 1 paste became `null` and did not return when the selection moved fully into bounds. |

## PS-01 — Large sprite thumbnails overflow the sprite selector

### Reproduction

1. Open Pixel Studio and create a new project with width **200** and height **200**.
2. Remain in the **Frames** workspace.
3. Inspect any frame card in the sprite selector along the bottom of the window.
4. Compare the thumbnail canvas bounds with its card and neighboring controls/cards.

### Expected

The sprite is scaled down proportionally to fit the fixed thumbnail area. Every frame card keeps the same preview footprint regardless of sprite dimensions, and the canvas does not overlap labels, neighboring cards, or other UI.

### Actual

The thumbnail canvas is 200 × 200 CSS pixels while its card is only 86 px wide. It overflows horizontally and can overlap adjacent UI. The deterministic browser reproduction recorded:

```text
thumbnail: 200 × 200 CSS px
card:       86 × 247 CSS px
horizontal overflow: true
```

The card also grows vertically because the oversized canvas participates in layout, so selector height is not stable.

### Cause

`paint()` calculates thumbnail scale as an integer number of screen pixels per sprite pixel:

```js
const cellIn = (box, W, H) => Math.max(1, Math.floor(box / Math.max(W, H)));
```

For a 200 × 200 sprite in a nominal 66 px thumbnail box, `Math.floor(66 / 200)` is `0`, but `Math.max(1, ...)` forces a cell size of `1`. `draw()` then assigns `W * cell` and `H * cell` directly to the canvas CSS dimensions, producing a 200 × 200 canvas. The nominal `box` value is not enforced by the thumbnail wrapper, which has no fixed dimensions or clipping.

The same calculation is shared by frame, tile, atlas, preview, and transform-preview canvases. The future fix should audit all of those consumers, not only frame cards.

### Recommended fix

Decouple canvas backing resolution from display size:

1. Give thumbnail preview containers explicit, invariant dimensions (for example, 66 × 66 px in selector cards) and `overflow: hidden` as a defensive guard.
2. Render the sprite at native logical resolution (or an appropriately DPR-scaled backing resolution), then constrain the canvas's CSS size with an aspect-ratio-preserving fit: `scale = Math.min(box / W, box / H)`.
3. Allow fractional CSS scaling when either sprite dimension exceeds the preview box instead of forcing the scale to at least one.
4. Keep `image-rendering: pixelated` and center the canvas so non-square sprites remain crisp and correctly letterboxed.
5. Avoid changing the editor canvas's integer-cell zoom behavior; this recommendation applies to preview/thumbnail rendering only.

### Regression checks

- Verify 16 × 16, 32 × 64, 66 × 66, 67 × 67, 200 × 200, and 256 × 128 sprites.
- Assert that each selector canvas bounding box is no larger than its preview container in either dimension.
- Assert that frame card width and selector-row height remain constant across sprite sizes.
- Repeat in Frames, Tiles, and Atlas workspaces and in the right-side preview and transform dialog.

## PS-02 — Moving a pasted selection erases the content underneath

### Reproduction

1. On a small canvas, draw a blue pixel at `(1, 1)`.
2. Copy a red pixel into the internal clipboard.
3. Select `(1, 1)` and paste, so the red pixel appears over the blue pixel.
4. With the Selection tool, drag the pasted red pixel from `(1, 1)` to `(2, 1)`.

### Expected

Pasted content behaves as a floating selection until it is committed. Moving it reveals the unchanged blue pixel that was beneath it at `(1, 1)`, while the red pixel appears at `(2, 1)`.

### Actual

The red pixel moves to `(2, 1)`, but `(1, 1)` becomes transparent (`null`). The pre-existing blue pixel is lost.

### Cause

Paste immediately writes the clipboard buffer into the frame's pixel array. When a drag later starts, selection handling:

1. grabs the already-composited (red) pixels into `selBuf`;
2. clones the already-overwritten frame;
3. clears the entire selection rectangle in that clone to form `selBase`; and
4. redraws `selBuf` at the drag destination.

Because no copy of the pixels underneath the paste is retained, clearing the source rectangle creates transparency rather than restoring the original blue pixel. The current `clip` object only contains clipboard pixels; it does not track floating-selection state or the backing pixels replaced by a paste.

### Recommended fix

Introduce an explicit floating-selection model instead of committing a paste immediately. A useful shape would include:

```text
floatingSelection = {
  x, y, width, height,
  pixels,          // full clipboard payload, including off-canvas pixels
  basePixels       // immutable frame snapshot from before the paste
}
```

Render `basePixels` plus the floating buffer for display. Movement and nudging should update only the floating selection's coordinates; they must not repeatedly grab and clear the composited frame. Commit the composite exactly once on deselect, switching tools, starting another edit, saving/exporting if necessary, or another clearly defined commit event. Escape semantics should be decided explicitly (cancel and restore the base is conventional; if Escape commits in this app, document and test that behavior).

If a smaller refactor is preferred, at minimum retain the pre-paste backing snapshot and original clipboard buffer, and identify the selection as pasted so the first move restores that snapshot. The explicit floating model is safer because it also resolves PS-03 and avoids special cases across drag, nudge, transform, undo, and redo.

### Regression checks

- Paste opaque pixels over opaque, transparent, and mixed-color regions, then drag and nudge them; the original pixels must reappear.
- Move a pasted selection several times before committing; each location must restore the same immutable backing image.
- Confirm that moving a normal, non-pasted selection retains the existing cut-and-move behavior.
- Verify undo/redo treats paste plus subsequent positioning according to the chosen transaction model and never loses backing pixels.

## PS-03 — Off-canvas portions of pasted selections are deleted

### Reproduction

1. Copy a horizontal 2 × 1 selection containing a red pixel followed by a green pixel.
2. On a 4 × 4 canvas, place the selection origin at `(3, 1)` and paste. The red pixel is on the right edge and the green pixel lies just outside the canvas.
3. Drag or nudge the pasted selection left until both pixels should be inside the canvas (for example, origin `(1, 1)`).

### Expected

The complete 2 × 1 clipboard payload remains attached to the floating selection. After moving it fully onto the canvas, both the red and green pixels are visible.

### Actual

Only the in-bounds red pixel survives. The green pixel is replaced with `null` and cannot be recovered by moving the selection back into bounds. The deterministic reproduction recorded:

```text
clipboard before paste:       ["#ff0000", "#00ff00"]
selection after edge paste:   { x: 3, y: 1, w: 2, h: 1 }
buffer re-grabbed for moving:  ["#ff0000", null]
pixels after moving in bounds: ["#ff0000", null]
```

The same loss can occur repeatedly whenever a selection is moved or nudged partly beyond an edge and later brought back.

### Cause

`put()` intentionally clips writes to valid canvas coordinates. That is correct for compositing, but the pasted selection does not retain its authoritative clipboard buffer afterward. At the start of the next movement, `grab()` reconstructs the move buffer from the clipped canvas; it fills all source coordinates outside the canvas with `null`. The out-of-bounds portion is therefore discarded before it has a chance to move back into view.

### Recommended fix

Use the same floating-selection model recommended for PS-02. Keep the complete selection buffer independent of the finite canvas, clip only while compositing it for display or commit, and never regenerate the authoritative floating buffer by sampling clipped canvas pixels.

Selection rectangles may remain partially or completely out of bounds, but selection commands need defined behavior:

- Drag and nudge preserve all buffered pixels.
- Flip and rotate operate on the entire floating buffer, including invisible pixels.
- A final commit clips only the rendered result to canvas bounds.
- Undo restores both the prior frame and, if applicable, the prior floating-selection state.
- Copy/cut from a partially out-of-bounds selection should consistently preserve transparent out-of-canvas cells or clamp the rectangle; whichever product behavior is chosen should be covered by tests.

### Regression checks

- Paste across each of the four edges and four corners, then move fully in bounds and compare every pixel with the original clipboard buffer.
- Move a selection fully outside the canvas and back; no pixels should disappear.
- Nudge, flip, and rotate a partially out-of-bounds pasted selection before bringing it back.
- Cover non-square buffers because rotation swaps width and height.

## Suggested implementation order

1. Add focused unit tests for selection compositing using small array fixtures; isolate `grab`, `put`, movement, commit, and floating-buffer behavior from React rendering where practical.
2. Implement the shared floating-selection state to resolve PS-02 and PS-03 together.
3. Add browser-level interaction coverage for paste, drag/nudge, canvas edges, undo/redo, and commit/cancel behavior.
4. Refactor preview sizing separately and add DOM bounding-box assertions for all preview surfaces.
5. Manually verify the selector at supported maximum project dimensions and at narrow window sizes.

## Acceptance criteria

- A 200 × 200 (and maximum supported 256 × 256) sprite never renders a selector preview outside the fixed thumbnail area or overlaps adjacent UI.
- Moving a pasted selection reveals the exact pixels that existed beneath the paste.
- A pasted selection retains all clipboard pixels while positioned partly or wholly outside the canvas and restores them when moved back inside.
- The behavior is consistent for mouse dragging, keyboard nudging, transforms, undo/redo, and all workspaces that share selection logic.
- Automated regression tests cover the three minimal reproductions in this report.
