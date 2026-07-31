# Note gutter top alignment fix

Replace:

```text
public/css/styles.css
```

Then rebuild:

```bash
python3 scripts/build_site.py
```

This keeps the line-number gutter and its divider flush against the note header,
while preserving the extra 0.6rem of breathing room above the first line.
