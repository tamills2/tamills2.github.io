# Timezone epoch output and Cron Expression tool

Extract this archive into the repository root, replacing the included files, then rebuild:

```bash
python3 scripts/build_site.py
```

Changes:

- adds an Output format selector to the Timezones timestamp converter;
- supports timezone output, epoch seconds, and epoch milliseconds as the primary conversion target;
- adds a new offline Cron Expression tool;
- generates standard five-field Unix cron expressions from presets or editable fields;
- validates and explains pasted five-field cron strings;
- shows a field-by-field breakdown and supports month/day names such as JAN and MON.
