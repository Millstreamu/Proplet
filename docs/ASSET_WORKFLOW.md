# Artwork workflow

1. Open a project; keep its project ID when renaming or saving a new filename.
2. Add a named Atlas sheet, e.g. Village or Woodland. Each sheet has its own sprites.
3. Add/edit artwork. Duplicate creates new identities for alternate art.
4. Export the active sheet's PNG + JSON at 1×. Normally use Whole sheet.
5. Import into the receiving map editor; author anchors and collision there.
6. Export updates from the same project/sheet. The receiving editor matches IDs,
   adds new sprites, preserves geometry/placements and reviews missing/resized art.
7. A partial export updates selected sprites; other sprites remain available.

Implementation is additive to JSON v2. The source envelope is generic and holds
project ID/name, sheet ID/name, and scope. Atlas sheets are stored as `atlasSheets`
with active sheet ID; the flat active `atlas` remains a compatibility alias.
