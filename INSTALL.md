# Tool sidebar consistency fix

Replace these existing files:

- `public/js/tool-base.js`
- `public/css/tools.css`

Then run:

```bash
python3 scripts/build_site.py
```

This makes the Notes drawer opened from any tool match the main notes sidebar immediately:

- centered **Notes** heading
- **Builder** button on the right
- close button on the left
- divider line under the heading
- Note Builder omitted from the Tools dropdown on tool pages

No new runtime files are added.
