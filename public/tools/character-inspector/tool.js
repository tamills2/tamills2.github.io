"use strict";

(() => {
  const input = document.querySelector("#character-input");
  const grid = document.querySelector("#character-grid");
  const emptyState = document.querySelector("#empty-state");
  const inspectButton = document.querySelector("#inspect-button");
  const exampleButton = document.querySelector("#example-button");
  const clearButton = document.querySelector("#clear-button");
  const copyButton = document.querySelector("#copy-button");

  const characterCount = document.querySelector("#character-count");
  const utf16Count = document.querySelector("#utf16-count");
  const byteCount = document.querySelector("#byte-count");
  const lineCount = document.querySelector("#line-count");

  const ASCII_PUNCTUATION = {
    " ": "SPACE",
    "!": "EXCLAMATION MARK",
    "\"": "QUOTATION MARK",
    "#": "NUMBER SIGN",
    "$": "DOLLAR SIGN",
    "%": "PERCENT SIGN",
    "&": "AMPERSAND",
    "'": "APOSTROPHE",
    "(": "LEFT PARENTHESIS",
    ")": "RIGHT PARENTHESIS",
    "*": "ASTERISK",
    "+": "PLUS SIGN",
    ",": "COMMA",
    "-": "HYPHEN-MINUS",
    ".": "FULL STOP",
    "/": "SOLIDUS",
    ":": "COLON",
    ";": "SEMICOLON",
    "<": "LESS-THAN SIGN",
    "=": "EQUALS SIGN",
    ">": "GREATER-THAN SIGN",
    "?": "QUESTION MARK",
    "@": "COMMERCIAL AT",
    "[": "LEFT SQUARE BRACKET",
    "\\": "REVERSE SOLIDUS",
    "]": "RIGHT SQUARE BRACKET",
    "^": "CIRCUMFLEX ACCENT",
    "_": "LOW LINE",
    "`": "GRAVE ACCENT",
    "{": "LEFT CURLY BRACKET",
    "|": "VERTICAL LINE",
    "}": "RIGHT CURLY BRACKET",
    "~": "TILDE"
  };

  const SPECIAL_NAMES = new Map([
    ["\u0000", "NULL"],
    ["\u0008", "BACKSPACE"],
    ["\t", "CHARACTER TABULATION"],
    ["\n", "LINE FEED"],
    ["\u000b", "LINE TABULATION"],
    ["\f", "FORM FEED"],
    ["\r", "CARRIAGE RETURN"],
    ["\u001b", "ESCAPE"],
    ["\u007f", "DELETE"],
    ["\u00a0", "NO-BREAK SPACE"],
    ["\u1680", "OGHAM SPACE MARK"],
    ["\u2000", "EN QUAD"],
    ["\u2001", "EM QUAD"],
    ["\u2002", "EN SPACE"],
    ["\u2003", "EM SPACE"],
    ["\u2004", "THREE-PER-EM SPACE"],
    ["\u2005", "FOUR-PER-EM SPACE"],
    ["\u2006", "SIX-PER-EM SPACE"],
    ["\u2007", "FIGURE SPACE"],
    ["\u2008", "PUNCTUATION SPACE"],
    ["\u2009", "THIN SPACE"],
    ["\u200a", "HAIR SPACE"],
    ["\u200b", "ZERO WIDTH SPACE"],
    ["\u200c", "ZERO WIDTH NON-JOINER"],
    ["\u200d", "ZERO WIDTH JOINER"],
    ["\u2028", "LINE SEPARATOR"],
    ["\u2029", "PARAGRAPH SEPARATOR"],
    ["\u202f", "NARROW NO-BREAK SPACE"],
    ["\u205f", "MEDIUM MATHEMATICAL SPACE"],
    ["\u2060", "WORD JOINER"],
    ["\u3000", "IDEOGRAPHIC SPACE"],
    ["\ufeff", "ZERO WIDTH NO-BREAK SPACE / BYTE ORDER MARK"],
    ["\u2010", "HYPHEN"],
    ["\u2011", "NON-BREAKING HYPHEN"],
    ["\u2012", "FIGURE DASH"],
    ["\u2013", "EN DASH"],
    ["\u2014", "EM DASH"],
    ["\u2018", "LEFT SINGLE QUOTATION MARK"],
    ["\u2019", "RIGHT SINGLE QUOTATION MARK"],
    ["\u201c", "LEFT DOUBLE QUOTATION MARK"],
    ["\u201d", "RIGHT DOUBLE QUOTATION MARK"],
    ["\u2212", "MINUS SIGN"]
  ]);

  const LOOKALIKE_GROUPS = [
    ["0", "O", "o", "Ο", "О"],
    ["1", "I", "l", "|", "!", "Ⅰ"],
    ["2", "Z", "z"],
    ["5", "S", "s"],
    ["6", "G"],
    ["8", "B"],
    ["9", "g", "q"],
    ["-", "‐", "‑", "–", "—", "−"],
    ["'", "’", "‘", "`"],
    ["\"", "“", "”"]
  ];

  const encoder = new TextEncoder();

  function unicodeName(character) {
    if (SPECIAL_NAMES.has(character)) return SPECIAL_NAMES.get(character);

    const codePoint = character.codePointAt(0);

    if (codePoint >= 0x41 && codePoint <= 0x5a) {
      return `LATIN CAPITAL LETTER ${character}`;
    }

    if (codePoint >= 0x61 && codePoint <= 0x7a) {
      return `LATIN SMALL LETTER ${character.toUpperCase()}`;
    }

    if (codePoint >= 0x30 && codePoint <= 0x39) {
      const digitNames = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
      return `DIGIT ${digitNames[codePoint - 0x30]}`;
    }

    if (ASCII_PUNCTUATION[character]) return ASCII_PUNCTUATION[character];

    if (/\p{Emoji_Presentation}/u.test(character)) return "EMOJI CHARACTER";
    if (/\p{Mark}/u.test(character)) return "COMBINING MARK";
    if (/\p{Letter}/u.test(character)) return "UNICODE LETTER";
    if (/\p{Number}/u.test(character)) return "UNICODE NUMBER";
    if (/\p{Punctuation}/u.test(character)) return "UNICODE PUNCTUATION";
    if (/\p{Symbol}/u.test(character)) return "UNICODE SYMBOL";
    if (/\p{Separator}/u.test(character)) return "UNICODE SEPARATOR";
    if (/\p{Control}/u.test(character)) return "CONTROL CHARACTER";

    return "UNICODE CHARACTER";
  }

  function characterCategory(character) {
    if (/\p{Letter}/u.test(character)) return "Letter";
    if (/\p{Number}/u.test(character)) return "Number";
    if (/\p{Mark}/u.test(character)) return "Combining mark";
    if (/\p{Punctuation}/u.test(character)) return "Punctuation";
    if (/\p{Symbol}/u.test(character)) return "Symbol";
    if (/\p{Separator}/u.test(character)) return "Separator";
    if (/\p{Control}/u.test(character)) return "Control";
    return "Other";
  }

  function displayCharacter(character) {
    const labels = new Map([
      [" ", "SPACE"],
      ["\t", "TAB"],
      ["\n", "LF"],
      ["\r", "CR"],
      ["\u00a0", "NBSP"],
      ["\u200b", "ZWSP"],
      ["\u200c", "ZWNJ"],
      ["\u200d", "ZWJ"],
      ["\ufeff", "BOM"]
    ]);

    if (labels.has(character)) {
      return { text: labels.get(character), invisible: true };
    }

    if (/\p{Control}/u.test(character) || /\p{Separator}/u.test(character)) {
      return { text: `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`, invisible: true };
    }

    return { text: character, invisible: false };
  }

  function escapeRepresentation(character) {
    const escapes = new Map([
      ["\0", "\\0"],
      ["\t", "\\t"],
      ["\n", "\\n"],
      ["\r", "\\r"],
      ["\b", "\\b"],
      ["\f", "\\f"],
      ["\v", "\\v"],
      ["\\", "\\\\"],
      ["\"", "\\\""],
      ["'", "\\'"]
    ]);

    if (escapes.has(character)) return escapes.get(character);

    const codePoint = character.codePointAt(0);
    if (codePoint < 0x20 || codePoint === 0x7f || SPECIAL_NAMES.has(character) && /\s/u.test(character)) {
      return `\\u{${codePoint.toString(16).toUpperCase()}}`;
    }

    return character;
  }

  function lookalikeGroup(character) {
    return LOOKALIKE_GROUPS.find((group) => group.includes(character)) || null;
  }

  function codePointLabel(character) {
    return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  }

  function utf8Hex(character) {
    return Array.from(encoder.encode(character), byte => byte.toString(16).toUpperCase().padStart(2, "0")).join(" ");
  }

  function createMeta(label, value) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    return row;
  }

  function createTile(character, index) {
    const tile = document.createElement("article");
    const group = lookalikeGroup(character);
    tile.className = `character-tile${group ? " lookalike" : ""}`;
    tile.setAttribute("role", "listitem");

    const position = document.createElement("span");
    position.className = "tile-index";
    position.textContent = `#${index + 1}`;
    position.title = `Character position ${index + 1}`;

    const stage = document.createElement("div");
    stage.className = "glyph-stage";

    const glyphData = displayCharacter(character);
    const glyph = document.createElement("span");
    glyph.className = `glyph${glyphData.invisible ? " invisible" : ""}`;
    glyph.textContent = glyphData.text;
    glyph.setAttribute("aria-label", unicodeName(character));
    stage.append(glyph);

    const details = document.createElement("div");
    details.className = "character-details";

    const name = document.createElement("h3");
    name.className = "character-name";
    name.textContent = unicodeName(character);

    const identity = document.createElement("div");
    identity.className = "identity-code";

    const code = document.createElement("code");
    code.textContent = codePointLabel(character);

    const literal = document.createElement("code");
    literal.textContent = `"${escapeRepresentation(character)}"`;

    identity.append(code, literal);

    const meta = document.createElement("dl");
    meta.className = "character-meta";
    meta.append(
      createMeta("Category", characterCategory(character)),
      createMeta("Decimal", String(character.codePointAt(0))),
      createMeta("UTF-8", utf8Hex(character)),
      createMeta("UTF-16", Array.from({ length: character.length }, (_, i) =>
        character.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0")
      ).join(" "))
    );

    details.append(name, identity, meta);

    if (group) {
      const note = document.createElement("p");
      note.className = "lookalike-note";
      const strong = document.createElement("strong");
      strong.textContent = "Common lookalikes: ";
      note.append(strong, document.createTextNode(group.join("  ·  ")));
      details.append(note);
    }

    tile.append(position, stage, details);
    return tile;
  }

  function buildAnalysisText(characters) {
    return characters.map((character, index) => {
      return [
        `#${index + 1}`,
        `Character: "${escapeRepresentation(character)}"`,
        `Name: ${unicodeName(character)}`,
        `Code point: ${codePointLabel(character)}`,
        `Decimal: ${character.codePointAt(0)}`,
        `Category: ${characterCategory(character)}`,
        `UTF-8: ${utf8Hex(character)}`
      ].join("\n");
    }).join("\n\n");
  }

  function render() {
    const text = input.value;
    const characters = Array.from(text);

    characterCount.textContent = String(characters.length);
    utf16Count.textContent = String(text.length);
    byteCount.textContent = String(encoder.encode(text).length);
    lineCount.textContent = text ? String(text.split(/\r\n|\r|\n/).length) : "0";

    grid.replaceChildren();
    emptyState.hidden = characters.length > 0;
    grid.hidden = characters.length === 0;
    copyButton.disabled = characters.length === 0;

    const fragment = document.createDocumentFragment();
    characters.forEach((character, index) => fragment.append(createTile(character, index)));
    grid.append(fragment);
  }

  inspectButton.addEventListener("click", render);
  input.addEventListener("input", render);

  exampleButton.addEventListener("click", () => {
    input.value = "Il1 | O0o\nspace:\t end\u00A0";
    render();
    input.focus();
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    render();
    input.focus();
  });

  copyButton.addEventListener("click", async () => {
    const characters = Array.from(input.value);
    if (!characters.length) return;

    try {
      await navigator.clipboard.writeText(buildAnalysisText(characters));
      const original = copyButton.textContent;
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = original;
      }, 1400);
    } catch {
      copyButton.textContent = "Copy failed";
    }
  });

  render();
})();
