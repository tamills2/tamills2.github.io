# ANSI and subnet visual cleanup v2

Extract this archive into the repository root and allow it to replace the existing files.

Then rebuild:

```bash
python3 scripts/build_site.py
```

Changes:

- Makes the subnet calculator's **Network** result card identical to the other result cards.
- Removes the light-gray fill from ANSI reference sequence chips.
- Removes the light-gray fill from the color preview when displaying a foreground color.
- Removes the light-gray fill from all generated color-value cards.
- Keeps selected background-color previews functional.
- Keeps the ANSI dark-mode styling unchanged.
