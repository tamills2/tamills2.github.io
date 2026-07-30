"use strict";

const examplesInput = document.querySelector("#examples-input");
const testInput = document.querySelector("#test-input");
const regexOutput = document.querySelector("#regex-output");
const resultPanel = document.querySelector("#result-panel");
const resultSummary = document.querySelector("#result-summary");
const copyStatus = document.querySelector("#copy-status");
const matchCount = document.querySelector("#match-count");
const testResults = document.querySelector("#test-results");
const anchorOption = document.querySelector("#anchor-option");
const caseOption = document.querySelector("#case-option");

let currentPatterns = [];
let currentFlags = "";

const PRESETS = [
  {
    name: "IPv4 address",
    description: "Validates four decimal octets from 0 through 255.",
    pattern: "^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$",
    flags: "",
  },
  {
    name: "Email address",
    description: "Practical general-purpose email format.",
    pattern: "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
    flags: "i",
  },
  {
    name: "US phone number",
    description: "Optional country code, area code, spaces, dots, or hyphens.",
    pattern: "^(?:\\+?1[ .-]?)?(?:\\(?\\d{3}\\)?[ .-]?)\\d{3}[ .-]?\\d{4}$",
    flags: "",
  },
  {
    name: "URL",
    description: "HTTP or HTTPS URL with an optional path.",
    pattern: "^https?:\\/\\/(?:www\\.)?[^\\s/$.?#].[^\\s]*$",
    flags: "i",
  },
  {
    name: "UUID",
    description: "Canonical UUID versions 1 through 5.",
    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    flags: "i",
  },
  {
    name: "ISO date",
    description: "YYYY-MM-DD formatting.",
    pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$",
    flags: "",
  },
  {
    name: "24-hour time",
    description: "HH:MM with an optional seconds component.",
    pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$",
    flags: "",
  },
  {
    name: "Hex colour",
    description: "Three-, six-, or eight-digit hexadecimal colour.",
    pattern: "^#?(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$",
    flags: "i",
  },
];

function characterType(character) {
  if (/\d/.test(character)) return "digit";
  if (/[a-z]/.test(character)) return "lower";
  if (/[A-Z]/.test(character)) return "upper";
  if (/\s/.test(character)) return "space";
  return "literal";
}

function tokenise(value) {
  const tokens = [];

  for (const character of value) {
    const type = characterType(character);
    const previous = tokens.at(-1);

    if (type !== "literal" && previous?.type === type) {
      previous.value += character;
      continue;
    }

    if (type === "literal" && previous?.type === "literal") {
      previous.value += character;
      continue;
    }

    tokens.push({ type, value: character });
  }

  return tokens;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function quantifier(minimum, maximum = minimum) {
  if (minimum === 1 && maximum === 1) return "";
  if (minimum === maximum) return `{${minimum}}`;
  return `{${minimum},${maximum}}`;
}

function tokenPattern(token) {
  const length = token.value.length;

  switch (token.type) {
    case "digit":
      return `\\d${quantifier(length)}`;
    case "lower":
      return `[a-z]${quantifier(length)}`;
    case "upper":
      return `[A-Z]${quantifier(length)}`;
    case "space":
      return `\\s${quantifier(length)}`;
    default:
      return escapeRegex(token.value);
  }
}

function patternForLine(value) {
  return tokenise(value).map(tokenPattern).join("");
}

function compatibleTokenSets(tokenSets) {
  if (!tokenSets.length) return false;
  const length = tokenSets[0].length;

  return tokenSets.every((tokens) =>
    tokens.length === length &&
    tokens.every((token, index) => {
      const base = tokenSets[0][index];
      return token.type === base.type &&
        (token.type !== "literal" || token.value === base.value);
    })
  );
}

function generaliseLines(lines) {
  const tokenSets = lines.map(tokenise);

  if (!compatibleTokenSets(tokenSets)) {
    const alternatives = [...new Set(lines.map(patternForLine))];
    return alternatives.length === 1
      ? alternatives[0]
      : `(?:${alternatives.join("|")})`;
  }

  return tokenSets[0].map((baseToken, tokenIndex) => {
    if (baseToken.type === "literal") {
      return escapeRegex(baseToken.value);
    }

    const lengths = tokenSets.map((tokens) => tokens[tokenIndex].value.length);
    const minimum = Math.min(...lengths);
    const maximum = Math.max(...lengths);
    const classes = {
      digit: "\\d",
      lower: "[a-z]",
      upper: "[A-Z]",
      space: "\\s",
    };

    return `${classes[baseToken.type]}${quantifier(minimum, maximum)}`;
  }).join("");
}

function applyAnchors(pattern) {
  return anchorOption.checked ? `^${pattern}$` : pattern;
}

function generateRegex() {
  const lines = examplesInput.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    showMessage("Enter at least one non-empty example line.");
    examplesInput.focus();
    return;
  }

  const mode = document.querySelector('input[name="generation-mode"]:checked').value;
  currentFlags = caseOption.checked ? "i" : "";

  if (mode === "per-line") {
    currentPatterns = lines.map((line) => applyAnchors(patternForLine(line)));
    showPatterns(currentPatterns, currentFlags, `${currentPatterns.length} separate regex${currentPatterns.length === 1 ? "" : "es"}.`);
  } else {
    currentPatterns = [applyAnchors(generaliseLines(lines))];
    showPatterns(currentPatterns, currentFlags, `One regex generated from ${lines.length} example${lines.length === 1 ? "" : "s"}.`);
  }

  updateTests();
}

function showPatterns(patterns, flags, summary) {
  const suffix = flags ? `/${flags}` : "/";
  regexOutput.textContent = patterns.map((pattern) => `/${pattern}${suffix}`).join("\n");
  resultSummary.textContent = summary;
  resultPanel.hidden = false;
  copyStatus.textContent = "";
}

function showMessage(message) {
  currentPatterns = [];
  currentFlags = "";
  regexOutput.textContent = message;
  resultSummary.textContent = "Nothing generated yet.";
  resultPanel.hidden = false;
  updateTests();
}

function selectPreset(preset) {
  currentPatterns = [preset.pattern];
  currentFlags = preset.flags;
  showPatterns(currentPatterns, currentFlags, `${preset.name} preset.`);
  updateTests();
  resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderPresets() {
  const container = document.querySelector("#preset-list");

  for (const preset of PRESETS) {
    const button = document.createElement("button");
    button.className = "preset-button";
    button.type = "button";

    const title = document.createElement("strong");
    title.textContent = preset.name;

    const description = document.createElement("small");
    description.textContent = preset.description;

    const marker = document.createElement("code");
    marker.textContent = "/…/";

    button.append(title, description, marker);
    button.addEventListener("click", () => selectPreset(preset));
    container.append(button);
  }
}

async function copyRegex() {
  if (!currentPatterns.length) return;

  const suffix = currentFlags ? `/${currentFlags}` : "/";
  const value = currentPatterns.map((pattern) => `/${pattern}${suffix}`).join("\n");

  try {
    await navigator.clipboard.writeText(value);
    copyStatus.textContent = "Copied to clipboard.";
  } catch {
    copyStatus.textContent = "Clipboard access was unavailable. Select the regex and copy it manually.";
  }
}

function updateTests() {
  const lines = testInput.value.split(/\r?\n/).filter((line) => line.length > 0);
  testResults.replaceChildren();

  if (!currentPatterns.length || !lines.length) {
    matchCount.textContent = "0 matches";
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = currentPatterns.length
      ? "Enter test values to check the current regex."
      : "Generate or select a regex first.";
    testResults.append(empty);
    return;
  }

  const regexes = currentPatterns.map((pattern) => {
    try {
      return new RegExp(pattern, currentFlags);
    } catch {
      return null;
    }
  });

  let matches = 0;

  lines.forEach((line, index) => {
    const regex = regexes[Math.min(index, regexes.length - 1)];
    const matched = regex ? regex.test(line) : false;
    if (matched) matches += 1;

    const row = document.createElement("div");
    row.className = `test-result${matched ? " is-match" : ""}`;

    const status = document.createElement("strong");
    status.textContent = matched ? "MATCH" : "NO MATCH";

    const value = document.createElement("code");
    value.textContent = line;

    row.append(status, value);
    testResults.append(row);
  });

  matchCount.textContent = `${matches} match${matches === 1 ? "" : "es"}`;
}

function clearTool() {
  examplesInput.value = "";
  testInput.value = "";
  currentPatterns = [];
  currentFlags = "";
  resultPanel.hidden = true;
  copyStatus.textContent = "";
  updateTests();
  examplesInput.focus();
}

document.querySelector("#generate-button").addEventListener("click", generateRegex);
document.querySelector("#clear-button").addEventListener("click", clearTool);
document.querySelector("#copy-button").addEventListener("click", copyRegex);
document.querySelector("#load-example").addEventListener("click", () => {
  examplesInput.value = "12345\n67890\n24680";
  testInput.value = "54321\n1234\nabcde";
  generateRegex();
});

testInput.addEventListener("input", updateTests);
examplesInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    generateRegex();
  }
});

renderPresets();
updateTests();
