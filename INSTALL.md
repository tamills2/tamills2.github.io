# Tool sidebar formatting fix

Replace:

`public/css/tools.css`

Then rebuild and redeploy:

```bash
python3 scripts/build_site.py
git add public/css/tools.css public/data
git commit -m "Fix tool notes sidebar formatting"
git push
```

This version keeps Notes mathematically centered regardless of the Builder button width and draws the divider directly on the drawer header.
