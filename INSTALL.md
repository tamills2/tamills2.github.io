# Timezones — complete fixed version

Replace the entire folder:

```text
public/tools/timezones/
```

Then run:

```bash
python3 scripts/build_site.py
```

This is the complete tool, not a partial CSS patch. It preserves the timestamp converter and restores the full clock card styling while keeping exactly five clocks per row at every viewport width.
