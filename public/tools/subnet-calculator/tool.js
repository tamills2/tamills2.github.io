"use strict";

(() => {
  const MAX_IPV4 = (1n << 32n) - 1n;
  const elements = {
    form: document.querySelector("#subnet-form"),
    ip: document.querySelector("#ip-input"),
    prefix: document.querySelector("#prefix-input"),
    error: document.querySelector("#form-error"),
    results: document.querySelector("#results-section"),
    clear: document.querySelector("#clear-button"),
    example: document.querySelector("#example-button"),
    copy: document.querySelector("#copy-button"),
  };

  const outputIds = [
    "network-cidr", "network-classification", "broadcast-address", "usable-host-count",
    "usable-host-note", "total-address-count", "address-block-size", "entered-address",
    "first-address", "last-address", "first-usable", "last-usable", "cidr-prefix",
    "subnet-mask", "wildcard-mask", "network-bits", "host-bits",
    "binary-address-decimal", "binary-network-decimal", "binary-mask-decimal",
  ];
  const outputs = Object.fromEntries(outputIds.map((id) => [id, document.querySelector(`#${id}`)]));
  const binaryOutputs = {
    address: document.querySelector("#binary-address"),
    network: document.querySelector("#binary-network"),
    mask: document.querySelector("#binary-mask"),
  };

  function parseIPv4(value) {
    const parts = value.trim().split(".");
    if (parts.length !== 4) throw new Error("Enter a complete IPv4 address with four octets.");
    const octets = parts.map((part) => {
      if (!/^\d{1,3}$/.test(part)) throw new Error("Each IPv4 octet must be a number from 0 to 255.");
      const number = Number(part);
      if (number < 0 || number > 255) throw new Error("Each IPv4 octet must be between 0 and 255.");
      return number;
    });
    return octets.reduce((value, octet) => (value << 8n) | BigInt(octet), 0n);
  }

  function bigintToIPv4(value) {
    return [24n, 16n, 8n, 0n].map((shift) => Number((value >> shift) & 255n)).join(".");
  }

  function parseInput() {
    const raw = elements.ip.value.trim();
    if (!raw) throw new Error("Enter an IPv4 address.");
    const pieces = raw.split("/");
    if (pieces.length > 2) throw new Error("Use CIDR notation such as 192.168.1.25/24.");
    const address = parseIPv4(pieces[0]);
    const prefixText = pieces.length === 2 ? pieces[1] : elements.prefix.value.trim();
    if (!/^\d{1,2}$/.test(prefixText)) throw new Error("Enter a prefix length from 0 to 32.");
    const prefix = Number(prefixText);
    if (prefix < 0 || prefix > 32) throw new Error("The CIDR prefix must be between 0 and 32.");
    return { address, prefix };
  }

  function formatNumber(value) {
    return value.toLocaleString("en-US");
  }

  function classifyAddress(address) {
    const first = Number((address >> 24n) & 255n);
    const second = Number((address >> 16n) & 255n);
    if (first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)) return "Private IPv4 address";
    if (first === 127) return "Loopback address";
    if (first === 169 && second === 254) return "Link-local address";
    if (first >= 224 && first <= 239) return "Multicast address";
    if (first === 0) return "Current network / reserved";
    if (first >= 240) return "Reserved address space";
    if (first === 100 && second >= 64 && second <= 127) return "Carrier-grade NAT address";
    if (first === 192 && second === 0 && Number((address >> 8n) & 255n) === 2) return "Documentation address";
    if (first === 198 && second === 51 && Number((address >> 8n) & 255n) === 100) return "Documentation address";
    if (first === 203 && second === 0 && Number((address >> 8n) & 255n) === 113) return "Documentation address";
    return "Public IPv4 address";
  }

  function binaryMarkup(value, prefix) {
    const bits = value.toString(2).padStart(32, "0");
    let html = '<span class="binary-value">';
    for (let index = 0; index < 32; index += 1) {
      if (index > 0 && index % 8 === 0) html += '<span class="binary-divider">.</span>';
      const className = index < prefix ? "binary-network" : "binary-host";
      html += `<span class="${className}">${bits[index]}</span>`;
    }
    return `${html}</span>`;
  }

  function calculate(address, prefix) {
    const hostBits = 32 - prefix;
    const mask = prefix === 0 ? 0n : (MAX_IPV4 << BigInt(hostBits)) & MAX_IPV4;
    const wildcard = MAX_IPV4 ^ mask;
    const network = address & mask;
    const broadcast = network | wildcard;
    const total = 1n << BigInt(hostBits);
    let firstUsable = network;
    let lastUsable = broadcast;
    let usable = total;
    let usableNote = "All addresses are usable";

    if (prefix <= 30) {
      firstUsable = network + 1n;
      lastUsable = broadcast - 1n;
      usable = total - 2n;
      usableNote = "Excludes network and broadcast";
    } else if (prefix === 31) {
      usableNote = "Point-to-point block (RFC 3021)";
    } else {
      usableNote = "Single-host route";
    }

    return { address, prefix, hostBits, mask, wildcard, network, broadcast, total, usable, firstUsable, lastUsable, usableNote };
  }

  function render(result) {
    const { address, prefix, hostBits, mask, wildcard, network, broadcast, total, usable, firstUsable, lastUsable, usableNote } = result;
    outputs["network-cidr"].textContent = `${bigintToIPv4(network)}/${prefix}`;
    outputs["network-classification"].textContent = classifyAddress(address);
    outputs["broadcast-address"].textContent = bigintToIPv4(broadcast);
    outputs["usable-host-count"].textContent = formatNumber(usable);
    outputs["usable-host-note"].textContent = usableNote;
    outputs["total-address-count"].textContent = formatNumber(total);
    outputs["address-block-size"].textContent = `${hostBits} host bit${hostBits === 1 ? "" : "s"}`;
    outputs["entered-address"].textContent = bigintToIPv4(address);
    outputs["first-address"].textContent = bigintToIPv4(network);
    outputs["last-address"].textContent = bigintToIPv4(broadcast);
    outputs["first-usable"].textContent = bigintToIPv4(firstUsable);
    outputs["last-usable"].textContent = bigintToIPv4(lastUsable);
    outputs["cidr-prefix"].textContent = `/${prefix}`;
    outputs["subnet-mask"].textContent = bigintToIPv4(mask);
    outputs["wildcard-mask"].textContent = bigintToIPv4(wildcard);
    outputs["network-bits"].textContent = String(prefix);
    outputs["host-bits"].textContent = String(hostBits);
    outputs["binary-address-decimal"].textContent = bigintToIPv4(address);
    outputs["binary-network-decimal"].textContent = bigintToIPv4(network);
    outputs["binary-mask-decimal"].textContent = bigintToIPv4(mask);
    binaryOutputs.address.innerHTML = binaryMarkup(address, prefix);
    binaryOutputs.network.innerHTML = binaryMarkup(network, prefix);
    binaryOutputs.mask.innerHTML = binaryMarkup(mask, prefix);
    elements.results.hidden = false;
  }

  function showError(message) {
    elements.error.textContent = message;
    elements.error.hidden = false;
    elements.results.hidden = true;
  }

  function calculateAndRender() {
    try {
      const input = parseInput();
      elements.error.hidden = true;
      elements.prefix.value = String(input.prefix);
      render(calculate(input.address, input.prefix));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Unable to calculate this subnet.");
    }
  }

  function copyResults() {
    if (elements.results.hidden) return;
    const lines = [
      `Network: ${outputs["network-cidr"].textContent}`,
      `Subnet mask: ${outputs["subnet-mask"].textContent}`,
      `Wildcard mask: ${outputs["wildcard-mask"].textContent}`,
      `Broadcast: ${outputs["broadcast-address"].textContent}`,
      `First usable: ${outputs["first-usable"].textContent}`,
      `Last usable: ${outputs["last-usable"].textContent}`,
      `Usable hosts: ${outputs["usable-host-count"].textContent}`,
      `Total addresses: ${outputs["total-address-count"].textContent}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      const original = elements.copy.textContent;
      elements.copy.textContent = "Copied";
      window.setTimeout(() => { elements.copy.textContent = original; }, 1400);
    }).catch(() => showError("The browser could not copy the results. Select and copy them manually."));
  }

  elements.form.addEventListener("submit", (event) => { event.preventDefault(); calculateAndRender(); });
  elements.clear.addEventListener("click", () => {
    elements.ip.value = "";
    elements.prefix.value = "24";
    elements.error.hidden = true;
    elements.results.hidden = true;
    elements.ip.focus();
  });
  elements.example.addEventListener("click", () => {
    elements.ip.value = "10.42.17.130/20";
    elements.prefix.value = "20";
    calculateAndRender();
  });
  elements.copy.addEventListener("click", copyResults);
  document.querySelectorAll("[data-prefix]").forEach((button) => {
    button.addEventListener("click", () => {
      const prefix = button.dataset.prefix;
      elements.prefix.value = prefix;
      const addressOnly = elements.ip.value.split("/")[0] || "192.168.1.25";
      elements.ip.value = `${addressOnly}/${prefix}`;
      calculateAndRender();
    });
  });

  calculateAndRender();
})();
