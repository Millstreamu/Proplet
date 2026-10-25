# Artwork export and Atlas sheets

Proplet owns pixels, project/sheet organisation and artwork metadata. Anchors and
collision are authored in the receiving map editor. New JSON v2 and legacy
exports omit collision and placement. Old project geometry remains in saved
project data for compatibility, without exposing geometry controls.

## Atlas sheets

Use the **Atlas sheet** selector beside the sprite cards. **+ Atlas sheet** adds
an independent collection. Rename changes its label; Duplicate gives the sheet
and every copied sprite fresh IDs. Remove is undoable; at least one sheet remains.
Save writes all sheets. Older flat-Atlas projects become one named sheet on load;
existing sprite IDs and pixels are preserved. Save once to persist the new
project/sheet IDs. New Project creates a new project ID. Save As retains identity.

Export packs only the active Atlas sheet. PNG and JSON filenames include project
and sheet labels. Choose **Whole sheet** for a normal export or **Selected sprites**
for a partial export using the asset-card checkboxes. Export PNG at 1× for matching
JSON coordinates. Empty selections cannot export. Repacking and renaming preserve
identities. Exported source scope tells a receiving importer whether unexported
sprites were omitted intentionally; missing IDs must never imply deleting placed
objects without review.

## JSON v2 contract

```json
{
  "format":"proplet-assets", "version":2, "type":"atlas",
  "source":{
    "project":{"id":"project-id","name":"Veilbound"},
    "sheet":{"id":"sheet-id","name":"Village"},
    "scope":"complete"
  },
  "image":{"file":"Veilbound-Village-atlas.png","width":64,"height":32},
  "coordinates":{"rectangles":"pixels; top-left origin"},
  "assets":[{"id":"sprite-id","name":"Crate","rect":{"x":0,"y":0,"w":32,"h":32},"category":"prop","tags":["wood"]}],
  "animations":[]
}
```

IDs, never names or packed positions, identify artwork. The receiving application
keys a collection by project ID + sheet ID and sprites by their asset ID within
that sheet. `scope` is `complete` or `partial`. Partial exports use the same sheet
identity. Names may change freely. No Workshop-specific keys are exported.

The inspector provides optional category, tags, primitive custom properties,
terrain data and linked animation. Include checkboxes control optional export;
Apply metadata commits a draft. Custom categories remain reusable. Legacy project
fields are retained but collision/anchor fields are omitted from new exports.
Linked animations include actual frame pixels, durations and clips. Generic
art metadata does not prescribe gameplay. Legacy JSON remains available for old
consumers, without geometry; names must be unique in its object-key format.

## Terrain tiles and pattern groups

Use **Tiles** for terrain and **Atlas** for props and interactives. Both use the
same generic JSON v2 asset records; `type: "tileset"` identifies a tile export.
Rectangles always identify actual PNG pixels, so games must use those rectangles
rather than assume a fixed packing order. Export PNG at **1×** for matching JSON.

The Terrain inspector exposes **role**, **family**, **variation weight**, and
**overlay layer**. Advanced Terrain JSON supports:

```json
{"family":"grass","role":"base","corners":[],"weight":45,
 "pattern":{"id":"meadow-01","columns":2,"rows":2,"column":0,"row":0}}
```

A pattern groups uniformly sized Tiles into one larger artwork. Its four 16px
cells can describe a 32px pattern. Assign the same ID, grid dimensions, family,
and weight to all its cells, with a distinct column/row for each cell. Reordering
or changing sheet columns cannot break the group. Incomplete or duplicate
pattern cells block export. Ungrouped base tiles are valid too.

- `role: "base"`: opaque material artwork. Weight controls relative variation
  selection; a pattern's weight applies once to the whole pattern.
- `role: "transition"`: material join artwork with four `corners` in **TL, TR,
  BR, BL** order. Example: `{"family":"grass","role":"transition",
  "corners":["grass","grass","dirt","dirt"],"weight":1}`. An importer may
  support weighted alternatives for the same corner arrangement.
- `role: "overlay"`: transparent surface detail. Example:
  `{"family":"grass","role":"overlay","corners":[],"weight":5,"layer":1}`.
  Lower layers draw first. Family identifies the intended underlying material.

Proplet validates descriptive metadata and pattern integrity. It does not impose
movement size, supported material count, adjacency algorithms, overlay density,
collision, encounter rules, or gameplay. Those are the receiving application's
responsibility. Older `{family,corners}` terrain metadata remains valid.
