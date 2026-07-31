# Regex Generator cleanup

This update changes only the Regex Generator.

1. Extract this archive into the repository root and replace the included files.
2. Delete the no-longer-used stylesheet:

```bash
rm -f public/tools/regex-generator/regex-cleanup.css
```

3. Rebuild:

```bash
python3 scripts/build_site.py
```

The existing `tool.css` now contains the Regex Generator's tool-specific layout rules. The temporary `regex-cleanup.css` link, file, preset markup, preset JavaScript, and preset-only CSS are removed.
