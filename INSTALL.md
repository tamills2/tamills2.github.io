# Repo site installation

## Replace/add these files

Copy the package contents into the root of your local repository. Preserve the
directory structure.

## Download Highlight.js locally

Use the official Highlight.js custom-download page. Select Bash and download
the browser bundle. Place the required files here:

public/vendor/highlight/highlight.min.js
public/vendor/highlight/languages/bash.min.js
public/vendor/highlight/styles/github.min.css
public/vendor/highlight/styles/github-dark.min.css

Depending on the downloaded archive, the Bash language file may already be
included inside highlight.min.js. It is safe to omit the separate language
file only after removing its script tag from public/index.html.

## Generate the directory locally

From the repository root:

python3 scripts/generate_notes_manifest.py

## Preview locally

From the repository root:

python3 -m http.server 8000 --directory public

Open:

http://localhost:8000/

Do not open index.html directly through file:// because browsers block or
restrict fetch() calls used to load the notes manifest and note files.

## Push

git status
git add .
git commit -m "Build Repo notes interface"
git pull --rebase origin main
git push

The deployment workflow regenerates public/data/notes-manifest.json before
uploading public/ to GitHub Pages.
