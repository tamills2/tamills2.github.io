# Number Base Converter

Replace the complete folder:

public/tools/number-base-converter/

Then run:

python3 scripts/build_site.py

Auto width is the default. Examples in signed mode:

- FF -> 11111111 -> -1
- FFFF -> 1111111111111111 -> -1
- 7F -> 01111111 -> 127

Manual 8-, 16-, 32-, and 64-bit modes are also available.
