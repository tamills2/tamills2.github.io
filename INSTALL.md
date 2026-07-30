# Final Character Inspector

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

Final behavior:

- Live updates while typing
- Small individual outlined character boxes directly beneath the textarea
- Only the character appears inside each box
- Opaque, readable hover and keyboard-focus tooltip
- Tooltip shows the exact character name, position, Unicode code point, and decimal value
- Invisible characters receive compact labels such as SP, TAB, LF, and ZWSP
- No example button
