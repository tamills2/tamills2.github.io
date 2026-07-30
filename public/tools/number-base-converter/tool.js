"use strict";

(() => {
  const modeSelect = document.querySelector("#mode-select");
  const bitWidthSelect = document.querySelector("#bit-width-select");
  const bitWidthField = document.querySelector("#bit-width-field");
  const rangeNote = document.querySelector("#range-note");
  const clearButton = document.querySelector("#clear-button");

  const standardFields = [
    { id: "binary-input", error: "binary-error", base: 2, bitPattern: true },
    { id: "octal-input", error: "octal-error", base: 8, bitPattern: true },
    { id: "decimal-input", error: "decimal-error", base: 10, decimal: true },
    { id: "hex-input", error: "hex-error", base: 16, bitPattern: true },
    { id: "base36-input", error: "base36-error", base: 36 }
  ];

  const customBaseInput = document.querySelector("#custom-base-input");
  const customValueInput = document.querySelector("#custom-value-input");
  const customError = document.querySelector("#custom-error");
  const summaryCard = document.querySelector("#summary-card");
  const signedValueOutput = document.querySelector("#signed-value");
  const unsignedValueOutput = document.querySelector("#unsigned-value");
  const bitPatternOutput = document.querySelector("#bit-pattern");

  let currentSigned = null;
  let activeId = null;
  let updating = false;

  const normalize = (value) => value.trim().replace(/[\s_]/g, "").toUpperCase();

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

    return { value: result * sign };
  }

  function width() {
    return Number(bitWidthSelect.value);
  }

  function modulus() {
    return 1n << BigInt(width());
  }

  function signedMin() {
    return -(1n << BigInt(width() - 1));
  }

  function signedMax() {
    return (1n << BigInt(width() - 1)) - 1n;
  }

  function unsignedMax() {
    return modulus() - 1n;
  }

  function toUnsignedPattern(signedValue) {
    return signedValue < 0n ? modulus() + signedValue : signedValue;
  }

  function patternToSigned(unsignedValue) {
    const signBit = 1n << BigInt(width() - 1);
    return (unsignedValue & signBit) !== 0n ? unsignedValue - modulus() : unsignedValue;
  }

  function parseField(raw, field) {
    const parsed = parseMagnitude(raw, field.base);
    if (parsed.empty || parsed.error) return parsed;

    const mode = modeSelect.value;

    if (mode === "unsigned") {
      if (parsed.value < 0n) return { error: "Unsigned mode does not allow negative values." };
      return { value: parsed.value };
    }

    if (field.decimal || !field.bitPattern) {
      if (parsed.value < signedMin() || parsed.value > signedMax()) {
        return { error: `Value must fit in signed ${width()}-bit range.` };
      }
      return { value: parsed.value };
    }

    if (parsed.value < 0n) {
      if (parsed.value < signedMin()) {
        return { error: `Value must fit in signed ${width()}-bit range.` };
      }
      return { value: parsed.value };
    }

    if (parsed.value > unsignedMax()) {
      return { error: `Bit pattern exceeds ${width()} bits.` };
    }

    return { value: patternToSigned(parsed.value) };
  }

  function formatBitPattern(value, base) {
    const unsigned = toUnsignedPattern(value);
    let text = unsigned.toString(base).toUpperCase();

    if (base === 2) {
      text = text.padStart(width(), "0");
    } else if (base === 8) {
      text = text.padStart(Math.ceil(width() / 3), "0");
    } else if (base === 16) {
      text = text.padStart(Math.ceil(width() / 4), "0");
    }

    return text;
  }

  function formatField(value, field) {
    if (modeSelect.value === "signed" && field.bitPattern) {
      return formatBitPattern(value, field.base);
    }
    return value.toString(field.base).toUpperCase();
  }

  function clearErrors() {
    standardFields.forEach((field) => {
      document.querySelector(`#${field.error}`).textContent = "";
    });
    customError.textContent = "";
  }

  function clearOthers(except = "") {
    updating = true;
    standardFields.forEach((field) => {
      if (field.id !== except) document.querySelector(`#${field.id}`).value = "";
    });
    if (except !== "custom-value-input") customValueInput.value = "";
    updating = false;
    currentSigned = null;
    summaryCard.hidden = true;
  }

  function writeAll(value, source = "") {
    updating = true;

    standardFields.forEach((field) => {
      if (field.id !== source) {
        document.querySelector(`#${field.id}`).value = formatField(value, field);
      }
    });

    if (source !== "custom-value-input") {
      customValueInput.value = value.toString(Number(customBaseInput.value)).toUpperCase();
    }

    updating = false;
    currentSigned = value;

    const unsigned = modeSelect.value === "signed" ? toUnsignedPattern(value) : value;
    signedValueOutput.textContent = value.toString(10);
    unsignedValueOutput.textContent = unsigned.toString(10);
    bitPatternOutput.textContent =
      modeSelect.value === "signed"
        ? formatBitPattern(value, 2)
        : value.toString(2);

    summaryCard.hidden = false;
  }

  function handleField(field) {
    if (updating) return;

    activeId = field.id;
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

    writeAll(parsed.value, field.id);
  }

  function handleCustom() {
    if (updating) return;

    activeId = "custom-value-input";
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

    if (modeSelect.value === "signed" &&
        (parsed.value < signedMin() || parsed.value > signedMax())) {
      customError.textContent = `Value must fit in signed ${width()}-bit range.`;
      clearOthers("custom-value-input");
      return;
    }

    if (modeSelect.value === "unsigned" && parsed.value < 0n) {
      customError.textContent = "Unsigned mode does not allow negative values.";
      clearOthers("custom-value-input");
      return;
    }

    writeAll(parsed.value, "custom-value-input");
  }

  function updateRangeNote() {
    if (modeSelect.value === "signed") {
      bitWidthField.hidden = false;
      rangeNote.textContent =
        `Signed range: ${signedMin()} to ${signedMax()} · unsigned bit pattern: 0 to ${unsignedMax()}`;
    } else {
      bitWidthField.hidden = true;
      rangeNote.textContent = "Unsigned mode uses ordinary positive magnitude notation.";
    }
  }

  function refreshAfterSettingChange() {
    updateRangeNote();
    clearErrors();

    if (currentSigned === null) return;

    if (modeSelect.value === "unsigned" && currentSigned < 0n) {
      clearOthers();
      return;
    }

    if (modeSelect.value === "signed" &&
        (currentSigned < signedMin() || currentSigned > signedMax())) {
      clearOthers();
      return;
    }

    writeAll(currentSigned);
  }

  standardFields.forEach((field) => {
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

    if (currentSigned !== null) {
      customValueInput.value = currentSigned.toString(base).toUpperCase();
    }
  });

  modeSelect.addEventListener("change", refreshAfterSettingChange);
  bitWidthSelect.addEventListener("change", refreshAfterSettingChange);

  clearButton.addEventListener("click", () => {
    updating = true;
    standardFields.forEach((field) => {
      document.querySelector(`#${field.id}`).value = "";
    });
    customValueInput.value = "";
    updating = false;
    currentSigned = null;
    activeId = null;
    clearErrors();
    summaryCard.hidden = true;
    document.querySelector("#decimal-input").focus();
  });

  document.querySelectorAll(".copy-button").forEach((button) => {
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
