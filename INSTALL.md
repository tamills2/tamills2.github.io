# Notes folder-type fix

Replace:

```text
public/js/main.js
```

This preserves the previous navigation collapse-state behavior while allowing
the notes tree to recognize both `"folder"` and legacy `"directory"` manifest
entries.
