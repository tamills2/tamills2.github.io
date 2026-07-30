#!/usr/bin/env python3
"""Generate the static notes directory manifest consumed by the browser."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
NOTES_ROOT = REPOSITORY_ROOT / "public" / "Notes"
OUTPUT_FILE = REPOSITORY_ROOT / "public" / "data" / "notes-manifest.json"
SEARCH_INDEX_FILE = REPOSITORY_ROOT / "public" / "data" / "site-search-index.json"

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


def build_search_index(directory: Path) -> list[dict[str, object]]:
    """Create the note portion of the site-wide search index."""
    entries: list[dict[str, str]] = []

    if not directory.exists():
        return entries

    for path in sorted(directory.rglob("*"), key=lambda item: item.as_posix().casefold()):
        if (
            not path.is_file()
            or path.name in IGNORED_NAMES
            or path.name.startswith(".")
            or path.suffix.lower() not in ALLOWED_EXTENSIONS
        ):
            continue

        relative_path = path.relative_to(NOTES_ROOT).as_posix()
        entries.append(
            {
                "type": "note",
                "title": display_name(path),
                "path": relative_path,
                "url": f"note:{relative_path}",
                "keywords": [display_name(path), *path.relative_to(NOTES_ROOT).parts[:-1]],
                "content": path.read_text(encoding="utf-8", errors="replace"),
            }
        )

    return entries


def main() -> None:
    NOTES_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    manifest = build_tree(NOTES_ROOT)
    search_index = build_search_index(NOTES_ROOT)

    OUTPUT_FILE.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    SEARCH_INDEX_FILE.write_text(
        json.dumps(search_index, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Generated {OUTPUT_FILE.relative_to(REPOSITORY_ROOT)}")
    print(f"Generated {SEARCH_INDEX_FILE.relative_to(REPOSITORY_ROOT)}")


if __name__ == "__main__":
    main()
