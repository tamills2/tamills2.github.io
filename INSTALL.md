# Tool sidebar visibility fix

Replace only:

- `public/js/tool-base.js`

Then run:

```bash
python3 scripts/build_site.py
```

The previous patch referenced `root` outside the scope where it was declared. That caused the drawer initialization to stop with a JavaScript error on every tool page. This version resolves the repository root inside the drawer initializer itself.

No new runtime files are added.
