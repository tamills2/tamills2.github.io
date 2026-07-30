# Character Inspector

Copy these files into the matching locations:

```text
public/tools/character-inspector/index.html
public/tools/character-inspector/tool.css
public/tools/character-inspector/tool.js
public/tools/character-inspector/tool.json
public/data/tools-manifest.json
public/data/site-search-index.json
```

The tool is automatically included in the Tools menu, homepage tools, and global search.

You may alternatively copy only the tool folder and run:

```bash
python3 scripts/generate_notes_manifest.py
```

to regenerate the two manifest files locally.
