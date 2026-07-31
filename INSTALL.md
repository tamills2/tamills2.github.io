# Shared Tools Menu Standardization

Extract this archive into the repository root, replacing the included files.

The Tools menu width and single-line labels now live in:

`public/css/styles.css`

Page-specific copies were removed from Common Ports, Timezones, and Cron Expression.
All current and future pages that use the shared site stylesheet inherit the same menu.

Rebuild with:

```bash
python3 scripts/build_site.py
```
