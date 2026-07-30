# Creating a new tool

1. Duplicate this `template` folder.
2. Rename the copied folder using lowercase words and hyphens.
3. Change the page title, heading, description, interface, and `tool.js`.
4. Add the new tool to the Tools menus in `public/index.html` and each tool page.
5. Add `data-search-*` attributes to the homepage Tools link so global search can find it.

The shared theme is supplied by `../../js/theme.js`. The theme choice is stored under `repo-theme`, so it follows users between the homepage and every tool.
