# ANSI Codes & Color Builder

Copy this folder into the repository root so these files land at:

- `public/tools/ansi-code-builder/index.html`
- `public/tools/ansi-code-builder/tool.css`
- `public/tools/ansi-code-builder/tool.js`
- `public/tools/ansi-code-builder/tool.json`

Then rebuild the generated manifests:

```bash
python3 scripts/build_site.py
```

No packages, CDN files, icon fonts, or internet access are required. The color wheel is drawn locally with the Canvas API and all icons are inline SVG.
