(() => {
  "use strict";

  const input = document.querySelector("#url-input");
  const output = document.querySelector("#url-output");
  const encodeUrlButton = document.querySelector("#encode-url");
  const encodeComponentButton = document.querySelector("#encode-component");
  const decodeButton = document.querySelector("#decode-value");
  const swapButton = document.querySelector("#swap-values");
  const clearButton = document.querySelector("#clear-values");
  const copyButton = document.querySelector("#copy-output");
  const parseButton = document.querySelector("#parse-url");
  const addParameterButton = document.querySelector("#add-parameter");
  const plusAsSpace = document.querySelector("#plus-as-space");
  const uppercaseEscapes = document.querySelector("#uppercase-escapes");
  const converterStatus = document.querySelector("#converter-status");
  const parseStatus = document.querySelector("#parse-status");
  const queryRows = document.querySelector("#query-rows");
  const queryEmpty = document.querySelector("#query-empty");
  const helperButtons = [...document.querySelectorAll("#encoding-helpers button")];

  if (!input || !output || !encodeUrlButton || !encodeComponentButton || !decodeButton || !swapButton || !clearButton || !copyButton || !parseButton || !addParameterButton || !plusAsSpace || !uppercaseEscapes || !converterStatus || !parseStatus || !queryRows || !queryEmpty) {
    return;
  }

  const partElements = {
    protocol: document.querySelector("#part-protocol"),
    origin: document.querySelector("#part-origin"),
    host: document.querySelector("#part-host"),
    hostname: document.querySelector("#part-hostname"),
    port: document.querySelector("#part-port"),
    path: document.querySelector("#part-path"),
    query: document.querySelector("#part-query"),
    fragment: document.querySelector("#part-fragment")
  };

  let parsedUrl = null;

  const setStatus = (element, message = "", isError = false) => {
    element.textContent = message;
    element.classList.toggle("is-error", isError);
  };

  const normalizeEscapes = (value) => uppercaseEscapes.checked
    ? value.replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase())
    : value;

  const setOutput = (value) => {
    output.value = value;
    copyButton.disabled = value.length === 0;
  };

  const sourceForParsing = () => {
    const outputValue = output.value.trim();
    return outputValue || input.value.trim();
  };

  const defaultPort = (protocol) => {
    if (protocol === "http:") return "80";
    if (protocol === "https:") return "443";
    if (protocol === "ftp:") return "21";
    return "—";
  };

  const resetBreakdown = () => {
    Object.values(partElements).forEach((element) => {
      if (element) element.textContent = "—";
    });
    parsedUrl = null;
    queryRows.replaceChildren();
    queryEmpty.hidden = false;
  };

  const updateBreakdown = (url) => {
    const values = {
      protocol: url.protocol.replace(/:$/, "") || "—",
      origin: url.origin === "null" ? "—" : url.origin,
      host: url.host || "—",
      hostname: url.hostname || "—",
      port: url.port || defaultPort(url.protocol),
      path: url.pathname || "/",
      query: url.search ? url.search.slice(1) : "—",
      fragment: url.hash ? url.hash.slice(1) : "—"
    };

    Object.entries(values).forEach(([key, value]) => {
      if (partElements[key]) partElements[key].textContent = value;
    });
  };

  const rebuildUrlFromRows = () => {
    if (!parsedUrl) return;

    const params = new URLSearchParams();
    [...queryRows.querySelectorAll("tr")].forEach((row) => {
      const name = row.querySelector('[data-role="name"]')?.value ?? "";
      const value = row.querySelector('[data-role="value"]')?.value ?? "";
      if (name || value) params.append(name, value);
    });

    parsedUrl.search = params.toString();
    const rebuilt = normalizeEscapes(parsedUrl.toString());
    setOutput(rebuilt);
    updateBreakdown(parsedUrl);
    queryEmpty.hidden = queryRows.children.length > 0;
  };

  const createParameterRow = (name = "", value = "") => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input data-role="name" type="text" aria-label="Parameter name" spellcheck="false"></td>
      <td><input data-role="value" type="text" aria-label="Parameter value" spellcheck="false"></td>
      <td><button class="query-remove" type="button">Remove</button></td>
    `;

    row.querySelector('[data-role="name"]').value = name;
    row.querySelector('[data-role="value"]').value = value;
    row.querySelectorAll("input").forEach((field) => field.addEventListener("input", rebuildUrlFromRows));
    row.querySelector(".query-remove").addEventListener("click", () => {
      row.remove();
      rebuildUrlFromRows();
    });
    return row;
  };

  const renderParameters = (url) => {
    const fragment = document.createDocumentFragment();
    for (const [name, value] of url.searchParams.entries()) {
      fragment.append(createParameterRow(name, value));
    }
    queryRows.replaceChildren(fragment);
    queryEmpty.hidden = queryRows.children.length > 0;
  };

  const parseCurrentUrl = () => {
    const value = sourceForParsing();
    if (!value) {
      resetBreakdown();
      setStatus(parseStatus, "Enter a URL to parse.", true);
      return;
    }

    try {
      parsedUrl = new URL(value);
      updateBreakdown(parsedUrl);
      renderParameters(parsedUrl);
      setStatus(parseStatus);
    } catch {
      resetBreakdown();
      setStatus(parseStatus, "Invalid URL", true);
    }
  };

  encodeUrlButton.addEventListener("click", () => {
    setOutput(normalizeEscapes(encodeURI(input.value)));
    setStatus(converterStatus);
  });

  encodeComponentButton.addEventListener("click", () => {
    setOutput(normalizeEscapes(encodeURIComponent(input.value)));
    setStatus(converterStatus);
  });

  decodeButton.addEventListener("click", () => {
    try {
      const value = plusAsSpace.checked ? input.value.replace(/\+/g, " ") : input.value;
      setOutput(decodeURIComponent(value));
      setStatus(converterStatus);
    } catch {
      setStatus(converterStatus, "Invalid percent-encoded value", true);
    }
  });

  swapButton.addEventListener("click", () => {
    const previousInput = input.value;
    input.value = output.value;
    setOutput(previousInput);
    setStatus(converterStatus);
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    setOutput("");
    setStatus(converterStatus);
    setStatus(parseStatus);
    resetBreakdown();
    input.focus();
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      setStatus(converterStatus, "Copied.");
    } catch {
      output.select();
      document.execCommand("copy");
      setStatus(converterStatus, "Copied.");
    }
  });

  parseButton.addEventListener("click", parseCurrentUrl);

  addParameterButton.addEventListener("click", () => {
    if (!parsedUrl) {
      parseCurrentUrl();
      if (!parsedUrl) return;
    }
    const row = createParameterRow();
    queryRows.append(row);
    queryEmpty.hidden = true;
    row.querySelector('[data-role="name"]').focus();
  });

  helperButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.value || "";
      try {
        await navigator.clipboard.writeText(value);
        setStatus(converterStatus, `${value} copied.`);
      } catch {
        setOutput(value);
        setStatus(converterStatus);
      }
    });
  });

  input.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      parseCurrentUrl();
    }
  });
})();
