# Proplet

Pixel Studio is a standalone browser application in `index.html`.

## Development

Use Node.js 20 or newer. Install the pinned development dependencies and run
all checks with:

```sh
npm install
npm run check
npm test
```

To use the app locally, serve the repository root (rather than opening the HTML
as a file) so its local preview-sizing script can load:

```sh
python3 -m http.server 8000
```

See [Asset export](EXPORT-FORMAT.md) for selected PNG export, metadata editing, JSON v2, and legacy export compatibility.


Atlas supports independent named sheets. Save retains every sheet; export uses
only the active sheet, with stable project/sheet/sprite IDs and whole/partial
scope. Proplet exports art metadata; anchors and collision belong in Workshop.
See [EXPORT-FORMAT.md](EXPORT-FORMAT.md) and [CHANGELOG.md](CHANGELOG.md).
