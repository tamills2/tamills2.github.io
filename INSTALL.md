# Common Ports badge and Netcat fix

Extract this archive into the repository root, allowing the files under `public/` to overwrite the existing Common Ports tool files.

Then rebuild the site:

```bash
python3 scripts/build_site.py
```

Changes:

- Gives all security-status badges a consistent width and centered label alignment.
- Keeps multi-line status labels centered regardless of the active filter.
- Changes the generated Netcat command from `nc -vz` to `nc -nvz`.
