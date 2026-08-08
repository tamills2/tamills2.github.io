# Repo audit — 2026-08-06

## Fixed in this update

- Added a shared responsive reference-card grid system.
- Reworked the Vim cheatsheet into automatically flowing multi-column cards.
- Made Cron, Unix Permissions, Common Ports, ANSI, HTTP Status Codes, Timezones, Hashes & Encoding, and URL Encode/Decode use more of the available viewport and reflow as the window changes size.
- Added the missing Vim fold navigation commands `z[` and `z]`.
- Normalized the remaining Vim arrow-key notation to the site's `{Key}` convention.
- Removed the final page-title description from Unix Permissions.
- Rebuilt generated tool and search manifests.
- Removed committed macOS `.DS_Store` files from the working tree.

## Items still needing attention

### Highlight.js assets are missing

`public/index.html` references these files, but they are not present:

- `public/vendor/highlight/highlight.min.js`
- `public/vendor/highlight/languages/bash.min.js`
- `public/vendor/highlight/styles/github.min.css`
- `public/vendor/highlight/styles/github-dark.min.css`

The Notes Viewer still works without them, but syntax highlighting is unavailable and the browser logs 404 errors. Add an offline Highlight.js browser build before treating the repository as complete.

### Clipboard fallback

Several tools use `document.execCommand("copy")` only as a fallback when the modern Clipboard API is unavailable. The fallback is deprecated but remains useful for offline/file contexts. It should not be expanded into new code; new copy features should use the shared Clipboard API helper first.

### Generated files

Run `python3 scripts/build_site.py` after changing notes, tool metadata, tool page content, or links. The generated manifests were refreshed in this update.

### Repository packaging

The uploaded archive included `.git`, `__MACOSX`, `.DS_Store`, and a Python `__pycache__`. The clean distribution ZIP excludes those generated/system files. Keep `.git` in your real working checkout, but do not ship it as part of the static site bundle.

##################### UPDATES TO FIX INTERFACES BUTTON #####################
# OPEN tool.css AND CHANGE THIS:
.nm-inspector-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: .25rem;
  padding: .5rem;
  border-bottom: 1px solid var(--border);
}

.nm-inspector-tabs button {
  min-width: 0;
  padding: .4rem .2rem;
  font-size: .69rem;
}

# TO THIS:
.nm-inspector-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(4.75rem, 1fr));
  gap: .25rem;
  padding: .5rem;
  border-bottom: 1px solid var(--border);
}

.nm-inspector-tabs button {
  min-width: 0;
  padding: .4rem .35rem;
  font-size: .69rem;
  white-space: nowrap;
}

# AND DELETE THIS:
.nm-inspector-tabs {
  grid-template-columns: repeat(3, 1fr);
}
# Repo audit update — 2026-08-08 — Puzzle Maker polish pass

## Puzzle Maker changes completed

- Changed the paused overlay from an almost-solid surface to a translucent, lightly blurred covering so the puzzle colors remain vaguely visible underneath.
- Added click/tap-anywhere resume behavior to the paused puzzle overlay.
- Changed puzzle timing so a newly created or restarted puzzle remains at `00:00` until the player first interacts with the puzzle workspace. Piece dragging, workspace panning, wheel zooming, and the zoom controls start the timer; opening menus or creating the puzzle does not.
- Added explicit timer-start state so pausing before the first move does not accidentally begin the timer when resumed.
- Reworked jigsaw edge geometry to use a shallower, symmetric classic tab/socket profile with balanced shoulders and rounded centered tabs instead of the previous pinched/deep shape.
- Added a completion camera transition that centers the solved puzzle and zooms out only as far as needed to fit the full completed image in the current workspace.
- Added a completion overlay using the same translucent treatment as pause. It appears after the fit/center transition and includes:
  - `Puzzle Completed`
  - final elapsed time
  - puzzle title
  - completed-image preview
  - `Restart Puzzle` and `New Puzzle` buttons
- `Restart Puzzle` recreates the same puzzle with the same edge layout, resets the timer to `00:00`, and again waits for the first interaction before timing.
- `New Puzzle` returns to the setup screen with the current image and piece options cleared so the user starts from a blank puzzle-creation state.
- Replaced the malformed restart SVG with a separated circular-arrow arc and arrowhead so the visual gap is at the top instead of the bottom and the arrowhead is not incorrectly joined to the circle.
- Replaced the `Show minimized clock` checkbox appearance with a neutral gray/dark-gray slider switch that matches the site's light/dark visual language without using the accent blue.
- Added small-screen stacking for the completion action buttons.

## Files changed in this update

- `public/games/puzzle-maker/index.html`
- `public/games/puzzle-maker/game.css`
- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes.
- Confirmed the new Puzzle Maker completion/pause controls exist and have no duplicate HTML IDs.
- No generated site manifest rebuild was required because this pass did not change game metadata, tool metadata, notes, links, or generated manifest inputs.

## Puzzle Maker follow-up testing

The Puzzle Maker is still the active game being hardened before moving on to Wordle and Sudoku. On the next browser/manual pass, specifically verify the feel of the revised jigsaw tab shape at several piece counts, the amount of pause/completion translucency in both themes, the completion fit/center transition at different zoom levels and window sizes, and the final spacing of the completion card.

# Repo audit update — 2026-08-08 — Puzzle Maker reference-shape + pan stability pass

## Puzzle Maker changes completed

- Reworked jigsaw geometry again using the supplied physical puzzle-piece reference as the visual guide. Pieces now use conventional straight runs, narrow necks, and rounded tabs/sockets rather than the earlier pinched profile.
- Added six restrained edge-profile variations (centered, slightly offset, wider, narrower, shallower, and deeper) so the generated puzzle is not limited to a small set of identical silhouettes while still looking like a standard jigsaw.
- Shared edges now carry both their direction and profile, and neighboring pieces receive the exact inverse of the same edge so every tab/socket pair remains geometrically matched.
- Reduced overall tab depth slightly to keep the shapes closer to common manufactured puzzle pieces.
- Fixed shaky workspace panning. Panning no longer converts every pointer movement through the SVG viewBox while that same viewBox is moving; it now uses stable screen-space pointer deltas divided by the current zoom.
- Added pointer capture during workspace panning so dragging remains continuous even when the pointer moves quickly.
- Canvas panning now starts the clock only after actual pointer movement (2 px threshold), so a simple background click does not start the timer.
- Increased pause/completion-overlay transparency from the previous polish pass so the colors and rough arrangement of the puzzle remain visible beneath the dim layer.

## Files changed across the current Puzzle Maker update set

These are the only files that need to be copied into the repository for the Puzzle Maker changes from this session:

- `public/games/puzzle-maker/index.html`
- `public/games/puzzle-maker/game.css`
- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes after the new edge-profile and panning changes.
- `git diff --check` passes.
- Confirmed the generated edge data is deterministic for a given image/grid and that adjacent pieces use inverse directions with the same profile identifier.

## Next Puzzle Maker manual checks

- Visually compare several generated puzzles at low, medium, and high piece counts against the supplied reference and tune tab width/depth only if needed.
- Confirm workspace panning is smooth with mouse and trackpad at several zoom levels.
- Verify pause transparency in both light and dark themes.
- Verify the completion fit/center animation and completion card after solving a puzzle.

# Repo audit update — 2026-08-08 — Puzzle Maker Jigidi-shape + recenter/completion pass

## Puzzle Maker changes completed

- Reworked the piece edge geometry again toward a conventional online/physical jigsaw silhouette: long straight runs, a short concave shoulder/neck, and a broad rounded tab/socket head. The supplied Jigidi creator HTML was reviewed as the reference page; its inline code initializes `JigidiCreator`, while the actual creator implementation is loaded from the external `/creator/js/release.js` asset, so no Jigidi source implementation was copied into this repository.
- Kept several restrained standard edge profiles by varying only tab width/depth. Tab centers remain centered so opposite sides of a shared edge are guaranteed to trace the same geometry when traversed in reverse.
- Centered the Create Puzzle page content: heading, upload area, default-image selector, source details, piece slider, and Create Puzzle button now share a centered single-column layout with a bounded setup width.
- Slowed mouse-wheel/trackpad zoom substantially. Wheel zoom now scales continuously from the wheel delta instead of applying a fixed 10% jump on every wheel event, making it much harder to overshoot and lose the pieces.
- Added a Recenter Pieces toolbar button immediately beside Zoom In. Its inline SVG recreates the supplied inward-arrows/center-dot symbol without adding another asset file.
- Added Recenter Pieces behavior that calculates the bounds of every current puzzle piece (including tab clearance), fits all pieces into the workspace, and centers the resulting view.
- Added a close (`×`) control to the Puzzle Completed card so the completion message can be dismissed to view the completed image unobstructed.
- Changed the three-dot Puzzle Menu button after completion: once the puzzle is complete, pressing the three-dot button reopens the Puzzle Completed message instead of opening the normal in-progress settings panel.
- Preserved the prior Puzzle Maker fixes: delayed timer start, translucent pause/completion coverings, click-to-resume pause, stable screen-delta panning, completion fit/center transition, restart/new-puzzle actions, restart icon repair, and neutral minimized-clock toggle.

## Files changed in this update

Only these files need to be copied into the repository:

- `public/games/puzzle-maker/index.html`
- `public/games/puzzle-maker/game.css`
- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes.
- `git diff --check` passes for the Puzzle Maker files.
- Recenter and completion controls use unique HTML IDs.
- Shared jigsaw edges use centered, mirrored tab/socket geometry so neighboring pieces retain matching boundaries.

## Next Puzzle Maker manual checks

- Compare the new rounded jigsaw tabs/sockets visually against Jigidi at low, medium, and high piece counts and tune only tab width/depth if the silhouette still needs adjustment.
- Test wheel/trackpad zoom speed on the primary browser and confirm it is slow enough without feeling unresponsive.
- Scatter pieces, deliberately pan/zoom away from them, then confirm Recenter Pieces reliably brings every piece back into view.
- Complete a puzzle, close the completion card with `×`, confirm the full image remains visible, then press the three-dot button and confirm the completion card reopens.
- Recheck the centered Create Puzzle setup on both wide and narrow screens.
