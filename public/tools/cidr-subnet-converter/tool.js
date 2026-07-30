"use strict";

(() => {
  const ipInput = document.querySelector("#ip-input");
  const cidrInput = document.querySelector("#cidr-input");
  const subnetInput = document.querySelector("#subnet-input");
  const wildcardInput = document.querySelector("#wildcard-input");
  const clearButton = document.querySelector("#clear-button");
  const statusMessage = document.querySelector("#status-message");
  const resultsSection = document.querySelector("#results-section");

  const resultElements = {
    network: document.querySelector("#network-result"),
    broadcast: document.querySelector("#broadcast-result"),
    first: document.querySelector("#first-result"),
    last: document.querySelector("#last-result"),
    total: document.querySelector("#total-result"),
    usable: document.querySelector("#usable-result")
  };

  let updating = false;

  function parseIPv4(value) {
    const parts = value.trim().split(".");
    if (parts.length !== 4) return null;

    const octets = parts.map((part) => {
      if (!/^\d{1,3}$/.test(part)) return null;
      const number = Number(part);
      return number >= 0 && number <= 255 ? number : null;
    });

    if (octets.some((part) => part === null)) return null;
    return octets;
  }

  function octetsToUint32(octets) {
    return (
      ((octets[0] << 24) >>> 0) |
      (octets[1] << 16) |
      (octets[2] << 8) |
      octets[3]
    ) >>> 0;
  }

  function uint32ToIPv4(value) {
    return [
      (value >>> 24) & 255,
      (value >>> 16) & 255,
      (value >>> 8) & 255,
      value & 255
    ].join(".");
  }

  function prefixToMask(prefix) {
    if (prefix === 0) return 0;
    return (0xffffffff << (32 - prefix)) >>> 0;
  }

  function maskToPrefix(mask) {
    const binary = mask.toString(2).padStart(32, "0");
    if (!/^1*0*$/.test(binary)) return null;
    return binary.indexOf("0") === -1 ? 32 : binary.indexOf("0");
  }

  function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
  }

  function clearResults() {
    resultsSection.hidden = true;
    Object.values(resultElements).forEach((element) => {
      element.textContent = "—";
    });
  }

  function renderNetworkDetails(prefix) {
    const ip = parseIPv4(ipInput.value);
    if (!ipInput.value.trim()) {
      clearResults();
      return;
    }

    if (!ip) {
      clearResults();
      setStatus("Enter a valid IPv4 address.", true);
      return;
    }

    const ipValue = octetsToUint32(ip);
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ipValue & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const total = 2 ** (32 - prefix);

    let first = network;
    let last = broadcast;
    let usable = total;

    if (prefix <= 30) {
      first = (network + 1) >>> 0;
      last = (broadcast - 1) >>> 0;
      usable = Math.max(total - 2, 0);
    }

    resultElements.network.textContent = uint32ToIPv4(network);
    resultElements.broadcast.textContent = uint32ToIPv4(broadcast);
    resultElements.first.textContent = uint32ToIPv4(first);
    resultElements.last.textContent = uint32ToIPv4(last);
    resultElements.total.textContent = total.toLocaleString("en-US");
    resultElements.usable.textContent = usable.toLocaleString("en-US");
    resultsSection.hidden = false;
  }

  function applyPrefix(prefix, source) {
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      clearResults();
      setStatus("CIDR prefix must be a whole number from 0 to 32.", true);
      return;
    }

    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;

    updating = true;

    if (source !== "cidr") cidrInput.value = String(prefix);
    if (source !== "subnet") subnetInput.value = uint32ToIPv4(mask);
    if (source !== "wildcard") wildcardInput.value = uint32ToIPv4(wildcard);

    updating = false;

    setStatus("Values converted automatically.");
    renderNetworkDetails(prefix);
  }

  function handleCIDR() {
    if (updating) return;
    const value = cidrInput.value.trim();

    if (!value) {
      subnetInput.value = "";
      wildcardInput.value = "";
      clearResults();
      setStatus("");
      return;
    }

    applyPrefix(Number(value), "cidr");
  }

  function handleSubnet() {
    if (updating) return;
    const value = subnetInput.value.trim();

    if (!value) {
      cidrInput.value = "";
      wildcardInput.value = "";
      clearResults();
      setStatus("");
      return;
    }

    const octets = parseIPv4(value);
    if (!octets) {
      clearResults();
      setStatus("Enter a valid IPv4 subnet mask.", true);
      return;
    }

    const prefix = maskToPrefix(octetsToUint32(octets));
    if (prefix === null) {
      clearResults();
      setStatus("Subnet masks must contain contiguous 1 bits followed by contiguous 0 bits.", true);
      return;
    }

    applyPrefix(prefix, "subnet");
  }

  function handleWildcard() {
    if (updating) return;
    const value = wildcardInput.value.trim();

    if (!value) {
      cidrInput.value = "";
      subnetInput.value = "";
      clearResults();
      setStatus("");
      return;
    }

    const octets = parseIPv4(value);
    if (!octets) {
      clearResults();
      setStatus("Enter a valid IPv4 wildcard mask.", true);
      return;
    }

    const wildcard = octetsToUint32(octets);
    const mask = (~wildcard) >>> 0;
    const prefix = maskToPrefix(mask);

    if (prefix === null) {
      clearResults();
      setStatus("Wildcard masks must be the exact inverse of a valid contiguous subnet mask.", true);
      return;
    }

    applyPrefix(prefix, "wildcard");
  }

  function handleIP() {
    const prefix = Number(cidrInput.value);
    if (Number.isInteger(prefix) && prefix >= 0 && prefix <= 32) {
      renderNetworkDetails(prefix);
      if (ipInput.value.trim() && parseIPv4(ipInput.value)) {
        setStatus("Values converted automatically.");
      }
    } else {
      clearResults();
    }
  }

  cidrInput.addEventListener("input", handleCIDR);
  subnetInput.addEventListener("input", handleSubnet);
  wildcardInput.addEventListener("input", handleWildcard);
  ipInput.addEventListener("input", handleIP);

  clearButton.addEventListener("click", () => {
    updating = true;
    ipInput.value = "";
    cidrInput.value = "";
    subnetInput.value = "";
    wildcardInput.value = "";
    updating = false;
    clearResults();
    setStatus("");
    ipInput.focus();
  });
})();
