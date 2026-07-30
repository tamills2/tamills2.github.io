Download a custom browser build of Highlight.js and place the files here.

Required layout:

public/vendor/highlight/
├── highlight.min.js
├── languages/
│   └── bash.min.js
└── styles/
    ├── github.min.css
    └── github-dark.min.css

The site still displays plain text if Highlight.js is temporarily absent, but
your browser console will show 404 errors until the files are added.
