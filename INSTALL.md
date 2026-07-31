# Common Ports Reference

Extract this archive into the repository root, preserving the `public/tools/common-ports/` directory.

Then rebuild the generated manifests and search index:

```bash
python3 scripts/build_site.py
```

The tool is fully offline and uses the repository's existing shared tool header, theme, notes drawer, and tools menu.

## Included features

- Searchable common TCP and UDP port reference
- Category, protocol, and security filters
- Quick filters for frequently used ports
- Port detail panel with related services
- Copyable port summaries
- Well-known, registered, and dynamic range guide
- Offline command generation for Netcat, Nmap, PowerShell, Windows netstat, Linux `ss`, and Bash TCP checks
- Responsive light and dark themes
