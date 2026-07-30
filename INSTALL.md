# Repo site installation

## Replace/add these files

Copy the package contents into the root of your local repository. Preserve the
directory structure.

## Download Highlight.js locally

Use the official Highlight.js custom-download page. Select Bash and download
the browser bundle. Place the required files here:

public/vendor/highlight/highlight.min.js
public/vendor/highlight/languages/bash.min.js
public/vendor/highlight/styles/github.min.css
public/vendor/highlight/styles/github-dark.min.css

Depending on the downloaded archive, the Bash language file may already be
included inside highlight.min.js. It is safe to omit the separate language
file only after removing its script tag from public/index.html.

## Generate the directory locally

From the repository root:

python3 scripts/generate_notes_manifest.py

## Preview locally

From the repository root:

python3 -m http.server 8000 --directory public

Open:

http://localhost:8000/

Do not open index.html directly through file:// because browsers block or
restrict fetch() calls used to load the notes manifest and note files.

## Push

git status
git add .
git commit -m "Build Repo notes interface"
git pull --rebase origin main
git push

The deployment workflow regenerates public/data/notes-manifest.json before
uploading public/ to GitHub Pages.


## Search features

The header search searches note names, paths, and full text. Its static index is
generated into:

public/data/site-search-index.json

Keyboard shortcuts:

- Command+K on macOS or Ctrl+K elsewhere focuses the site-wide search.
- Command+F on macOS or Ctrl+F while a note is open focuses Find in note.
- Enter moves to the next in-note match.
- Shift+Enter moves to the previous match.
- Escape clears the active search.


## Adding tools and pages to global search

Add these attributes to a link you want indexed:

```html
data-search-type="tool"
data-search-title="Subnet Calculator"
data-search-keywords="cidr network ip address"
```

Notes are indexed automatically. Tools and pages are read directly from links in public/index.html.


## Global search results page

Typing a query and pressing Enter opens a full results view. Using the arrow
keys first and then pressing Enter opens the highlighted dropdown result.

## Balanced header layout

The header uses three grid columns: left controls, flexible title space, and
right controls. Repo is centered inside the space remaining between the two
control groups. The global search retains its normal width instead of
progressively collapsing as the window narrows.


## Shared tool framework

The reusable tool framework adds:

- `public/css/tools.css` — shared cards, fields, buttons, output panels, and tool layout.
- `public/js/theme.js` — shared light/dark theme state and persistence.
- `public/js/tool-base.js` — shared tool-header menu and global-search forwarding.
- `public/tools/template/` — a folder you can duplicate for each new tool.

To create a tool, duplicate `public/tools/template`, rename the folder, and edit
its `index.html`, `tool.css`, and `tool.js` files.

Every tool loads the same CSS variables as the homepage, so changing themes on
one page changes the saved theme for all pages. Search from a tool redirects to
the homepage and opens the full global results view.

## Regex Generator

The first real tool is located at:

public/tools/regex-generator/

It supports:

- one generalised regex for all non-empty example lines
- one regex per example line
- structural conversion such as 12345 to \\d{5}
- common presets for IPv4, email, phone, URL, UUID, dates, times, and hex colours
- live testing of generated and preset patterns
- shared light/dark theme and tool header

The homepage Tools menu and quick links already include it.


## Automatic tool discovery

Each tool is a folder under `public/tools/` with an `index.html` and `tool.json`.

Example:

```text
public/tools/regex-generator/
├── index.html
├── tool.css
├── tool.js
└── tool.json
```

Example metadata:

```json
{
  "title": "Regex Generator",
  "description": "Generate regular expressions from sample text.",
  "category": "Text",
  "keywords": ["regex", "regular expression"],
  "homepage": true,
  "order": 10
}
```

Run:

```bash
python3 scripts/generate_notes_manifest.py
```

This creates:

```text
public/data/notes-manifest.json
public/data/tools-manifest.json
public/data/site-search-index.json
```

Tools are automatically added to the Tools dropdown and global search. Tools
with `"homepage": true` are also added to the homepage. Search indexes metadata
plus user-facing HTML text such as headings, descriptions, labels, buttons,
options, placeholders, and accessibility labels. CSS and implementation-level
JavaScript identifiers are not indexed.
