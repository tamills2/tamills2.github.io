"use strict";

(() => {
  const commonZones = [
    { label: "UTC", timeZone: "UTC" },
    { label: "New York", timeZone: "America/New_York" },
    { label: "Los Angeles", timeZone: "America/Los_Angeles" },
    { label: "London", timeZone: "Europe/London" },
    { label: "Helsinki", timeZone: "Europe/Helsinki" },
    { label: "Moscow", timeZone: "Europe/Moscow" },
    { label: "Paris", timeZone: "Europe/Paris" },
    { label: "Dubai", timeZone: "Asia/Dubai" },
    { label: "Mumbai", timeZone: "Asia/Kolkata" },
    { label: "Singapore", timeZone: "Asia/Singapore" },
    { label: "Tokyo", timeZone: "Asia/Tokyo" },
    { label: "Sydney", timeZone: "Australia/Sydney" }
  ];

  const converterZones = [
    { label: "UTC", timeZone: "UTC" },
    { label: "Local timezone", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" },
    ...commonZones.filter((zone) => zone.timeZone !== "UTC"),
    { label: "Chicago", timeZone: "America/Chicago" },
    { label: "Denver", timeZone: "America/Denver" },
    { label: "Toronto", timeZone: "America/Toronto" },
    { label: "São Paulo", timeZone: "America/Sao_Paulo" },
    { label: "Berlin", timeZone: "Europe/Berlin" },
    { label: "Helsinki", timeZone: "Europe/Helsinki" },
    { label: "Moscow", timeZone: "Europe/Moscow" },
    { label: "Amsterdam", timeZone: "Europe/Amsterdam" },
    { label: "Johannesburg", timeZone: "Africa/Johannesburg" },
    { label: "Cairo", timeZone: "Africa/Cairo" },
    { label: "Hong Kong", timeZone: "Asia/Hong_Kong" },
    { label: "Seoul", timeZone: "Asia/Seoul" },
    { label: "Auckland", timeZone: "Pacific/Auckland" }
  ];

  const localLocation = document.querySelector("#local-location");
  const localTime = document.querySelector("#local-time");
  const localDate = document.querySelector("#local-date");
  const localZoneName = document.querySelector("#local-zone-name");
  const localOffset = document.querySelector("#local-offset");
  const grid = document.querySelector("#timezone-grid");
  const formatToggle = document.querySelector("#format-toggle");

  const inputType = document.querySelector("#input-type");
  const fromZone = document.querySelector("#from-zone");
  const outputFormat = document.querySelector("#output-format");
  const toZone = document.querySelector("#to-zone");
  const timezoneOutputFields = document.querySelectorAll(".timezone-output-only");
  const datetimeInput = document.querySelector("#datetime-input");
  const epochInput = document.querySelector("#epoch-input");
  const datetimeFields = document.querySelectorAll(".datetime-only");
  const epochFields = document.querySelectorAll(".epoch-only");
  const nowButton = document.querySelector("#now-button");
  const swapButton = document.querySelector("#swap-button");
  const clearConverterButton = document.querySelector("#clear-converter-button");
  const converterStatus = document.querySelector("#converter-status");
  const conversionResults = document.querySelector("#conversion-results");
  const primaryResultLabel = document.querySelector("#primary-result-label");
  const convertedTime = document.querySelector("#converted-time");
  const convertedZone = document.querySelector("#converted-zone");
  const isoResult = document.querySelector("#iso-result");
  const utcResult = document.querySelector("#utc-result");
  const epochSecondsResult = document.querySelector("#epoch-seconds-result");
  const epochMillisecondsResult = document.querySelector("#epoch-milliseconds-result");

  let use24Hour = false;

  function getZoneAbbreviation(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short"
    }).formatToParts(date);

    return parts.find((part) => part.type === "timeZoneName")?.value || timeZone;
  }

  function getOffset(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset"
    }).formatToParts(date);

    const value = parts.find((part) => part.type === "timeZoneName")?.value || "GMT";
    return value.replace("GMT", "UTC");
  }

  function formatTime(date, timeZone) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: !use24Hour
    }).format(date);
  }

  function formatDate(date, timeZone) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function formatConvertedDate(date, timeZone) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: !use24Hour,
      timeZoneName: "short"
    }).format(date);
  }

  function createZoneCard(zone) {
    const card = document.createElement("article");
    card.className = "timezone-card";
    card.dataset.timeZone = zone.timeZone;

    card.innerHTML = `
      <div class="timezone-location"></div>
      <div class="timezone-time">--:--:--</div>
      <div class="timezone-date">—</div>
      <div class="timezone-meta">
        <span class="zone-name"></span>
        <span class="zone-offset"></span>
      </div>
    `;

    card.querySelector(".timezone-location").textContent = zone.label;
    card.querySelector(".zone-name").textContent = zone.timeZone;

    return card;
  }

  function buildGrid() {
    const fragment = document.createDocumentFragment();
    commonZones.forEach((zone) => fragment.append(createZoneCard(zone)));
    grid.append(fragment);
  }

  function updateClocks() {
    const now = new Date();
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    localLocation.textContent = "Your current timezone";
    localTime.textContent = formatTime(now, localZone);
    localDate.textContent = formatDate(now, localZone);
    localZoneName.textContent = `${localZone} · ${getZoneAbbreviation(now, localZone)}`;
    localOffset.textContent = getOffset(now, localZone);

    grid.querySelectorAll(".timezone-card").forEach((card) => {
      const timeZone = card.dataset.timeZone;
      card.querySelector(".timezone-time").textContent = formatTime(now, timeZone);
      card.querySelector(".timezone-date").textContent = formatDate(now, timeZone);
      card.querySelector(".zone-name").textContent =
        `${timeZone} · ${getZoneAbbreviation(now, timeZone)}`;
      card.querySelector(".zone-offset").textContent = getOffset(now, timeZone);
    });
  }

  function populateZoneSelect(select) {
    const seen = new Set();

    converterZones.forEach((zone) => {
      if (seen.has(zone.timeZone)) return;
      seen.add(zone.timeZone);

      const option = document.createElement("option");
      option.value = zone.timeZone;
      option.textContent = `${zone.label} — ${zone.timeZone}`;
      select.append(option);
    });
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function formatDateTimeLocal(date) {
    return [
      date.getFullYear(),
      "-",
      pad(date.getMonth() + 1),
      "-",
      pad(date.getDate()),
      "T",
      pad(date.getHours()),
      ":",
      pad(date.getMinutes()),
      ":",
      pad(date.getSeconds())
    ].join("");
  }

  function getTimeZoneOffsetMilliseconds(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);

    const values = {};
    parts.forEach((part) => {
      if (part.type !== "literal") values[part.type] = Number(part.value);
    });

    const asUTC = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );

    return asUTC - date.getTime();
  }

  function zonedDateTimeToDate(value, timeZone) {
    const match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
    );

    if (!match) return null;

    const [, year, month, day, hour, minute, second = "0"] = match;
    const assumedUTC = new Date(Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ));

    let offset = getTimeZoneOffsetMilliseconds(assumedUTC, timeZone);
    let result = new Date(assumedUTC.getTime() - offset);

    const correctedOffset = getTimeZoneOffsetMilliseconds(result, timeZone);
    if (correctedOffset !== offset) {
      result = new Date(assumedUTC.getTime() - correctedOffset);
    }

    return Number.isNaN(result.getTime()) ? null : result;
  }

  function setConverterStatus(message, isError = false) {
    converterStatus.textContent = message;
    converterStatus.classList.toggle("error", isError);
  }

  function clearConversionResults() {
    conversionResults.hidden = true;
  }

  function renderConversion(date) {
    const targetZone = toZone.value;
    const seconds = String(Math.floor(date.getTime() / 1000));
    const milliseconds = String(date.getTime());

    if (outputFormat.value === "epoch-seconds") {
      primaryResultLabel.textContent = "Epoch seconds";
      convertedTime.textContent = seconds;
      convertedZone.textContent = "Seconds since 1970-01-01 00:00:00 UTC";
    } else if (outputFormat.value === "epoch-milliseconds") {
      primaryResultLabel.textContent = "Epoch milliseconds";
      convertedTime.textContent = milliseconds;
      convertedZone.textContent = "Milliseconds since 1970-01-01 00:00:00 UTC";
    } else {
      primaryResultLabel.textContent = "Converted time";
      convertedTime.textContent = formatConvertedDate(date, targetZone);
      convertedZone.textContent = `${targetZone} · ${getOffset(date, targetZone)}`;
    }

    isoResult.textContent = date.toISOString();
    utcResult.textContent = date.toUTCString();
    epochSecondsResult.textContent = seconds;
    epochMillisecondsResult.textContent = milliseconds;

    conversionResults.hidden = false;
    setConverterStatus("Converted automatically.");
  }

  function updateOutputMode() {
    const showTimezone = outputFormat.value === "timezone";
    timezoneOutputFields.forEach((field) => {
      field.hidden = !showTimezone;
    });
    swapButton.hidden = inputType.value !== "datetime" || !showTimezone;
    updateConversion();
  }

  function parseConverterInput() {
    const type = inputType.value;

    if (type === "datetime") {
      if (!datetimeInput.value) {
        clearConversionResults();
        setConverterStatus("");
        return null;
      }

      const date = zonedDateTimeToDate(datetimeInput.value, fromZone.value);
      if (!date) {
        clearConversionResults();
        setConverterStatus("Enter a valid date and time.", true);
        return null;
      }

      return date;
    }

    const raw = epochInput.value.trim();
    if (!raw) {
      clearConversionResults();
      setConverterStatus("");
      return null;
    }

    if (!/^-?\d+$/.test(raw)) {
      clearConversionResults();
      setConverterStatus("Epoch values must contain whole numbers only.", true);
      return null;
    }

    const numeric = Number(raw);
    if (!Number.isSafeInteger(numeric)) {
      clearConversionResults();
      setConverterStatus("Epoch value is outside the supported safe integer range.", true);
      return null;
    }

    const milliseconds = type === "epoch-seconds" ? numeric * 1000 : numeric;
    const date = new Date(milliseconds);

    if (Number.isNaN(date.getTime())) {
      clearConversionResults();
      setConverterStatus("Epoch value could not be converted to a valid date.", true);
      return null;
    }

    return date;
  }

  function updateConversion() {
    const date = parseConverterInput();
    if (date) renderConversion(date);
  }

  function updateInputMode() {
    const isDateTime = inputType.value === "datetime";

    datetimeFields.forEach((field) => {
      field.hidden = !isDateTime;
    });

    epochFields.forEach((field) => {
      field.hidden = isDateTime;
    });

    swapButton.hidden = !isDateTime || outputFormat.value !== "timezone";
    updateConversion();
  }

  function useCurrentTime() {
    const now = new Date();

    if (inputType.value === "datetime") {
      const localZone = fromZone.value;
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: localZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      }).formatToParts(now);

      const values = {};
      parts.forEach((part) => {
        if (part.type !== "literal") values[part.type] = part.value;
      });

      datetimeInput.value =
        `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
    } else if (inputType.value === "epoch-seconds") {
      epochInput.value = String(Math.floor(now.getTime() / 1000));
    } else {
      epochInput.value = String(now.getTime());
    }

    updateConversion();
  }

  formatToggle.addEventListener("click", () => {
    use24Hour = !use24Hour;
    formatToggle.setAttribute("aria-pressed", String(use24Hour));
    formatToggle.textContent = use24Hour ? "12-hour time" : "24-hour time";
    updateClocks();
    updateConversion();
  });

  inputType.addEventListener("change", updateInputMode);
  outputFormat.addEventListener("change", updateOutputMode);
  fromZone.addEventListener("change", updateConversion);
  toZone.addEventListener("change", updateConversion);
  datetimeInput.addEventListener("input", updateConversion);
  epochInput.addEventListener("input", updateConversion);
  nowButton.addEventListener("click", useCurrentTime);

  swapButton.addEventListener("click", () => {
    const oldFrom = fromZone.value;
    fromZone.value = toZone.value;
    toZone.value = oldFrom;
    updateConversion();
  });

  clearConverterButton.addEventListener("click", () => {
    datetimeInput.value = "";
    epochInput.value = "";
    clearConversionResults();
    setConverterStatus("");
  });

  buildGrid();
  populateZoneSelect(fromZone);
  populateZoneSelect(toZone);

  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  fromZone.value = localZone;
  toZone.value = "UTC";

  updateClocks();
  updateInputMode();
  updateOutputMode();
  window.setInterval(updateClocks, 1000);
})();
