"use strict";

(() => {
  const textInput = document.querySelector("#text-input");
  const textCounts = document.querySelector("#text-counts");
  const textResults = document.querySelector("#text-results");
  const clearTextButton = document.querySelector("#clear-text");
  const uppercaseHex = document.querySelector("#uppercase-hex");
  const removePadding = document.querySelector("#remove-padding");
  const wrapBase64 = document.querySelector("#wrap-base64");

  const fileInput = document.querySelector("#file-input");
  const fileDropZone = document.querySelector("#file-drop-zone");
  const fileDetails = document.querySelector("#file-details");
  const clearFileButton = document.querySelector("#clear-file");
  const fileResultsSection = document.querySelector("#file-results-section");
  const fileResults = document.querySelector("#file-results");

  const encoder = new TextEncoder();
  let textRun = 0;
  let selectedFile = null;
  let fileRun = 0;

  const TEXT_ALGORITHMS = [
    ["MD5", "md5"],
    ["SHA-1", "SHA-1"],
    ["SHA-256", "SHA-256"],
    ["SHA-384", "SHA-384"],
    ["SHA-512", "SHA-512"],
    ["Base64", "base64"],
    ["Base64 URL-safe", "base64url"]
  ];

  const FILE_ALGORITHMS = [
    ["MD5", "md5"],
    ["SHA-1", "SHA-1"],
    ["SHA-256", "SHA-256"],
    ["SHA-384", "SHA-384"],
    ["SHA-512", "SHA-512"]
  ];

  function createResultRows(container, algorithms) {
    container.replaceChildren();
    const fragment = document.createDocumentFragment();

    algorithms.forEach(([label, key]) => {
      const row = document.createElement("div");
      row.className = "result-row";
      row.dataset.resultKey = key;

      const name = document.createElement("div");
      name.className = "result-label";
      name.textContent = label;

      const outputWrap = document.createElement("div");
      outputWrap.className = "result-output-wrap";

      const output = document.createElement("output");
      output.className = "result-output";
      output.dataset.output = key;
      output.textContent = "";

      const copy = document.createElement("button");
      copy.className = "copy-result";
      copy.type = "button";
      copy.disabled = true;
      copy.setAttribute("aria-label", `Copy ${label}`);
      copy.title = `Copy ${label}`;
      copy.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>`;
      copy.addEventListener("click", async () => {
        const value = output.textContent;
        if (!value) return;
        await navigator.clipboard.writeText(value.replace(/\n/g, ""));
        copy.classList.add("copied");
        copy.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>`;
        window.setTimeout(() => {
          copy.classList.remove("copied");
          copy.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>`;
        }, 900);
      });

      outputWrap.append(output, copy);
      row.append(name, outputWrap);
      fragment.append(row);
    });

    container.append(fragment);
  }

  function setResult(container, key, value) {
    const row = Array.from(container.querySelectorAll(".result-row"))
      .find((item) => item.dataset.resultKey === key);
    if (!row) return;
    row.querySelector(".result-output").textContent = value;
    row.querySelector(".copy-result").disabled = !value;
  }

  function bytesToHex(bytes) {
    const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return uppercaseHex.checked ? value.toUpperCase() : value;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  function formatBase64(value, urlSafe = false) {
    let output = value;
    if (urlSafe) output = output.replace(/\+/g, "-").replace(/\//g, "_");
    if (removePadding.checked) output = output.replace(/=+$/g, "");
    if (wrapBase64.checked) output = output.match(/.{1,76}/g)?.join("\n") || "";
    return output;
  }

  async function subtleDigest(algorithm, bytes) {
    const buffer = await crypto.subtle.digest(algorithm, bytes);
    return new Uint8Array(buffer);
  }

  function leftRotate(value, amount) {
    return (value << amount) | (value >>> (32 - amount));
  }

  function md5(bytes) {
    const originalLength = bytes.length;
    const bitLength = originalLength * 8;
    const paddedLength = (((originalLength + 8) >>> 6) + 1) * 64;
    const data = new Uint8Array(paddedLength);
    data.set(bytes);
    data[originalLength] = 0x80;

    const view = new DataView(data.buffer);
    const lowBits = bitLength >>> 0;
    const highBits = Math.floor(bitLength / 0x100000000) >>> 0;
    view.setUint32(paddedLength - 8, lowBits, true);
    view.setUint32(paddedLength - 4, highBits, true);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    const shifts = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    const constants = Array.from({ length: 64 }, (_, index) =>
      Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0
    );

    for (let offset = 0; offset < paddedLength; offset += 64) {
      const words = Array.from({ length: 16 }, (_, index) => view.getUint32(offset + index * 4, true));
      let a = a0;
      let b = b0;
      let c = c0;
      let d = d0;

      for (let index = 0; index < 64; index += 1) {
        let f;
        let g;
        if (index < 16) {
          f = (b & c) | (~b & d);
          g = index;
        } else if (index < 32) {
          f = (d & b) | (~d & c);
          g = (5 * index + 1) % 16;
        } else if (index < 48) {
          f = b ^ c ^ d;
          g = (3 * index + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * index) % 16;
        }

        const nextD = c;
        c = b;
        const sum = (a + f + constants[index] + words[g]) >>> 0;
        b = (b + leftRotate(sum, shifts[index])) >>> 0;
        a = d;
        d = nextD;
      }

      a0 = (a0 + a) >>> 0;
      b0 = (b0 + b) >>> 0;
      c0 = (c0 + c) >>> 0;
      d0 = (d0 + d) >>> 0;
    }

    const digest = new Uint8Array(16);
    const digestView = new DataView(digest.buffer);
    digestView.setUint32(0, a0, true);
    digestView.setUint32(4, b0, true);
    digestView.setUint32(8, c0, true);
    digestView.setUint32(12, d0, true);
    return digest;
  }

  async function calculateText() {
    const run = ++textRun;
    const text = textInput.value;
    const bytes = encoder.encode(text);
    textCounts.textContent = `${Array.from(text).length} characters · ${bytes.length} bytes`;

    if (!text) {
      TEXT_ALGORITHMS.forEach(([, key]) => setResult(textResults, key, ""));
      return;
    }

    const base64 = bytesToBase64(bytes);
    const values = {
      md5: bytesToHex(md5(bytes)),
      base64: formatBase64(base64),
      base64url: formatBase64(base64, true)
    };

    const digestAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    const digests = await Promise.all(digestAlgorithms.map(async (algorithm) => [
      algorithm,
      bytesToHex(await subtleDigest(algorithm, bytes))
    ]));

    if (run !== textRun) return;
    Object.entries(values).forEach(([key, value]) => setResult(textResults, key, value));
    digests.forEach(([key, value]) => setResult(textResults, key, value));
  }

  function formatFileSize(size) {
    if (size < 1024) return `${size} bytes`;
    const units = ["KB", "MB", "GB", "TB"];
    let value = size / 1024;
    let unit = units[0];
    for (let index = 1; index < units.length && value >= 1024; index += 1) {
      value /= 1024;
      unit = units[index];
    }
    return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
  }

  async function calculateFile(file) {
    const run = ++fileRun;
    selectedFile = file;
    fileDetails.textContent = `${file.name} · ${formatFileSize(file.size)}`;
    clearFileButton.disabled = false;
    fileResultsSection.hidden = false;
    FILE_ALGORITHMS.forEach(([, key]) => setResult(fileResults, key, "Calculating…"));

    const bytes = new Uint8Array(await file.arrayBuffer());
    const digestAlgorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    const digests = await Promise.all(digestAlgorithms.map(async (algorithm) => [
      algorithm,
      bytesToHex(await subtleDigest(algorithm, bytes))
    ]));

    if (run !== fileRun || selectedFile !== file) return;
    setResult(fileResults, "md5", bytesToHex(md5(bytes)));
    digests.forEach(([key, value]) => setResult(fileResults, key, value));
  }

  function clearFile() {
    fileRun += 1;
    selectedFile = null;
    fileInput.value = "";
    fileDetails.textContent = "No file selected";
    clearFileButton.disabled = true;
    fileResultsSection.hidden = true;
    FILE_ALGORITHMS.forEach(([, key]) => setResult(fileResults, key, ""));
  }

  createResultRows(textResults, TEXT_ALGORITHMS);
  createResultRows(fileResults, FILE_ALGORITHMS);

  textInput.addEventListener("input", calculateText);
  [uppercaseHex, removePadding, wrapBase64].forEach((control) => {
    control.addEventListener("change", () => {
      calculateText();
      if (selectedFile) calculateFile(selectedFile);
    });
  });

  clearTextButton.addEventListener("click", () => {
    textInput.value = "";
    calculateText();
    textInput.focus();
  });

  fileInput.addEventListener("change", () => {
    const [file] = fileInput.files;
    if (file) calculateFile(file);
  });

  clearFileButton.addEventListener("click", clearFile);

  ["dragenter", "dragover"].forEach((eventName) => {
    fileDropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      fileDropZone.classList.add("drag-active");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    fileDropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      fileDropZone.classList.remove("drag-active");
    });
  });

  fileDropZone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    if (file) calculateFile(file);
  });

  calculateText();
})();
