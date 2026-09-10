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
