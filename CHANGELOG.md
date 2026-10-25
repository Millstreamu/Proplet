# Changelog

## 26 October 2026 — Artwork sheets and ownership

- Added named Atlas sheets with switching, add, rename, independent duplication,
  undoable removal and full project save/load migration.
- Export includes persistent project/sheet/sprite identities and complete/partial
  scope. Packing position and filenames are not identity.
- Removed collision and anchor controls/exports. Old project values remain stored;
  map editors own all new geometry.
- Kept generic terrain roles, grouped base patterns and overlay layer metadata.

Validation covers sheet isolation, save/load, legacy migration, duplication,
undo/removal, selected exports, art-only metadata and existing editor behaviour.
