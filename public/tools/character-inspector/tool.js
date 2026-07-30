"use strict";

(() => {
  const input = document.querySelector("#character-input");
  const grid = document.querySelector("#character-grid");
  const emptyState = document.querySelector("#empty-state");
  const clearButton = document.querySelector("#clear-button");
  const characterCount = document.querySelector("#character-count");

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
    ["\t", "CHARACTER TABULATION"],
    ["\n", "LINE FEED"],
    ["\r", "CARRIAGE RETURN"],
    ["\u00a0", "NO-BREAK SPACE"],
    ["\u200b", "ZERO WIDTH SPACE"],
    ["\u200c", "ZERO WIDTH NON-JOINER"],
    ["\u200d", "ZERO WIDTH JOINER"],
    ["\u2028", "LINE SEPARATOR"],
    ["\u2029", "PARAGRAPH SEPARATOR"],
    ["\u202f", "NARROW NO-BREAK SPACE"],
    ["\u2060", "WORD JOINER"],
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
      const names = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
      return `DIGIT ${names[codePoint - 0x30]}`;
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

  function codePointLabel(character) {
    return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  }

  function displayCharacter(character) {
    const labels = new Map([
      [" ", "SP"],
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
      return { text: codePointLabel(character), invisible: true };
    }

    return { text: character, invisible: false };
  }


  function positionTooltip(box) {
    const tooltip = box.querySelector(".character-tooltip");
    if (!tooltip) return;

    const viewportPadding = 12;

    box.style.setProperty("--tooltip-left", "50%");
    box.style.setProperty("--tooltip-shift-x", "-50%");
    box.style.setProperty("--tooltip-arrow-left", "50%");

    const boxRect = box.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const centeredLeft = boxRect.left + (boxRect.width / 2) - (tooltipRect.width / 2);
    const centeredRight = centeredLeft + tooltipRect.width;

    if (centeredLeft < viewportPadding) {
      const leftOffset = viewportPadding - boxRect.left;
      const arrowCenter = (boxRect.width / 2) - leftOffset;

      box.style.setProperty("--tooltip-left", `${leftOffset}px`);
      box.style.setProperty("--tooltip-shift-x", "0");
      box.style.setProperty(
        "--tooltip-arrow-left",
        `${Math.max(10, Math.min(tooltipRect.width - 10, arrowCenter))}px`
      );
      return;
    }

    if (centeredRight > window.innerWidth - viewportPadding) {
      const rightEdge = window.innerWidth - viewportPadding;
      const tooltipLeft = rightEdge - tooltipRect.width;
      const leftOffset = tooltipLeft - boxRect.left;
      const arrowCenter = (boxRect.width / 2) - leftOffset;

      box.style.setProperty("--tooltip-left", `${leftOffset}px`);
      box.style.setProperty("--tooltip-shift-x", "0");
      box.style.setProperty(
        "--tooltip-arrow-left",
        `${Math.max(10, Math.min(tooltipRect.width - 10, arrowCenter))}px`
      );
    }
  }

  function createCharacterBox(character, index) {
    const display = displayCharacter(character);
    const name = unicodeName(character);
    const codePoint = codePointLabel(character);

    const box = document.createElement("div");
    box.className = `character-box${display.invisible ? " invisible-character" : ""}`;
    box.setAttribute("role", "listitem");
    box.tabIndex = 0;
    box.setAttribute("aria-label", `${name}, character ${index + 1}, ${codePoint}`);

    const glyph = document.createTextNode(display.text);

    const tooltip = document.createElement("div");
    tooltip.className = "character-tooltip";
    tooltip.setAttribute("role", "tooltip");

    const tooltipName = document.createElement("strong");
    tooltipName.className = "tooltip-name";
    tooltipName.textContent = name;

    const details = document.createElement("span");
    details.className = "tooltip-details";

    const characterLine = document.createElement("span");
    characterLine.textContent = `Character: ${JSON.stringify(character)}`;

    const positionLine = document.createElement("span");
    positionLine.textContent = `Position: ${index + 1}`;

    const codePointLine = document.createElement("span");
    codePointLine.textContent = `Unicode: ${codePoint}`;

    const decimalLine = document.createElement("span");
    decimalLine.textContent = `Decimal: ${character.codePointAt(0)}`;

    details.append(characterLine, positionLine, codePointLine, decimalLine);
    tooltip.append(tooltipName, details);
    box.append(glyph, tooltip);

    box.addEventListener("mouseenter", () => positionTooltip(box));
    box.addEventListener("focus", () => positionTooltip(box));

    return box;
  }

  function render() {
    const characters = Array.from(input.value);
    grid.replaceChildren();

    characterCount.textContent = `${characters.length} ${characters.length === 1 ? "character" : "characters"}`;
    emptyState.hidden = characters.length > 0;
    grid.hidden = characters.length === 0;

    const fragment = document.createDocumentFragment();

    characters.forEach((character, index) => {
      fragment.append(createCharacterBox(character, index));
    });

    grid.append(fragment);
  }

  input.addEventListener("input", render);

  clearButton.addEventListener("click", () => {
    input.value = "";
    render();
    input.focus();
  });

  render();
})();
