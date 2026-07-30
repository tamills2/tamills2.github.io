# Minimal Character Inspector boxes

Replace:

```text
public/tools/character-inspector/index.html
public/tools/character-inspector/tool.css
public/tools/character-inspector/tool.js
public/tools/character-inspector/tool.json
```

Then run:

```bash
python3 scripts/build_site.py
```

The output now sits directly below the textarea as small individual outlined
character boxes. Each box contains only the character. Hover or keyboard-focus
a box to see an opaque tooltip with the character name, position, Unicode code
point, and decimal value.
