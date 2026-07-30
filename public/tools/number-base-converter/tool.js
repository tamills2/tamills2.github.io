"use strict";

(() => {
  const fields = [
    { id: "binary-input", errorId: "binary-error", base: 2 },
    { id: "octal-input", errorId: "octal-error", base: 8 },
    { id: "decimal-input", errorId: "decimal-error", base: 10 },
    { id: "hex-input", errorId: "hex-error", base: 16 },
    { id: "base36-input", errorId: "base36-error", base: 36 }
  ];

  const customBaseInput = document.querySelector("#custom-base-input");
  const customValueInput = document.querySelector("#custom-value-input");
  const customError = document.querySelector("#custom-error");
  const clearButton = document.querySelector("#clear-button");
  const summaryCard = document.querySelector("#summary-card");
  const bitLength = document.querySelector("#bit-length");
  const hexLength = document.querySelector("#hex-length");
  const signValue = document.querySelector("#sign-value");

  let activeField = null;
  let currentValue = null;
  let isUpdating = false;

  function normalizeInput(value) {
    return value.trim().replace(/[\s_]/g, "").toUpperCase();
  }

  function validDigitValue(character) {
    const code = character.charCodeAt(0);

    if (code >= 48 && code <= 57) return code - 48;
    if (code >= 65 && code <= 90) return code - 55;

    return -1;
  }

  function parseBigIntFromBase(rawValue, base) {
    const value = normalizeInput(rawValue);

    if (!value) return { empty: true };

    let sign = 1n;
    let digits = value;

    if (digits.startsWith("-")) {
      sign = -1n;
      digits = digits.slice(1);
    } else if (digits.startsWith("+")) {
      digits = digits.slice(1);
    }

    if (!digits) {
      return { error: "Enter at least one digit." };
    }

    let result = 0n;
    const bigintBase = BigInt(base);

    for (const character of digits) {
      const digit = validDigitValue(character);

      if (digit < 0 || digit >= base) {
        return {
          error: `"${character}" is not valid in base ${base}.`
        };
      }

      result = result * bigintBase + BigInt(digit);
    }

    return { value: result * sign };
  }

  function formatBigInt(value, base) {
    return value.toString(base).toUpperCase();
  }

  function clearErrors() {
    fields.forEach((field) => {
      document.querySelector(`#${field.errorId}`).textContent = "";
    });
    customError.textContent = "";
  }

  function setFieldError(field, message) {
    document.querySelector(`#${field.errorId}`).textContent = message;
  }

  function updateSummary(value) {
    const absolute = value < 0n ? -value : value;
    const binary = absolute.toString(2);
    const hex = absolute.toString(16).toUpperCase();

    bitLength.textContent = absolute === 0n ? "1" : String(binary.length);
    hexLength.textContent = absolute === 0n ? "1" : String(hex.length);
    signValue.textContent = value < 0n ? "Negative" : value > 0n ? "Positive" : "Zero";
    summaryCard.hidden = false;
  }

  function clearSummary() {
    summaryCard.hidden = true;
  }

  function writeAllValues(value, sourceId = "") {
    isUpdating = true;

    fields.forEach((field) => {
      if (field.id !== sourceId) {
        document.querySelector(`#${field.id}`).value = formatBigInt(value, field.base);
      }
    });

    if (sourceId !== "custom-value-input") {
      const customBase = Number(customBaseInput.value);
      customValueInput.value = formatBigInt(value, customBase);
    }

    isUpdating = false;
    currentValue = value;
    updateSummary(value);
  }

  function clearAll(exceptId = "") {
    isUpdating = true;

    fields.forEach((field) => {
      if (field.id !== exceptId) {
        document.querySelector(`#${field.id}`).value = "";
      }
    });

    if (exceptId !== "custom-value-input") {
      customValueInput.value = "";
    }

    isUpdating = false;
    currentValue = null;
    clearSummary();
  }

  function handleStandardInput(field) {
    if (isUpdating) return;

    activeField = field.id;
    clearErrors();

    const input = document.querySelector(`#${field.id}`);
    const parsed = parseBigIntFromBase(input.value, field.base);

    if (parsed.empty) {
      clearAll(field.id);
      return;
    }

    if (parsed.error) {
      setFieldError(field, parsed.error);
      clearAll(field.id);
      return;
    }

    writeAllValues(parsed.value, field.id);
  }

  function handleCustomInput() {
    if (isUpdating) return;

    activeField = "custom-value-input";
    clearErrors();

    const base = Number(customBaseInput.value);

    if (!Number.isInteger(base) || base < 2 || base > 36) {
      customError.textContent = "Custom base must be between 2 and 36.";
      clearAll("custom-value-input");
      return;
    }

    const parsed = parseBigIntFromBase(customValueInput.value, base);

    if (parsed.empty) {
      clearAll("custom-value-input");
      return;
    }

    if (parsed.error) {
      customError.textContent = parsed.error;
      clearAll("custom-value-input");
      return;
    }

    writeAllValues(parsed.value, "custom-value-input");
  }

  fields.forEach((field) => {
    document.querySelector(`#${field.id}`).addEventListener("input", () => {
      handleStandardInput(field);
    });
  });

  customValueInput.addEventListener("input", handleCustomInput);

  customBaseInput.addEventListener("input", () => {
    clearErrors();

    const base = Number(customBaseInput.value);

    if (!Number.isInteger(base) || base < 2 || base > 36) {
      customError.textContent = "Custom base must be between 2 and 36.";
      customValueInput.value = "";
      return;
    }

    if (currentValue !== null && activeField !== "custom-value-input") {
      customValueInput.value = formatBigInt(currentValue, base);
    } else if (customValueInput.value) {
      handleCustomInput();
    }
  });

  clearButton.addEventListener("click", () => {
    isUpdating = true;
    fields.forEach((field) => {
      document.querySelector(`#${field.id}`).value = "";
    });
    customValueInput.value = "";
    isUpdating = false;

    activeField = null;
    currentValue = null;
    clearErrors();
    clearSummary();
    document.querySelector("#decimal-input").focus();
  });

  document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(`#${button.dataset.copyTarget}`);
      const value = target.value;

      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);
        const previous = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = previous;
        }, 1000);
      } catch {
        target.select();
        document.execCommand("copy");
      }
    });
  });
})();
