# Tool note-tree formatting fix

Replace these files in the repository:

- `public/js/tool-base.js`
- `public/css/tools.css`

Then rebuild:

```bash
python3 scripts/build_site.py
```

The tool-page Notes tree now uses the same `.tree-row`, `.tree-icon`, chevron, spacing, and single-line entry structure as the main notes viewer.
