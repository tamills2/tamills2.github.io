# Tool template

1. Copy this folder and rename it.
2. Edit `tool.json`.
3. Build the tool in `index.html`, `tool.css`, and `tool.js`.
4. Run `python3 scripts/generate_notes_manifest.py`.

The build automatically:
- adds the tool to the Tools menus;
- adds homepage cards when `"homepage": true`;
- indexes the title, description, keywords, headings, labels, buttons,
  options, list items, placeholders, aria-labels, and other user-facing text.

Implementation details from CSS and JavaScript are intentionally not indexed.
