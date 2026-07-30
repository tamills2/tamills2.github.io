# Timezones with timestamp converter

Replace:

```text
public/tools/timezones/index.html
public/tools/timezones/tool.css
public/tools/timezones/tool.js
public/tools/timezones/tool.json
```

Then run:

```bash
python3 scripts/build_site.py
```

Added below the live timezone cards:

- Date and time conversion between selectable IANA timezones
- Unix epoch seconds input
- Unix epoch milliseconds input
- Converted local time in the selected target timezone
- ISO 8601 output
- UTC output
- Epoch seconds and milliseconds output
- Current-time shortcut
- Timezone swap button
