# Repo audit — 2026-08-06

## Fixed in this update

- Added a shared responsive reference-card grid system.
- Reworked the Vim cheatsheet into automatically flowing multi-column cards.
- Made Cron, Unix Permissions, Common Ports, ANSI, HTTP Status Codes, Timezones, Hashes & Encoding, and URL Encode/Decode use more of the available viewport and reflow as the window changes size.
- Added the missing Vim fold navigation commands `z[` and `z]`.
- Normalized the remaining Vim arrow-key notation to the site's `{Key}` convention.
- Removed the final page-title description from Unix Permissions.
- Rebuilt generated tool and search manifests.
- Removed committed macOS `.DS_Store` files from the working tree.

## Items still needing attention

### Highlight.js assets are missing

`public/index.html` references these files, but they are not present:

- `public/vendor/highlight/highlight.min.js`
- `public/vendor/highlight/languages/bash.min.js`
- `public/vendor/highlight/styles/github.min.css`
- `public/vendor/highlight/styles/github-dark.min.css`

The Notes Viewer still works without them, but syntax highlighting is unavailable and the browser logs 404 errors. Add an offline Highlight.js browser build before treating the repository as complete.

### Clipboard fallback

Several tools use `document.execCommand("copy")` only as a fallback when the modern Clipboard API is unavailable. The fallback is deprecated but remains useful for offline/file contexts. It should not be expanded into new code; new copy features should use the shared Clipboard API helper first.

### Generated files

Run `python3 scripts/build_site.py` after changing notes, tool metadata, tool page content, or links. The generated manifests were refreshed in this update.

### Repository packaging

The uploaded archive included `.git`, `__MACOSX`, `.DS_Store`, and a Python `__pycache__`. The clean distribution ZIP excludes those generated/system files. Keep `.git` in your real working checkout, but do not ship it as part of the static site bundle.
