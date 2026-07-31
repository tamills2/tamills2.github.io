# Note copy button position fix

Replace:

- `public/index.html`
- `public/css/styles.css`

Then rebuild:

```bash
python3 scripts/build_site.py
```

The copy button now sits inside the note window header at the far right, beside the language label. Its existing copy and “Copied” behaviour is unchanged.
