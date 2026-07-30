# Shared tool header migration

Replace the included files at the same paths in your repository.

This is a one-time migration. Each tool page now contains only:

```html
<div id="shared-tool-header"></div>
```

`public/js/tool-base.js` generates the shared header, Tools menu, search control,
theme switch, notes drawer, and navigation behavior.

After this update, future header/navigation changes should normally require only:

- `public/js/tool-base.js`
- `public/css/tools.css`

The template no longer references optional `tool.css` or `tool.js` files.
