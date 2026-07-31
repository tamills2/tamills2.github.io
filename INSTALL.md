# URL Encode / Decode + CIDR title update

Extract this archive into the repository root.

Run the one-time CIDR title update, then rebuild:

```bash
python3 scripts/apply_cidr_oxford_comma.py
python3 scripts/build_site.py
```

The new tool is located at:

```text
public/tools/url-encode-decode/
```

The title updater changes the exact text:

```text
CIDR, Subnet & Wildcard Converter
```

to:

```text
CIDR, Subnet, & Wildcard Converter
```

in matching HTML, JSON, and JavaScript files under `public/tools/`.
