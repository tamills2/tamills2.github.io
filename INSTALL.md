# Subnet and ANSI visual cleanup

Extract this archive into the repository root and allow it to replace the two existing `tool.css` files.

Then rebuild the site:

```bash
python3 scripts/build_site.py
```

Changes:

- Removes the accent border and tinted background from the subnet calculator's **Network** result card.
- Makes ANSI reference sequences, the color preview, and generated-code panel use the surrounding light-mode background with no extra tint.
- Keeps the ANSI tool's existing dark-mode backgrounds unchanged.
