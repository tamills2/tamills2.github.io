# Note Builder

Copy this complete folder into the repository:

public/tools/note-builder/

Then run:

python3 scripts/build_site.py

## Manifest lookup

The tool automatically checks these common generated manifest paths:

- public/data/notes-manifest.json
- public/data/notes.json
- public/notes-manifest.json
- public/notes.json
- public/assets/notes-manifest.json
- public/assets/notes.json

If your generated notes manifest uses a different location, edit the
MANIFEST_CANDIDATES array near the top of tool.js.

## Behaviour

- A note may be added any number of times.
- Each added copy is an independent ordered item.
- Up/down buttons arrange the selected notes.
- One blank line is inserted between note contents.
- Downloads use UTF-8 text and Linux LF (`\n`) line endings.
- HTML notes are converted to visible page text before combining.
- Markdown and plain-text notes are preserved as text.
