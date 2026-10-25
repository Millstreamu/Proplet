# Asset export

PNG export uses the selected frame, tile, or Atlas sprite. Inside the export dialog it uses the selected export tab (animation sheet, tiles, or Atlas). PNG scale defaults to 1×; choose 2×, 4×, or 8× in the dialog. Selection PNGs preserve transparency and never include editor backgrounds or overlays. Packed PNG export remains a separate action.

## Asset inspector

Open the tile or Atlas export window and select the asset in its preview. Its metadata controls are in the export inspector, alongside the existing sprite and tile information. Category describes the asset; collision is independent. For example, a decoration may be solid, a trigger, or non-colliding. Start from a preset or supply a custom category.

Optional sections each have an **Include** checkbox. Unchecked sections are left out of JSON v2, not filled with placeholder values. Their settings remain in the project for later reuse. Blank categories and animation links, empty tags and properties, and null placement values are omitted. Identity, name, and image rectangle are always exported. Old projects with existing metadata keep their previously meaningful fields enabled.

Use the Category dropdown to reuse a category, or enter a name and choose **Add category**. Custom categories are saved with the project and are shared by tile and Atlas inspectors. **Not specified** leaves category out of JSON v2.

Fields are drafts until **Apply metadata** succeeds. Invalid drafts display an error and do not replace the last applied values. Export uses applied metadata. Select checkboxes on asset cards and use **Apply to selected assets** to copy the inspector's metadata to those assets. The whole operation is rejected if any target's dimensions make enabled metadata invalid. Disabled sections are neither parsed nor validated. Pixel artwork, dimensions, IDs, and names are never copied by this operation.

Advanced fields accept JSON:

- Collision shape: `{"type":"bounds"}`, `{"type":"rectangle","x":0,"y":0,"w":8,"h":8}`, or `{"type":"polygon","points":[{"x":0,"y":0},{"x":8,"y":0},{"x":4,"y":8}]}`. Coordinates are local pixels, and geometry must fit inside the asset.
- Placement: `{"pivot":{"x":0.5,"y":1},"groundAnchor":null,"footprint":{"w":1,"h":1}}`. Pivot is normalized; ground anchor is local pixels; footprint is positive integer tile cells. Optional fields may be null.
- Custom properties: `{"damage":10,"interactable":true,"material":"wood"}`. Values must be text, finite numbers, or booleans; nested objects are not supported.
- Terrain: `{"family":"grass","corners":["grass","grass","dirt","dirt"]}`. Corner order is top-left, top-right, bottom-right, bottom-left. Shown for terrain-category assets.

Linked animation references an actual named sheet. Export includes its frame pixels, dimensions, timing, and clips so the reference is usable without a separate animation-file lookup. These fields describe intent; a game importer must implement collision, triggers, placement, and animation behaviour. Polygon coordinates are editable numerically; there is no interactive shape-drawing overlay in this version.

## JSON v2

Default tile and Atlas metadata exports use `format: "proplet-assets"` and `version: 2`:

```json
{
  "format": "proplet-assets",
  "version": 2,
  "type": "atlas",
  "image": {"file":"project-atlas.png","width":32,"height":32},
  "coordinates": {
    "rectangles":"pixels; top-left origin",
    "collision":"local pixels; top-left origin",
    "groundAnchor":"local pixels",
    "pivot":"normalized 0..1",
    "footprint":"tile cells"
  },
  "assets": [{
    "id":"sprite-123-abc",
    "name":"Tree",
    "rect":{"x":1,"y":1,"w":16,"h":24},
    "category":"decoration",
    "collision":{"mode":"solid","shape":{"type":"bounds"}},
    "pivot":{"x":0.5,"y":1},
    "groundAnchor":null,
    "footprint":null,
    "terrain":{"family":"","corners":[]},
    "tags":["forest"],
    "properties":{"interactable":false},
    "animationId":null
  }],
  "animations":[]
}
```

Names are display labels. IDs remain stable across saves, renames, and packing changes; duplicates receive fresh IDs. Assets are an array so duplicate names cannot overwrite each other. Missing/duplicate IDs, invalid geometry, invalid custom data, or broken animation links block v2 export and appear in the live JSON preview.

Linked animations contain `id`, `name`, `w`, `h`, `frames` (`id`, `durationMs`, `pixels`), and `clips` (`name`, `start`, `end`, `mode`). Clip indices are 1-based and inclusive; frame pixels are row-major hex colour strings or null. Only referenced sheets are included. `one-way` collision identifies platform intent; directional physics policy is left to the receiving importer.

## Compatibility

Existing project metadata is migrated on inspection/export without losing the original fields: `decor` becomes category `decoration`; legacy `collision` kind enables solid collision; `animated` becomes category `prop` without inventing animation frames. Old tags and terrain corners remain available. Applied metadata is stored in project files.

**JSON v2 preview & legacy export** in the export dialog offers the previous JSON structure. Legacy export is intentionally lossy for new fields (geometry, placement, custom properties, and animation links). It retains kind, collision boolean, tags, and terrain corners; its original format cannot represent every v2 inclusion choice. Normalized duplicate names block legacy export instead of silently discarding assets. Use v2 for new importers; keep legacy mode for existing consumers.


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
