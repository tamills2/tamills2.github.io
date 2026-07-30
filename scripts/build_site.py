#!/usr/bin/env python3
"""Build all generated data used by the static Repo site."""

from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = REPOSITORY_ROOT / "public"
NOTES_ROOT = PUBLIC_ROOT / "Notes"
TOOLS_ROOT = PUBLIC_ROOT / "tools"
DATA_ROOT = PUBLIC_ROOT / "data"

NOTES_MANIFEST_FILE = DATA_ROOT / "notes-manifest.json"
TOOLS_MANIFEST_FILE = DATA_ROOT / "tools-manifest.json"
SITE_SEARCH_INDEX_FILE = DATA_ROOT / "site-search-index.json"

IGNORED_NAMES = {".DS_Store", "Thumbs.db"}
NOTE_EXTENSIONS = {
    ".txt", ".md", ".markdown", ".sh", ".bash", ".zsh", ".fish",
    ".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".json", ".yaml", ".yml", ".toml", ".ini", ".conf",
    ".html", ".css", ".sql", ".xml", ".csv", ".log",
}


class VisibleTextExtractor(HTMLParser):
    """Extract useful user-facing text and metadata from a tool page."""

    SKIP_TAGS = {"script", "style", "svg", "path", "template", "noscript"}
    TEXT_TAGS = {
        "title", "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "label", "button", "option", "li", "th", "td",
        "legend", "summary", "caption", "a",
    }
    USEFUL_ATTRIBUTES = {"placeholder", "aria-label", "title", "alt"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.capture_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in self.SKIP_TAGS:
            self.skip_depth += 1
            return

        if self.skip_depth:
            return

        if tag in self.TEXT_TAGS:
            self.capture_depth += 1

        for name, value in attrs:
            if value and name.lower() in self.USEFUL_ATTRIBUTES:
                self.parts.append(value)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in self.SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
            return

        if not self.skip_depth and tag in self.TEXT_TAGS and self.capture_depth:
            self.capture_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.skip_depth and self.capture_depth:
            cleaned = " ".join(data.split())
            if cleaned:
                self.parts.append(cleaned)

    def text(self) -> str:
        return " ".join(dict.fromkeys(part.strip() for part in self.parts if part.strip()))


def display_name(path: Path) -> str:
    return path.stem.replace("-", " ").replace("_", " ")


def build_notes_tree(directory: Path) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    if not directory.exists():
        return entries

    for path in sorted(directory.iterdir(), key=lambda p: (not p.is_dir(), p.name.casefold())):
        if path.name.startswith(".") or path.name in IGNORED_NAMES:
            continue

        if path.is_dir():
            children = build_notes_tree(path)
            if children:
                entries.append({
                    "type": "folder",
                    "name": path.name,
                    "children": children,
                })
        elif path.suffix.lower() in NOTE_EXTENSIONS:
            entries.append({
                "type": "file",
                "name": display_name(path),
                "path": path.relative_to(NOTES_ROOT).as_posix(),
            })

    return entries


def build_note_search_entries() -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    if not NOTES_ROOT.exists():
        return entries

    for path in sorted(NOTES_ROOT.rglob("*"), key=lambda p: p.as_posix().casefold()):
        if (
            not path.is_file()
            or path.name.startswith(".")
            or path.name in IGNORED_NAMES
            or path.suffix.lower() not in NOTE_EXTENSIONS
        ):
            continue

        relative_path = path.relative_to(NOTES_ROOT).as_posix()
        entries.append({
            "type": "note",
            "title": display_name(path),
            "path": relative_path,
            "url": f"note:{relative_path}",
            "keywords": [display_name(path), *path.relative_to(NOTES_ROOT).parts[:-1]],
            "content": path.read_text(encoding="utf-8", errors="replace"),
        })

    return entries


def load_tool_metadata(tool_dir: Path) -> dict[str, Any] | None:
    metadata_path = tool_dir / "tool.json"
    index_path = tool_dir / "index.html"

    if not index_path.exists():
        return None

    metadata: dict[str, Any] = {}
    if metadata_path.exists():
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

    if metadata.get("hidden"):
        return None

    parser = VisibleTextExtractor()
    parser.feed(index_path.read_text(encoding="utf-8", errors="replace"))
    visible_text = parser.text()

    title = str(metadata.get("title") or tool_dir.name.replace("-", " ").title())
    description = str(metadata.get("description") or "")
    category = str(metadata.get("category") or "Other")
    keywords = metadata.get("keywords") or []
    if isinstance(keywords, str):
        keywords = [keywords]

    return {
        "type": "tool",
        "slug": tool_dir.name,
        "title": title,
        "description": description,
        "category": category,
        "keywords": [str(item) for item in keywords],
        "homepage": bool(metadata.get("homepage", False)),
        "order": int(metadata.get("order", 100)),
        "path": f"tools/{tool_dir.name}/",
        "url": f"./tools/{tool_dir.name}/",
        "content": " ".join(part for part in [description, visible_text] if part).strip(),
    }


def build_tools_manifest() -> list[dict[str, Any]]:
    tools: list[dict[str, Any]] = []
    if not TOOLS_ROOT.exists():
        return tools

    for tool_dir in TOOLS_ROOT.iterdir():
        if not tool_dir.is_dir() or tool_dir.name.startswith("."):
            continue
        tool = load_tool_metadata(tool_dir)
        if tool:
            tools.append(tool)

    return sorted(
        tools,
        key=lambda tool: (
            tool["category"].casefold(),
            tool["order"],
            tool["title"].casefold(),
        ),
    )


def main() -> None:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    NOTES_ROOT.mkdir(parents=True, exist_ok=True)
    TOOLS_ROOT.mkdir(parents=True, exist_ok=True)

    notes_manifest = build_notes_tree(NOTES_ROOT)
    tools_manifest = build_tools_manifest()
    search_index = [
        *build_note_search_entries(),
        *tools_manifest,
    ]

    NOTES_MANIFEST_FILE.write_text(
        json.dumps(notes_manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    TOOLS_MANIFEST_FILE.write_text(
        json.dumps(tools_manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    SITE_SEARCH_INDEX_FILE.write_text(
        json.dumps(search_index, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Generated {NOTES_MANIFEST_FILE.relative_to(REPOSITORY_ROOT)}")
    print(f"Generated {TOOLS_MANIFEST_FILE.relative_to(REPOSITORY_ROOT)}")
    print(f"Generated {SITE_SEARCH_INDEX_FILE.relative_to(REPOSITORY_ROOT)}")


if __name__ == "__main__":
    main()
