NETWORK MAP
===========

Native map format
-----------------
JSON is the lossless native format. It preserves layers, nodes, interfaces,
connections, bend points, attached information blocks, containers, annotations,
custom fields, styles, and canvas settings.

Autosave
--------
The current map is saved in browser local storage. Use JSON export for portable
backups and for moving maps between computers.

Exports
-------
JSON    Lossless Repo Network Map file.
PNG     Raster image of the visible map contents.
PDF     Opens a print-ready map in a new tab; choose Save as PDF.
draw.io Basic diagrams.net XML export. Native Repo data is embedded so a file
        exported here can be re-imported without losing custom fields.

Imports
-------
JSON    Full native import.
draw.io Files exported by this tool restore the embedded native map. Other
        draw.io files import basic vertices, labels, connectors, arrows, and
        bend points; unknown shapes become generic devices.

Shortcuts
---------
V               Select mode
H               Pan mode
C               Connect mode
Escape          Return to Select / clear selection
Delete          Delete selected items
Ctrl/Cmd+Z      Undo
Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y  Redo
Ctrl/Cmd+C      Copy selection
Ctrl/Cmd+V      Paste selection
Ctrl/Cmd+D      Duplicate selection
Arrow keys      Move selection
Shift+Arrows    Move selection faster

Connection bends
----------------
Double-click a connection to add a bend point. Select the connection and drag
its circular bend handles. Select a bend handle and use the inspector or delete
and redraw the connection if a point is no longer needed.
