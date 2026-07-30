#!/usr/bin/env python3
"""Generate the static notes directory manifest consumed by the browser."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
NOTES_ROOT = REPOSITORY_ROOT / "public" / "Notes"
OUTPUT_FILE = REPOSITORY_ROOT / "public" / "data" / "notes-manifest.json"

IGNORED_NAMES = {".DS_Store", ".gitkeep"}
ALLOWED_EXTENSIONS = {".txt", ".sh", ".bash"}


def display_name(path: Path) -> str:
    """Return a filename without its final extension."""
    return path.stem


def build_tree(directory: Path) -> list[dict[str, Any]]:
    """Recursively build a directory-first, alphabetically sorted tree."""
    nodes: list[dict[str, Any]] = []

    if not directory.exists():
        return nodes

    entries = sorted(
        (
            path
            for path in directory.iterdir()
            if path.name not in IGNORED_NAMES and not path.name.startswith(".")
        ),
        key=lambda path: (not path.is_dir(), path.name.casefold()),
    )

    for path in entries:
        if path.is_dir():
            nodes.append(
                {
                    "type": "directory",
                    "name": path.name,
                    "children": build_tree(path),
                }
            )
            continue

        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue

        nodes.append(
            {
                "type": "file",
                "name": display_name(path),
                "path": path.relative_to(NOTES_ROOT).as_posix(),
            }
        )

    return nodes


def main() -> None:
    NOTES_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    manifest = build_tree(NOTES_ROOT)
    OUTPUT_FILE.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Generated {OUTPUT_FILE.relative_to(REPOSITORY_ROOT)}")


if __name__ == "__main__":
    main()
