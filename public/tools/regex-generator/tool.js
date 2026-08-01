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
      : "Generate a regex first.";
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

updateTests();


const explainInput = document.querySelector("#explain-input");
const explainerStatus = document.querySelector("#explainer-status");
const explainerResults = document.querySelector("#explainer-results");
const tokenList = document.querySelector("#token-list");
const exampleMatchList = document.querySelector("#example-match-list");

const TOKEN_DESCRIPTIONS = {
  "^": "Start of string",
  "$": "End of string",
  ".": "Any character except a line break",
  "\\d": "Digit from 0 through 9",
  "\\D": "Any character that is not a digit",
  "\\w": "Letter, digit, or underscore",
  "\\W": "Any character that is not a word character",
  "\\s": "Whitespace character",
  "\\S": "Any character that is not whitespace",
  "\\b": "Word boundary",
  "\\B": "Position that is not a word boundary",
  "|": "Alternation; matches the expression on either side",
  "*": "Zero or more of the preceding item",
  "+": "One or more of the preceding item",
  "?": "Zero or one of the preceding item",
};

function readCharacterClass(pattern, start) {
  let index = start + 1;
  let escaped = false;
  while (index < pattern.length) {
    const character = pattern[index];
    if (!escaped && character === "]") return index + 1;
    if (!escaped && character === "\\") escaped = true;
    else escaped = false;
    index += 1;
  }
  return pattern.length;
}

function readQuantifier(pattern, start) {
  const end = pattern.indexOf("}", start + 1);
  return end === -1 ? start + 1 : end + 1;
}

function describeGroupPrefix(token) {
  if (token === "(") return "Start of capturing group";
  if (token === "(?:") return "Start of non-capturing group";
  if (token === "(?=") return "Start of positive lookahead";
  if (token === "(?!") return "Start of negative lookahead";
  if (token === "(?<=") return "Start of positive lookbehind";
  if (token === "(?<!") return "Start of negative lookbehind";
  if (token.startsWith("(?<") && token.endsWith(">")) {
    return `Start of named capturing group “${token.slice(3, -1)}”`;
  }
  return "Start of group";
}

function tokeniseRegex(pattern) {
  const tokens = [];
  let index = 0;
  let groupNumber = 0;

  while (index < pattern.length) {
    const character = pattern[index];

    if (character === "\\") {
      const token = pattern.slice(index, Math.min(index + 2, pattern.length));
      let description = TOKEN_DESCRIPTIONS[token] || `Escaped literal ${token.slice(1) || "backslash"}`;
      if (/^\\[1-9]$/.test(token)) description = `Backreference to capturing group ${token.slice(1)}`;
      tokens.push({ token, description });
      index += token.length;
      continue;
    }

    if (character === "[") {
      const end = readCharacterClass(pattern, index);
      const token = pattern.slice(index, end);
      const negated = token.startsWith("[^");
      tokens.push({ token, description: negated ? "Negated character class" : "Character class; matches one listed character" });
      index = end;
      continue;
    }

    if (character === "{") {
      const end = readQuantifier(pattern, index);
      const token = pattern.slice(index, end);
      const inner = token.slice(1, -1);
      let description = "Repetition quantifier";
      if (/^\d+$/.test(inner)) description = `Exactly ${inner} repetitions of the preceding item`;
      else if (/^\d+,$/.test(inner)) description = `At least ${inner.slice(0, -1)} repetitions of the preceding item`;
      else if (/^\d+,\d+$/.test(inner)) {
        const [minimum, maximum] = inner.split(",");
        description = `Between ${minimum} and ${maximum} repetitions of the preceding item`;
      }
      tokens.push({ token, description });
      index = end;
      continue;
    }

    if (character === "(") {
      let token = "(";
      if (pattern.startsWith("(?:", index) || pattern.startsWith("(?=", index) || pattern.startsWith("(?!", index)) {
        token = pattern.slice(index, index + 3);
      } else if (pattern.startsWith("(?<=", index) || pattern.startsWith("(?<!", index)) {
        token = pattern.slice(index, index + 4);
      } else if (pattern.startsWith("(?<", index)) {
        const close = pattern.indexOf(">", index + 3);
        if (close !== -1) token = pattern.slice(index, close + 1);
      }
      const capturing = token === "(" || (token.startsWith("(?<") && !token.startsWith("(?<=") && !token.startsWith("(?<!"));
      if (capturing) groupNumber += 1;
      const description = capturing ? `${describeGroupPrefix(token)} (group ${groupNumber})` : describeGroupPrefix(token);
      tokens.push({ token, description });
      index += token.length;
      continue;
    }

    if (character === ")") {
      tokens.push({ token: character, description: "End of group" });
      index += 1;
      continue;
    }

    if (TOKEN_DESCRIPTIONS[character]) {
      tokens.push({ token: character, description: TOKEN_DESCRIPTIONS[character] });
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < pattern.length && !"\\[]{}()^$.*+?|".includes(pattern[end])) end += 1;
    const token = pattern.slice(index, end);
    tokens.push({ token, description: `Literal text “${token}”` });
    index = end;
  }

  return tokens;
}

function sampleForClass(token) {
  if (token.startsWith("[^")) return "x";
  const body = token.slice(1, -1);
  if (body.includes("A-Z")) return "A";
  if (body.includes("a-z")) return "a";
  if (body.includes("0-9") || body.includes("\\d")) return "0";
  const cleaned = body.replace(/^\^/, "").replace(/\\(.)/g, "$1");
  return cleaned[0] || "x";
}

function parseQuantifierAt(pattern, index) {
  if (pattern[index] === "*") return { count: 1, end: index + 1 };
  if (pattern[index] === "+") return { count: 2, end: index + 1 };
  if (pattern[index] === "?") return { count: 0, end: index + 1 };
  if (pattern[index] === "{") {
    const end = pattern.indexOf("}", index + 1);
    if (end !== -1) {
      const first = pattern.slice(index + 1, end).split(",")[0];
      return { count: Math.min(Number(first) || 1, 12), end: end + 1 };
    }
  }
  return { count: 1, end: index };
}

function generateSimpleSample(pattern, alternate = false) {
  let output = "";
  let index = 0;
  while (index < pattern.length) {
    const character = pattern[index];
    if (character === "^" || character === "$") { index += 1; continue; }
    if (character === "\\") {
      const code = pattern[index + 1] || "";
      const base = ({ d: alternate ? "7" : "0", w: alternate ? "Z" : "a", s: " " })[code] ?? code;
      const quantifier = parseQuantifierAt(pattern, index + 2);
      output += base.repeat(quantifier.count);
      index = quantifier.end === index + 2 ? index + 2 : quantifier.end;
      continue;
    }
    if (character === "[") {
      const end = readCharacterClass(pattern, index);
      const base = sampleForClass(pattern.slice(index, end));
      const quantifier = parseQuantifierAt(pattern, end);
      output += base.repeat(quantifier.count);
      index = quantifier.end === end ? end : quantifier.end;
      continue;
    }
    if (character === ".") {
      const quantifier = parseQuantifierAt(pattern, index + 1);
      output += (alternate ? "b" : "x").repeat(quantifier.count);
      index = quantifier.end === index + 1 ? index + 1 : quantifier.end;
      continue;
    }
    if (character === "(") {
      if (pattern.startsWith("(?:", index)) index += 3;
      else if (pattern.startsWith("(?=", index) || pattern.startsWith("(?!", index)) { index += 3; continue; }
      else if (pattern.startsWith("(?<=", index) || pattern.startsWith("(?<!", index)) { index += 4; continue; }
      else if (pattern.startsWith("(?<", index)) {
        const close = pattern.indexOf(">", index + 3);
        index = close === -1 ? index + 1 : close + 1;
      } else index += 1;
      continue;
    }
    if (character === ")") { index += 1; continue; }
    if (character === "|") {
      while (index < pattern.length && pattern[index] !== ")" && pattern[index] !== "$") index += 1;
      continue;
    }
    if ("*+?{}".includes(character)) { index += 1; continue; }
    const quantifier = parseQuantifierAt(pattern, index + 1);
    output += character.repeat(quantifier.count);
    index = quantifier.end === index + 1 ? index + 1 : quantifier.end;
  }
  return output;
}

function candidateExamples(pattern, flags) {
  const candidates = [];
  for (const alternate of [false, true]) {
    const value = generateSimpleSample(pattern, alternate);
    if (value && !candidates.includes(value)) candidates.push(value);
  }
  const bank = [
    "test", "hello", "abc", "ABC", "123", "12345", "A123", "user@example.com",
    "https://example.com", "http://www.example.com/path", "192.168.1.1", "2026-08-01",
    "foo-bar", "name_01", "/index.html", "example.com"
  ];
  let regex;
  try { regex = new RegExp(pattern, flags.replace(/[gy]/g, "")); }
  catch { return []; }
  for (const value of [...candidates, ...bank]) {
    regex.lastIndex = 0;
    if (regex.test(value) && !candidates.includes(value)) candidates.push(value);
    if (candidates.length >= 3) break;
  }
  return candidates.filter((value) => {
    regex.lastIndex = 0;
    return regex.test(value);
  }).slice(0, 3);
}

function renderExplanation() {
  let pattern = explainInput.value.trim();
  const slashMatch = pattern.match(/^\/(.*)\/([dgimsuvy]*)$/);
  let flags = "";
  if (slashMatch) {
    pattern = slashMatch[1];
    flags = [...new Set(slashMatch[2].split(""))].join("");
  }
  tokenList.replaceChildren();
  exampleMatchList.replaceChildren();
  explainerStatus.textContent = "";

  if (!pattern) {
    explainerResults.hidden = true;
    explainerStatus.textContent = "Enter a regular expression.";
    explainInput.focus();
    return;
  }

  try { new RegExp(pattern, flags); }
  catch (error) {
    explainerResults.hidden = true;
    explainerStatus.textContent = error.message;
    return;
  }

  tokeniseRegex(pattern).forEach(({ token, description }) => {
    const row = document.createElement("div");
    row.className = "token-row";
    const code = document.createElement("code");
    code.textContent = token;
    const text = document.createElement("span");
    text.textContent = description;
    row.append(code, text);
    tokenList.append(row);
  });

  const examples = candidateExamples(pattern, flags);
  if (!examples.length) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "No reliable sample could be generated for this expression.";
    exampleMatchList.append(empty);
  } else {
    examples.forEach((example) => {
      const row = document.createElement("div");
      row.className = "example-match";
      const mark = document.createElement("strong");
      mark.textContent = "MATCH";
      const code = document.createElement("code");
      code.textContent = example;
      row.append(mark, code);
      exampleMatchList.append(row);
    });
  }

  explainerResults.hidden = false;
}

document.querySelector("#explain-button").addEventListener("click", renderExplanation);
document.querySelector("#explain-clear").addEventListener("click", () => {
  explainInput.value = "";
  explainerStatus.textContent = "";
  explainerResults.hidden = true;
  tokenList.replaceChildren();
  exampleMatchList.replaceChildren();
  explainInput.focus();
});
explainInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    renderExplanation();
  }
});
