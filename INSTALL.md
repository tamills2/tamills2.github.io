# CIDR, Subnet & Wildcard Converter

Copy:

```text
public/tools/cidr-subnet-converter/
```

into your repository, then run:

```bash
python3 scripts/build_site.py
```

Features:

- CIDR prefix → subnet mask + wildcard mask
- Subnet mask → CIDR prefix + wildcard mask
- Wildcard mask → CIDR prefix + subnet mask
- Optional IPv4 network, broadcast, usable range, and host counts
- Static HTML, CSS, and JavaScript only
