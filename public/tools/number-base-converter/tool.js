"use strict";

(() => {
  const modeSelect = document.querySelector("#mode-select");
  const widthSelect = document.querySelector("#bit-width-select");
  const widthField = document.querySelector("#bit-width-field");
  const rangeNote = document.querySelector("#range-note");
  const clearButton = document.querySelector("#clear-button");

  const fields = [
    { id: "binary-input", error: "binary-error", base: 2, pattern: true },
    { id: "octal-input", error: "octal-error", base: 8, pattern: true },
    { id: "decimal-input", error: "decimal-error", base: 10, decimal: true },
    { id: "hex-input", error: "hex-error", base: 16, pattern: true },
    { id: "base36-input", error: "base36-error", base: 36 }
  ];

  const customBaseInput = document.querySelector("#custom-base-input");
  const customValueInput = document.querySelector("#custom-value-input");
  const customError = document.querySelector("#custom-error");
  const summary = document.querySelector("#summary-card");
  const signedOutput = document.querySelector("#signed-value");
  const unsignedOutput = document.querySelector("#unsigned-value");
  const effectiveWidthOutput = document.querySelector("#effective-width");

  let currentValue = null;
  let currentWidth = 8;
  let updating = false;

  const normalize = value => value.trim().replace(/[\s_]/g, "").toUpperCase();

  function digitValue(char) {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) return code - 48;
    if (code >= 65 && code <= 90) return code - 55;
    return -1;
  }

  function parseMagnitude(raw, base) {
    const value = normalize(raw);
    if (!value) return { empty: true };

    let sign = 1n;
    let digits = value;
    if (digits.startsWith("-")) {
      sign = -1n;
      digits = digits.slice(1);
    } else if (digits.startsWith("+")) {
      digits = digits.slice(1);
    }

    if (!digits) return { error: "Enter at least one digit." };

    let result = 0n;
    const bigBase = BigInt(base);
    for (const char of digits) {
      const digit = digitValue(char);
      if (digit < 0 || digit >= base) {
        return { error: `"${char}" is not valid in base ${base}.` };
      }
      result = result * bigBase + BigInt(digit);
    }
    return { value: result * sign, digits };
  }

  function nextStandardWidth(bits) {
    if (bits <= 8) return 8;
    if (bits <= 16) return 16;
    if (bits <= 32) return 32;
    return 64;
  }

  function inferredWidth(field, raw, parsedValue) {
    if (widthSelect.value !== "auto") return Number(widthSelect.value);

    const clean = normalize(raw).replace(/^[+-]/, "");

    if (field.pattern) {
      if (field.base === 2) return nextStandardWidth(Math.max(1, clean.length));
      if (field.base === 8) return nextStandardWidth(Math.max(1, clean.length * 3));
      if (field.base === 16) return nextStandardWidth(Math.max(1, clean.length * 4));
    }

    const value = parsedValue;
    for (const bits of [8, 16, 32, 64]) {
      const min = -(1n << BigInt(bits - 1));
      const max = (1n << BigInt(bits - 1)) - 1n;
      if (value >= min && value <= max) return bits;
    }
    return 64;
  }

  const modulus = bits => 1n << BigInt(bits);
  const signedMin = bits => -(1n << BigInt(bits - 1));
  const signedMax = bits => (1n << BigInt(bits - 1)) - 1n;
  const unsignedMax = bits => modulus(bits) - 1n;
  const toUnsigned = (value, bits) => value < 0n ? modulus(bits) + value : value;
  const toSigned = (value, bits) => {
    const signBit = 1n << BigInt(bits - 1);
    return (value & signBit) !== 0n ? value - modulus(bits) : value;
  };

  function parseField(raw, field) {
    const parsed = parseMagnitude(raw, field.base);
    if (parsed.empty || parsed.error) return parsed;

    const bits = inferredWidth(field, raw, parsed.value);

    if (modeSelect.value === "unsigned") {
      if (parsed.value < 0n) return { error: "Unsigned mode does not allow negative values." };
      return { value: parsed.value, bits };
    }

    if (field.pattern && parsed.value >= 0n) {
      if (parsed.value > unsignedMax(bits)) {
        return { error: `Bit pattern exceeds ${bits} bits.` };
      }
      return { value: toSigned(parsed.value, bits), bits };
    }

    if (parsed.value < signedMin(bits) || parsed.value > signedMax(bits)) {
      return { error: `Value must fit in signed ${bits}-bit range.` };
    }

    return { value: parsed.value, bits };
  }

  function formatPattern(value, base, bits) {
    let text = toUnsigned(value, bits).toString(base).toUpperCase();
    if (base === 2) text = text.padStart(bits, "0");
    if (base === 8) text = text.padStart(Math.ceil(bits / 3), "0");
    if (base === 16) text = text.padStart(Math.ceil(bits / 4), "0");
    return text;
  }

  function formatField(value, field, bits) {
    if (modeSelect.value === "signed" && field.pattern) {
      return formatPattern(value, field.base, bits);
    }
    return value.toString(field.base).toUpperCase();
  }

  function clearErrors() {
    fields.forEach(field => document.querySelector(`#${field.error}`).textContent = "");
    customError.textContent = "";
  }

  function clearOthers(except = "") {
    updating = true;
    fields.forEach(field => {
      if (field.id !== except) document.querySelector(`#${field.id}`).value = "";
    });
    if (except !== "custom-value-input") customValueInput.value = "";
    updating = false;
    currentValue = null;
    summary.hidden = true;
  }

  function writeAll(value, bits, source = "") {
    updating = true;
    fields.forEach(field => {
      if (field.id !== source) {
        document.querySelector(`#${field.id}`).value = formatField(value, field, bits);
      }
    });

    if (source !== "custom-value-input") {
      customValueInput.value = value.toString(Number(customBaseInput.value)).toUpperCase();
    }

    updating = false;
    currentValue = value;
    currentWidth = bits;

    signedOutput.textContent = value.toString(10);
    unsignedOutput.textContent =
      modeSelect.value === "signed" ? toUnsigned(value, bits).toString(10) : value.toString(10);
    effectiveWidthOutput.textContent = modeSelect.value === "signed" ? `${bits}-bit` : "Magnitude";
    summary.hidden = false;
  }

  function handleField(field) {
    if (updating) return;
    clearErrors();

    const input = document.querySelector(`#${field.id}`);
    const parsed = parseField(input.value, field);

    if (parsed.empty) {
      clearOthers(field.id);
      return;
    }

    if (parsed.error) {
      document.querySelector(`#${field.error}`).textContent = parsed.error;
      clearOthers(field.id);
      return;
    }

    writeAll(parsed.value, parsed.bits, field.id);
  }

  function handleCustom() {
    if (updating) return;
    clearErrors();

    const base = Number(customBaseInput.value);
    if (!Number.isInteger(base) || base < 2 || base > 36) {
      customError.textContent = "Custom base must be between 2 and 36.";
      clearOthers("custom-value-input");
      return;
    }

    const parsed = parseMagnitude(customValueInput.value, base);
    if (parsed.empty) {
      clearOthers("custom-value-input");
      return;
    }
    if (parsed.error) {
      customError.textContent = parsed.error;
      clearOthers("custom-value-input");
      return;
    }

    const bits = widthSelect.value === "auto"
      ? inferredWidth({ pattern: false }, customValueInput.value, parsed.value)
      : Number(widthSelect.value);

    if (modeSelect.value === "signed" &&
        (parsed.value < signedMin(bits) || parsed.value > signedMax(bits))) {
      customError.textContent = `Value must fit in signed ${bits}-bit range.`;
      clearOthers("custom-value-input");
      return;
    }

    if (modeSelect.value === "unsigned" && parsed.value < 0n) {
      customError.textContent = "Unsigned mode does not allow negative values.";
      clearOthers("custom-value-input");
      return;
    }

    writeAll(parsed.value, bits, "custom-value-input");
  }

  function updateRangeNote() {
    if (modeSelect.value === "unsigned") {
      widthField.hidden = true;
      rangeNote.textContent = "Unsigned mode uses ordinary positive magnitude notation.";
      return;
    }

    widthField.hidden = false;
    if (widthSelect.value === "auto") {
      rangeNote.textContent = "Auto width uses 8, 16, 32, or 64 bits based on the entered value.";
    } else {
      const bits = Number(widthSelect.value);
      rangeNote.textContent =
        `Signed range: ${signedMin(bits)} to ${signedMax(bits)} · unsigned pattern: 0 to ${unsignedMax(bits)}`;
    }
  }

  function refresh() {
    updateRangeNote();
    clearErrors();
    if (currentValue === null) return;

    let bits = currentWidth;
    if (widthSelect.value !== "auto") bits = Number(widthSelect.value);

    if (modeSelect.value === "unsigned" && currentValue < 0n) {
      clearOthers();
      return;
    }

    if (modeSelect.value === "signed" &&
        (currentValue < signedMin(bits) || currentValue > signedMax(bits))) {
      clearOthers();
      return;
    }

    writeAll(currentValue, bits);
  }

  fields.forEach(field => {
    document.querySelector(`#${field.id}`).addEventListener("input", () => handleField(field));
  });

  customValueInput.addEventListener("input", handleCustom);
  customBaseInput.addEventListener("input", () => {
    const base = Number(customBaseInput.value);
    clearErrors();
    if (!Number.isInteger(base) || base < 2 || base > 36) {
      customError.textContent = "Custom base must be between 2 and 36.";
      return;
    }
    if (currentValue !== null) {
      customValueInput.value = currentValue.toString(base).toUpperCase();
    }
  });

  modeSelect.addEventListener("change", refresh);
  widthSelect.addEventListener("change", refresh);

  clearButton.addEventListener("click", () => {
    updating = true;
    fields.forEach(field => document.querySelector(`#${field.id}`).value = "");
    customValueInput.value = "";
    updating = false;
    currentValue = null;
    summary.hidden = true;
    clearErrors();
    document.querySelector("#hex-input").focus();
  });

  document.querySelectorAll(".copy-button").forEach(button => {
    button.addEventListener("click", async () => {
      const input = document.querySelector(`#${button.dataset.copyTarget}`);
      if (!input.value) return;
      try {
        await navigator.clipboard.writeText(input.value);
        const old = button.textContent;
        button.textContent = "Copied";
        setTimeout(() => button.textContent = old, 900);
      } catch {
        input.select();
        document.execCommand("copy");
      }
    });
  });

  updateRangeNote();
})();
