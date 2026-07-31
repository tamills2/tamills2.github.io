# Tool sidebar split-layout fix

Replace these files in the repository:

- `public/js/tool-base.js`
- `public/css/tools.css`

Then rebuild:

```bash
python3 scripts/build_site.py
```

On desktop, the Notes sidebar now splits the tool page instead of overlaying it. The heading matches the notes viewer and opening a note preserves the expanded sidebar state.
