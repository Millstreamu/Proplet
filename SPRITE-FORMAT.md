# Proplet sprite code — LLM authoring formats

Compact text formats for describing a pixel sprite (or a whole animation) so a
language model can author one reliably. Paste it into Proplet via **File → Paste
sprite code…**, open it as a **share link**, or apply it with `window.proplet.paste(text)`.

Pasting writes to the **current surface** — the active frame, tile, or atlas sprite —
resizing it to `w × h` first. An **animation** or a **.pixelproj** replaces the whole
project. Input is tolerant: **code fences, surrounding prose, and trailing commas are
stripped automatically**, so you can paste a model's reply as-is.

## 1. JSON grid (one sprite)

```json
{
  "w": 16, "h": 16,
  "palette": { ".": null, "R": "#e23b4e", "D": "#7a1f2b", "W": "#ffffff" },
  "rows": [
    "................", "...DD.....DD....", "..DRRD...DRRD...", ".DRWWRD.DRRRRD..",
    ".DRWWRRRRRRRRD..", ".DRRRRRRRRRRRD..", "..DRRRRRRRRRD...", "...DRRRRRRRD....",
    "....DRRRRRD.....", ".....DRRRD......", "......DRD.......", ".......D........",
    "................", "................", "................", "................"
  ]
}
```

- One character per pixel; `rows` has `h` strings each `w` chars wide.
- `palette` maps a char → `#rrggbb` (or `#rgb`), or `null` for transparent.
- `.` is conventionally transparent; any char not in the palette is transparent too.
- `#` may be omitted on hex. `w`/`h` are optional (inferred from the rows).

## 2. Plain-text grid (no JSON — nothing to escape)

```
16x16
. transparent
R #e23b4e
D #7a1f2b
W #ffffff
................
...DD.....DD....
..DRRD...DRRD...
( …remaining rows… )
```

- Optional `WxH` size line.
- **Legend lines**: `<char><space><#rrggbb | transparent>`.
- Everything else is a **grid row**. `.` and space are transparent.
- This is the most robust form for a chat model — no brackets or quoting.

## 3. Animation (multiple frames)

```json
{
  "w": 16, "h": 16,
  "palette": { ".": null, "B": "#2f5670", "L": "#6fb0c9" },
  "frames": [
    { "rows": [ … ], "dur": 120 },
    { "rows": [ … ], "dur": 120 }
  ],
  "tags": [ { "name": "walk", "start": 1, "end": 2, "mode": "Forward" } ]
}
```

- `frames` is an array; each has `rows` (and optional `dur` ms, and its own `palette`).
- Optional `tags` define named animations (`mode`: `Forward` / `Reverse` / `Ping Pong`).
- Importing an animation **replaces the whole project**.

A full `.pixelproj` (from **Save**) can also be pasted and is loaded as-is.

## 4. Share links

`window.proplet.toLink()` (or **Paste sprite code… → Copy link**) returns a URL with
the sprite/animation encoded in the hash: `…/index.html#art=<base64url>`. Opening it
loads the art on page open (a single sprite opens as a clean 1-frame project). Best for
small sprites — a 12-frame 32×32 animation produces a long URL, so prefer **code** for
large content.

## Prompt snippet for a Custom GPT / assistant

> You generate pixel-art sprites for "Proplet". Output **only** the sprite, in this
> plain-text format and nothing else — no prose, no code fences:
>
> ```
> WxH
> . transparent
> <CHAR> <#rrggbb>        (one legend line per colour)
> <H rows, each W characters, one char per pixel; use . for transparent>
> ```
>
> Keep the palette small (3–6 colours), include a 1-pixel darker outline, and add a
> small lighter highlight. Prefer 16×16 unless asked otherwise.

(JSON `{ w, h, palette, rows }` is equally accepted if you prefer it.)

## Programmatic / agent use — `window.proplet`

```js
proplet.paste(text)              // apply any of the formats above (or a .pixelproj)
proplet.toSpec({allFrames:true}) // current surface / animation → spec object
proplet.toLink(spec?)            // → shareable #art= URL
proplet.getPixels()              // { w, h, px:[ '#rrggbb' | null, … ] }
proplet.setPixels(px, w, h); proplet.setPixel(x,y,col); proplet.fillRect(x,y,w,h,col); proplet.clear()
proplet.setColor('#rrggbb'); proplet.resize(w,h); proplet.newProject({w,h,name})
proplet.setWorkspace('frames'|'tiles'|'atlas')
proplet.addFrame(); proplet.setFrame(i); proplet.addTile(name); proplet.addSprite({w,h,name})
proplet.loadImage(dataURL); proplet.loadProject(json); proplet.exportPNG()
proplet.undo(); proplet.redo(); proplet.info(); proplet.help()
```

Every mutation snapshots for undo and repaints.
