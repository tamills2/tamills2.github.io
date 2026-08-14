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

# Repo audit update — 2026-08-08 — Jigidi cutter translation + anchored wheel zoom

## Puzzle Maker changes completed

- Replaced the hand-tuned approximation of the jigsaw tabs/sockets with an SVG translation of the actual Jigidi cutter geometry supplied by the user. The implementation uses the same normalized quadratic tab/socket profile and the same orientation/mirroring rules for top, right, bottom, and left edges.
- Added Jigidi-style grid irregularity: interior corner points receive up to 8% positional variation, edge midpoints receive the additional 10% along-edge variation, and each internal shared edge randomly selects one of the two tab/socket directions. All neighboring pieces reference the same generated cut-grid nodes, so their shared boundaries are identical.
- Fixed the wheel/trackpad zoom jump. Wheel zoom no longer recenters the whole viewport on the pointer's world coordinate; it now anchors the world point under the pointer to the same screen pixel before and after the zoom.
- Slowed wheel/trackpad zoom again. Wheel deltas are normalized by `deltaMode`, clamped, and converted with a much smaller exponential scale so small scroll gestures produce small zoom changes.
- Preserved button zoom behavior separately; the plus/minus toolbar buttons still zoom around the viewport center.

## Files changed in this update

Only these files need to be copied into the repository:

- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes after the Jigidi cutter and wheel-zoom changes.
- The Jigidi-style cut grid is deterministic for a given source image/title and grid size.
- Adjacent pieces share the same perturbed corner and edge-midpoint nodes, preventing gaps caused by independently generated boundaries.

## Next Puzzle Maker manual checks

- Compare several generated pieces directly against Jigidi at low and medium piece counts; the curve profile should now be materially closer because it is based on the supplied cutter implementation rather than visual approximation.
- Test both a mouse wheel and a Mac trackpad at the center and near all four edges of the workspace. Zoom should stay anchored beneath the pointer and should no longer fling the viewport sideways/up/down.
- Confirm the new slower zoom rate still has enough range when using several consecutive scroll gestures.

# Repo audit update — 2026-08-08 — Puzzle Maker group stacking + pause-layer pass

## Puzzle Maker changes completed

- Added connected-group-aware render ordering. Puzzle groups are now layered primarily by connected piece count: larger connected groups render farther back, while smaller groups render above them. For example, all loose single pieces render above all 2-piece groups, and all 2-piece groups render above all 3-piece groups.
- Preserved most-recent interaction ordering within each equal-size tier. Clicking/dragging a group records it as the most recently used group, so among groups containing the same number of pieces it renders above the other groups of that size.
- Removed the temporary SVG drag wrapper used during piece movement. Dragged members are now translated directly while moving, which prevents a large connected group from temporarily jumping above smaller groups and violating the size-based stacking rule.
- Reorders groups again after snapping/merging so a newly enlarged group immediately moves into the correct connected-size layer.
- Moved the paused canvas covering below the puzzle toolbar and settings drawer in the z-order. The three-dot menu, pause/resume button, restart control, clock option, piece-count controls, fullscreen, zoom, and recenter controls remain visible and interactive while the puzzle is paused.
- Increased the visual concealment of the paused puzzle itself with a substantially stronger surface tint and blur. Broad underlying color can remain faintly perceptible, but individual piece silhouettes should no longer be clearly readable through the pause layer.
- Kept click-on-the-covered-canvas-to-resume behavior; clicks on the toolbar/settings menu are intercepted by those higher layers and do not dismiss pause unless the user explicitly uses the resume control.

## Files changed in this update

Only these files need to be copied into the repository:

- `public/games/puzzle-maker/game.js`
- `public/games/puzzle-maker/game.css`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes.
- Confirmed there are no remaining runtime references to the removed temporary drag wrapper.
- Confirmed pause z-order is canvas cover (15), settings drawer (20), and toolbar (30), leaving the controls above the paused covering.

## Next Puzzle Maker manual checks

- Create several separate 1-, 2-, 3-, and 4-piece connected groups and confirm smaller groups always visually overlap larger groups regardless of click order.
- With two or more groups of the same size, click each in turn and confirm the most recently clicked group becomes the top group only within that size tier.
- Drag a large connected group underneath smaller groups and verify it remains underneath them during the drag, not only after release.
- Pause with the menu both open and closed. Confirm the canvas is strongly obscured, clicking the covered canvas resumes, and every visible toolbar/menu control remains interactive without implicitly resuming the puzzle.

# Repo audit update — 2026-08-08 — Puzzle Maker completion fit + image-aware piece counts

## Puzzle Maker changes completed

- Changed solved-puzzle framing so completion always animates to the largest zoom that still fits the entire completed puzzle inside the current workspace. It now zooms in when the user finishes while zoomed farther out, instead of only zooming out when necessary.
- Lowered the completion-only minimum zoom to `0.1` so very large/high-piece-count puzzles can still be fully fit on smaller screens. Normal in-progress zoom retains the existing `0.35` lower limit.
- Reworked Create Puzzle piece-count choices to be image-aware. Available grids are now generated from the source image's pixel dimensions and aspect ratio rather than starting from generic square-friendly counts.
- Resolution now determines the upper grid density using a minimum source-cell target of roughly 64 px per side, with the existing hard ceiling of 600 pieces. Lower-resolution images therefore expose a smaller image-specific maximum while sufficiently large images can still reach the general 600-piece ceiling.
- Aspect ratio now influences the actual low end as well: the generator targets the general 9-piece minimum but chooses the smallest suitable grid that follows the source aspect. Clearly non-square images never receive square `N × N` options.
- Filters candidate grids to favor layouts within roughly 20% of the source aspect ratio, preventing piece-count targets from visibly reshaping the image just to land on familiar counts. If an extreme image has no candidate within that tolerance, the generator falls back to the closest available resolution-safe grids.
- Restored wheel/trackpad zoom after puzzle completion. Once the completion card is dismissed, the solved image can be zoomed normally while remaining locked against piece dragging/snapping. The three-dot control continues to reopen the Puzzle Completed card.
- Completion-state wheel and toolbar zoom support the lower completion-only zoom floor so interacting with a large solved puzzle does not suddenly jump back to the normal in-progress minimum.

## Files changed in this update

Only these files need to be copied into the repository:

- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes.
- Confirmed non-square source images are excluded from square `cols === rows` grid candidates.
- Confirmed completion fitting uses the calculated fit zoom directly rather than preserving a smaller pre-completion zoom.
- Confirmed wheel zoom no longer blocks solely because the puzzle is complete; it remains blocked by pause and by interaction directly over the completion/settings overlays.

## Next Puzzle Maker manual checks

- Finish a puzzle while significantly zoomed out and verify the completed image animates larger until it nearly fills the available workspace without cropping.
- Finish a high-piece-count puzzle on a smaller browser window and verify the whole solved image still fits, including when the required zoom is below `0.35`.
- Test square, landscape, portrait, and panoramic source images on the Create Puzzle page. Confirm non-square sources do not offer square grids and that the displayed low/high piece counts change appropriately with image dimensions/aspect ratio.
- Dismiss the completion card and verify mouse-wheel/Mac-trackpad zoom remains anchored and smooth on the solved image. Confirm the three-dot button still restores the Puzzle Completed card afterward.

# Repo audit update — 2026-08-08 — Exit fullscreen on New Puzzle

## Puzzle Maker changes completed

- Changed both New Puzzle actions (the settings-menu button and the completion-card button) to exit any active browser fullscreen session before returning to the Create Puzzle setup screen.
- Supports both the standard Fullscreen API and the WebKit-prefixed fullscreen properties/method used by older Safari implementations.
- If exiting fullscreen returns a Promise, the setup reset waits for it to settle so the create screen does not remain visually trapped inside the old fullscreen state.
- If the browser refuses or fails to exit fullscreen, the existing setup reset still runs so the user is not blocked from starting a new puzzle.
- Restart Puzzle behavior is unchanged; restarting the current puzzle can remain fullscreen.

## Files changed in this update

Only these files need to be copied into the repository:

- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes.
- Confirmed both New Puzzle buttons now use the same fullscreen-aware handler.
- Confirmed Restart Puzzle still calls the existing restart handler directly and does not exit fullscreen.

## Next Puzzle Maker manual checks

- Enter fullscreen during an active puzzle, choose New Puzzle from the menu, and confirm fullscreen exits before the blank Create Puzzle page appears.
- Complete a puzzle in fullscreen, choose New Puzzle from the completion card, and confirm the same behavior.
- Verify Restart Puzzle still stays fullscreen.

# Repo audit update — 2026-08-14 — Puzzle Maker drag-start performance

## Puzzle Maker changes completed

- Optimized high-piece-count drag startup without changing the existing connected-group stacking rules.
- Replaced the old `raiseGroup()` behavior that re-appended every SVG piece on each pointerdown. Clicking a group now only repositions that active group within the existing size/recency ordering.
- Added `orderedGroupIds()` and `placeGroup()` helpers so larger connected groups remain behind smaller groups, while the most recently touched group still comes to the front within its own size tier.
- Updated group merging so only the newly enlarged/merged group is moved into its new stacking tier instead of rebuilding the entire SVG DOM order.
- Removed the redundant full-stack reorder after every completed drag. Snap/merge operations now maintain their own ordering incrementally.
- Replaced drag-time `createSVGPoint()` / `getScreenCTM().inverse()` coordinate conversion with stable client-pixel deltas divided by the zoom captured at drag start. This avoids an SVG matrix calculation on every pointermove and matches the stable delta-based approach already used for canvas panning.
- Puzzle behavior is otherwise unchanged: snapping, timer start, piece/group dragging, connected-group size ordering, same-size recency ordering, zoom, pause, completion, and fullscreen/new-puzzle behavior remain intact.

## Files changed in this update

Only these files need to be copied into the repository:

- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes.
- Confirmed the drag path no longer calls `getScreenCTM()` or performs inverse SVG matrix conversion.
- Confirmed pointerdown stacking calls `placeGroup()` rather than a full `reorderGroups()` pass.
- Confirmed full `reorderGroups()` remains available for initial scatter/setup, where a one-time complete ordering pass is appropriate.
- Confirmed merges preserve the existing size-first / recency-second stacking rule by repositioning only the merged group.

## Next Puzzle Maker manual checks

- On a 400–600 piece puzzle, click and immediately drag several loose pieces. Movement should begin with the pointer instead of hesitating for a fraction of a second.
- Repeat with 2-, 3-, and larger connected groups and confirm drag startup remains responsive.
- Confirm smaller connected groups still render above larger groups and most-recently clicked groups still render above other groups of the same size.
- Connect groups of different sizes repeatedly and confirm stacking tiers remain correct after every snap.
- Test dragging at several zoom levels to confirm screen-pixel motion maps correctly to puzzle movement at each zoom.

# Repo audit update — 2026-08-14 — Puzzle Maker zoom performance

## Puzzle Maker changes completed

- Optimized wheel/trackpad zoom performance on high-piece-count puzzles without changing zoom speed, limits, or cursor anchoring.
- Wheel input still updates the virtual camera for every incoming delta, but SVG `viewBox` writes are now coalesced through `requestAnimationFrame()` so the expensive 400–600 piece redraw happens at most once per display frame instead of once per wheel event.
- Added `scheduleViewResize()` specifically for high-frequency camera updates while preserving the existing immediate `resizeView()` path for one-off operations such as recentering, button zoom, completion fitting, and setup.
- Cached the workspace geometry used during wheel gestures and invalidate it when the workspace resizes, avoiding repeated `getBoundingClientRect()` layout reads for every tiny trackpad delta.
- Added a no-op guard when zoom is already at its minimum or maximum so further wheel events at the limit do not schedule unnecessary SVG redraws.
- The previous drag-start performance optimization remains unchanged.

## Files changed in this update

Only these files need to be copied into the repository:

- `public/games/puzzle-maker/game.js`
- `REPO_AUDIT.md`

## Validation performed

- `node --check public/games/puzzle-maker/game.js` passes.
- Confirmed the wheel handler no longer calls `resizeView()` directly for every wheel event.
- Confirmed repeated wheel events within one animation frame share a single scheduled `viewBox` update.
- Confirmed cursor-anchored world-point math is still applied for every wheel delta before the frame is rendered.
- Confirmed ResizeObserver invalidates the cached workspace rectangle before refreshing the view.
- Confirmed minimum/maximum zoom limits remain `0.35–3` during active play and `0.1–3` after completion.

## Next Puzzle Maker manual checks

- On a 400–600 piece puzzle, zoom continuously with a Mac trackpad and verify the view follows the gesture smoothly without falling noticeably behind.
- Repeat with a mouse wheel and confirm zoom remains appropriately slow and cursor anchored.
- Zoom all the way to both limits and confirm continued scrolling at the limit does not produce stutter or movement.
- Test zoom after resizing the browser and after entering/exiting fullscreen to confirm the pointer anchor remains correct.
- Reconfirm immediate piece dragging remains responsive after the previous performance patch.
