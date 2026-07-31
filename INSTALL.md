# Tool sidebar restored

Replace these existing files:

- `public/js/tool-base.js`
- `public/css/tools.css`

Then rebuild:

```bash
python3 scripts/build_site.py
```

This restores the shared tool-page header/sidebar implementation and adds the Builder button to the drawer header. No new runtime files are introduced.
