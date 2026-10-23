# Asset export

PNG export uses the selected frame, tile, or Atlas sprite. Inside the export dialog it uses the selected export tab (animation sheet, tiles, or Atlas). PNG scale defaults to 1×; choose 2×, 4×, or 8× in the dialog. Selection PNGs preserve transparency and never include editor backgrounds or overlays. Packed PNG export remains a separate action.

## Asset inspector

Select a tile or Atlas sprite and expand **Asset metadata** in the right sidebar. Category describes the asset; collision is independent. For example, a decoration may be solid, a trigger, or non-colliding. Start from a preset or supply a custom category.

Fields are drafts until **Apply metadata** succeeds. Invalid drafts display an error and do not replace the last applied values. Export uses applied metadata. Select checkboxes on asset cards and use **Apply to selected assets** to copy the inspector's metadata to those assets. The whole operation is rejected if any target's dimensions make the metadata invalid. Pixel artwork, dimensions, IDs, and names are never copied by this operation.

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

**JSON v2 preview & legacy export** in the export dialog offers the previous JSON structure. Legacy export is intentionally lossy for new fields (geometry, placement, custom properties, and animation links). It retains kind, collision boolean, tags, and terrain corners. Normalized duplicate names block legacy export instead of silently discarding assets. Use v2 for new importers; keep legacy mode for existing consumers.
