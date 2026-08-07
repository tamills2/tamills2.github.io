DEFAULT PUZZLE IMAGES

Put local puzzle images in this folder and add them to manifest.json.

Recommended formats:
- JPEG (.jpg / .jpeg) for photographs
- PNG (.png) for lossless artwork
- WebP (.webp) is also supported

Recommended source resolution:
- 2400 x 1600 pixels minimum for large puzzles
- 3000 x 2000 pixels or larger preferred
- Any aspect ratio is supported

Example manifest.json:
[
  {"title": "Mountain Lake", "file": "mountain-lake.jpg"},
  {"title": "Night City", "file": "night-city.jpg"}
]

The maximum available piece count is calculated from the actual image dimensions and is capped at 600 pieces.
