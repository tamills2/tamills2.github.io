# ANSI Codes & Color Builder — light-mode fix

Extract this archive into the repository root, replacing the existing ANSI tool files, then rebuild:

```bash
python3 scripts/build_site.py
```

This fixes the light-theme backgrounds for:

- ANSI sequences in the reference table
- the terminal preview in the color builder
- the generated-code output panel

Dark mode retains its existing dark terminal-style surfaces.
