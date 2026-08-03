LINKS PAGE DATA
===============

Edit this file to manage the page:

    public/data/links.json

The JSON is split into sections. Each section has a visible heading and a list
of links beneath it:

[
  {
    "section": "Documentation & References",
    "links": [
      {
        "title": "Website title",
        "url": "https://example.com/",
        "description": "Why this site is useful."
      }
    ]
  }
]

Add another object inside a section's "links" array to add a card. Add another
section object to create a new heading. Sections and links appear in the same
order as they are written in the JSON file.

Every card opens in a new browser tab. The original flat-array JSON format is
still accepted and will appear under an "Other" heading.
