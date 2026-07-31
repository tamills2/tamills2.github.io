(() => {
  "use strict";

  const P = [
    {
      id: "ethernet", label: "Ethernet II", layer: "Data link", title: "Ethernet II Frame Header", size: "14 bytes",
      sample: "00 1C 42 7E 60 4A 00 25 96 FF FE 12 08 00",
      rows: [[
        f("dst", "Destination MAC", 0, 6, 16, "48 bits", "Identifies the receiving interface on the local network.", [["Example", "00 1C 42 7E 60 4A"]]),
        f("src", "Source MAC", 6, 6, 16, "48 bits", "Identifies the sending interface on the local network.", [["Example", "00 25 96 FF FE 12"]])
      ], [
        f("type", "EtherType", 12, 2, 32, "16 bits", "Identifies the payload protocol carried by the frame.", [["08 00", "IPv4"], ["08 06", "ARP"], ["86 DD", "IPv6"], ["81 00", "802.1Q VLAN"], ["88 CC", "LLDP"]])
      ]]
    },
    {
      id: "arp", label: "ARP", layer: "Data link / network", title: "ARP Message", size: "28 bytes (Ethernet/IPv4)",
      sample: "00 01 08 00 06 04 00 01 00 25 96 FF FE 12 C0 A8 01 0A 00 00 00 00 00 00 C0 A8 01 01",
      rows: [
        [f("htype", "Hardware Type", 0, 2, 16, "16 bits", "Network link-layer type.", [["00 01", "Ethernet"]]), f("ptype", "Protocol Type", 2, 2, 16, "16 bits", "Network-layer protocol whose address is being resolved.", [["08 00", "IPv4"]])],
        [f("hlen", "Hardware Length", 4, 1, 8, "8 bits", "Length of each hardware address in bytes.", [["06", "MAC address"]]), f("plen", "Protocol Length", 5, 1, 8, "8 bits", "Length of each protocol address in bytes.", [["04", "IPv4 address"]]), f("oper", "Operation", 6, 2, 16, "16 bits", "Specifies whether the message is a request or reply.", [["00 01", "Request"], ["00 02", "Reply"]])],
        [f("sha", "Sender Hardware Address", 8, 6, 32, "48 bits", "MAC address of the sender.", [])],
        [f("spa", "Sender Protocol Address", 14, 4, 32, "32 bits", "IPv4 address of the sender.", [])],
        [f("tha", "Target Hardware Address", 18, 6, 32, "48 bits", "MAC address of the target; zeroed in a typical request.", [])],
        [f("tpa", "Target Protocol Address", 24, 4, 32, "32 bits", "IPv4 address being queried or answered.", [])]
      ]
    },
    {
      id: "ipv4", label: "IPv4", layer: "Network", title: "IPv4 Header", size: "20–60 bytes",
      sample: "45 00 00 3C 1C 46 40 00 40 06 B1 E6 C0 A8 01 0A C0 A8 01 01",
      rows: [
        [f("version", "Version", 0, 1, 4, "4 bits", "IP version number. IPv4 uses binary 0100.", [["4", "IPv4"]], {bitStart:0, bitLength:4}), f("ihl", "IHL", 0, 1, 4, "4 bits", "Header length in 32-bit words. A value of 5 means 20 bytes.", [["5", "20-byte header"]], {bitStart:4, bitLength:4}), f("dscp", "DSCP", 1, 1, 6, "6 bits", "Differentiated Services Code Point for traffic classification.", [], {bitStart:0, bitLength:6}), f("ecn", "ECN", 1, 1, 2, "2 bits", "Explicit Congestion Notification state.", [["00", "Not ECN-capable"], ["11", "Congestion experienced"]], {bitStart:6, bitLength:2}), f("length", "Total Length", 2, 2, 16, "16 bits", "Entire IPv4 packet length in bytes, including header and payload.", [])],
        [f("ident", "Identification", 4, 2, 16, "16 bits", "Groups fragments that belong to the same original datagram.", []), f("flags", "Flags", 6, 1, 3, "3 bits", "Fragmentation-control bitmask.", [], {bitStart:0, bitLength:3, builder:"ipv4"}), f("frag", "Fragment Offset", 6, 2, 13, "13 bits", "Fragment position measured in 8-byte units.", [], {bitStart:3, bitLength:13})],
        [f("ttl", "TTL", 8, 1, 8, "8 bits", "Decremented by each router; the packet is discarded at zero.", [["40", "64"], ["80", "128"], ["FF", "255"]]), f("protocol", "Protocol", 9, 1, 8, "8 bits", "Identifies the next-layer payload.", [["01", "ICMP"], ["06", "TCP"], ["11", "UDP"], ["32", "ESP"], ["33", "AH"]]), f("checksum", "Header Checksum", 10, 2, 16, "16 bits", "One's-complement checksum covering the IPv4 header only.", [])],
        [f("src", "Source Address", 12, 4, 32, "32 bits", "IPv4 address of the sender.", [])],
        [f("dst", "Destination Address", 16, 4, 32, "32 bits", "IPv4 address of the receiver.", [])]
      ]
    },
    {
      id: "ipv6", label: "IPv6", layer: "Network", title: "IPv6 Base Header", size: "40 bytes",
      sample: "60 00 00 00 00 14 06 40 20 01 0D B8 00 00 00 00 00 00 00 00 00 00 00 01 20 01 0D B8 00 00 00 00 00 00 00 00 00 00 00 02",
      rows: [
        [f("version", "Version", 0, 1, 4, "4 bits", "IP version number. IPv6 uses binary 0110.", [["6", "IPv6"]], {bitStart:0, bitLength:4}), f("traffic", "Traffic Class", 0, 2, 8, "8 bits", "DSCP and ECN traffic handling information.", [], {bitStart:4, bitLength:8}), f("flow", "Flow Label", 1, 3, 20, "20 bits", "Labels packets belonging to the same traffic flow.", [], {bitStart:4, bitLength:20})],
        [f("payload", "Payload Length", 4, 2, 16, "16 bits", "Bytes following the 40-byte base header.", []), f("next", "Next Header", 6, 1, 8, "8 bits", "Identifies an extension header or upper-layer protocol.", [["00", "Hop-by-Hop Options"], ["06", "TCP"], ["11", "UDP"], ["2B", "Routing"], ["2C", "Fragment"], ["32", "ESP"], ["33", "AH"], ["3C", "Destination Options"], ["3A", "ICMPv6"]]), f("hop", "Hop Limit", 7, 1, 8, "8 bits", "Decremented by each router; equivalent to IPv4 TTL.", [])],
        [f("src", "Source Address", 8, 16, 32, "128 bits", "IPv6 address of the sender.", [])],
        [f("dst", "Destination Address", 24, 16, 32, "128 bits", "IPv6 address of the receiver.", [])]
      ]
    },
    {
      id: "icmp", label: "ICMP", layer: "Network control", title: "ICMPv4 Header", size: "8+ bytes",
      sample: "08 00 F7 FF 12 34 00 01",
      rows: [
        [f("type", "Type", 0, 1, 8, "8 bits", "Broad ICMP message category.", [["00", "Echo Reply"], ["03", "Destination Unreachable"], ["05", "Redirect"], ["08", "Echo Request"], ["0B", "Time Exceeded"], ["0C", "Parameter Problem"]]), f("code", "Code", 1, 1, 8, "8 bits", "Subcategory whose meaning depends on Type.", [["Type 3 / 00", "Network unreachable"], ["Type 3 / 01", "Host unreachable"], ["Type 3 / 03", "Port unreachable"]]), f("checksum", "Checksum", 2, 2, 16, "16 bits", "One's-complement checksum over the ICMP message.", [])],
        [f("rest", "Rest of Header", 4, 4, 32, "32 bits", "Type-specific data such as Echo Identifier and Sequence Number.", [["Echo", "Identifier (16 bits) + Sequence (16 bits)"]])]
      ]
    },
    {
      id: "tcp", label: "TCP", layer: "Transport", title: "TCP Header", size: "20–60 bytes",
      sample: "C3 50 01 BB 12 34 56 78 9A BC DE F0 50 12 FA F0 7C 2A 00 00",
      rows: [
        [f("src", "Source Port", 0, 2, 16, "16 bits", "Port used by the sending application.", [["00 16", "22 / SSH"], ["00 50", "80 / HTTP"], ["01 BB", "443 / HTTPS"]]), f("dst", "Destination Port", 2, 2, 16, "16 bits", "Port used by the receiving application.", [["00 35", "53 / DNS"], ["01 BB", "443 / HTTPS"]])],
        [f("seq", "Sequence Number", 4, 4, 32, "32 bits", "Sequence number of the first payload byte in this segment.", [])],
        [f("acknum", "Acknowledgment Number", 8, 4, 32, "32 bits", "Next sequence number expected when ACK is set.", [])],
        [f("offset", "Data Offset", 12, 1, 4, "4 bits", "TCP header length in 32-bit words.", [["5", "20-byte header"]], {bitStart:0, bitLength:4}), f("reserved", "Reserved", 12, 1, 3, "3 bits", "Reserved bits; normally zero.", [], {bitStart:4, bitLength:3}), f("ns", "NS", 12, 1, 1, "1 bit", "ECN nonce concealment protection flag.", [["0x100", "NS"]], {bitStart:7, bitLength:1}), f("flags", "Flags", 13, 1, 8, "8 bits", "TCP control flags. Select multiple flags to calculate the combined bitmask.", [], {builder:"tcp"}), f("window", "Window Size", 14, 2, 16, "16 bits", "Receive window advertised by the sender.", [])],
        [f("checksum", "Checksum", 16, 2, 16, "16 bits", "Checksum over the TCP pseudo-header, header, and payload.", []), f("urgent", "Urgent Pointer", 18, 2, 16, "16 bits", "Offset to the byte following urgent data when URG is set.", [])]
      ]
    },
    {
      id: "udp", label: "UDP", layer: "Transport", title: "UDP Header", size: "8 bytes",
      sample: "C3 50 00 35 00 20 8A 4C",
      rows: [
        [f("src", "Source Port", 0, 2, 16, "16 bits", "Port used by the sender; may be zero in IPv4.", []), f("dst", "Destination Port", 2, 2, 16, "16 bits", "Port used by the receiving application.", [["00 35", "53 / DNS"], ["00 43", "67 / DHCP server"], ["00 44", "68 / DHCP client"]])],
        [f("length", "Length", 4, 2, 16, "16 bits", "UDP header and payload length in bytes; minimum value is 8.", []), f("checksum", "Checksum", 6, 2, 16, "16 bits", "Checksum over the pseudo-header, UDP header, and payload.", [])]
      ]
    },
    {
      id: "dns", label: "DNS", layer: "Application", title: "DNS Message Header", size: "12 bytes",
      sample: "12 34 01 00 00 01 00 00 00 00 00 00",
      rows: [
        [f("id", "Transaction ID", 0, 2, 16, "16 bits", "Matches a response to its query.", []) , f("flags", "Flags", 2, 2, 16, "16 bits", "DNS control word with independent flags and multi-bit Opcode/RCODE fields.", [], {builder:"dns"})],
        [f("qd", "Questions", 4, 2, 16, "16 bits", "Number of entries in the Question section.", []), f("an", "Answers", 6, 2, 16, "16 bits", "Number of answer resource records.", [])],
        [f("ns", "Authority RRs", 8, 2, 16, "16 bits", "Number of authority resource records.", []), f("ar", "Additional RRs", 10, 2, 16, "16 bits", "Number of additional resource records.", [])]
      ]
    },
    {
      id: "dhcp", label: "DHCP", layer: "Application", title: "DHCP / BOOTP Fixed Header", size: "236+ bytes",
      sample: "01 01 06 00 39 03 F3 26 00 00 80 00 00 00 00 00 C0 A8 01 64 00 00 00 00 00 00 00 00 00 25 96 FF FE 12",
      rows: [
        [f("op", "Opcode", 0, 1, 8, "8 bits", "Message direction.", [["01", "BOOTREQUEST"], ["02", "BOOTREPLY"]]), f("htype", "Hardware Type", 1, 1, 8, "8 bits", "Link-layer type.", [["01", "Ethernet"]]), f("hlen", "Hardware Length", 2, 1, 8, "8 bits", "Hardware address length.", [["06", "MAC address"]]), f("hops", "Hops", 3, 1, 8, "8 bits", "Used by relay agents.", [])],
        [f("xid", "Transaction ID", 4, 4, 32, "32 bits", "Random value matching replies to requests.", [])],
        [f("secs", "Seconds", 8, 2, 16, "16 bits", "Seconds elapsed since address acquisition began.", []), f("flags", "Flags", 10, 2, 16, "16 bits", "The high bit requests a broadcast reply; remaining bits are reserved.", [["80 00", "Broadcast"], ["00 00", "Unicast permitted"]])],
        [f("ciaddr", "Client IP Address", 12, 4, 32, "32 bits", "Client address when already bound or renewing.", [])],
        [f("yiaddr", "Your IP Address", 16, 4, 32, "32 bits", "Address offered or assigned to the client.", [])],
        [f("siaddr", "Server IP Address", 20, 4, 32, "32 bits", "Next server address used in bootstrapping.", [])],
        [f("giaddr", "Relay Agent IP", 24, 4, 32, "32 bits", "Relay agent address used for routing replies.", [])],
        [f("chaddr", "Client Hardware Address", 28, 16, 32, "128 bits", "Client hardware address followed by padding.", [])]
      ]
    }
  ];

  function f(id, name, offset, length, span, bits, description, values, extra = {}) {
    return { id, name, offset, length, span, bits, description, values, ...extra };
  }

  const builders = {
    tcp: {
      width: 8,
      flags: [
        ["FIN", 0x01, "Finish; sender has no more data"], ["SYN", 0x02, "Synchronize sequence numbers"],
        ["RST", 0x04, "Reset the connection"], ["PSH", 0x08, "Push buffered data to the application"],
        ["ACK", 0x10, "Acknowledgment field is valid"], ["URG", 0x20, "Urgent pointer is valid"],
        ["ECE", 0x40, "ECN-Echo"], ["CWR", 0x80, "Congestion Window Reduced"]
      ],
      defaults: ["SYN", "ACK"],
      common: {2:"SYN", 16:"ACK", 17:"FIN + ACK", 18:"SYN + ACK", 20:"RST + ACK", 24:"PSH + ACK", 25:"FIN + PSH + ACK"}
    },
    ipv4: {
      width: 3,
      flags: [["Reserved", 0x4, "Reserved; must be zero"], ["DF", 0x2, "Don't Fragment"], ["MF", 0x1, "More Fragments follow"]],
      defaults: ["DF"], common: {0:"No flags", 1:"MF", 2:"DF"}
    },
    dns: {
      width: 16,
      flags: [["QR", 0x8000, "Query (0) or response (1)"], ["AA", 0x0400, "Authoritative Answer"], ["TC", 0x0200, "Truncated"], ["RD", 0x0100, "Recursion Desired"], ["RA", 0x0080, "Recursion Available"], ["AD", 0x0020, "Authentic Data"], ["CD", 0x0010, "Checking Disabled"]],
      defaults: ["RD"], common: {256:"Standard recursive query", 33024:"Standard recursive response"},
      note: "Opcode occupies bits 14–11 and RCODE occupies bits 3–0; this builder combines the independent one-bit flags only."
    }
  };

  const tabs = document.querySelector("#packet-tabs");
  const diagram = document.querySelector("#packet-diagram");
  const details = document.querySelector("#packet-details");
  const title = document.querySelector("#packet-title");
  const layer = document.querySelector("#packet-layer");
  const size = document.querySelector("#packet-size");
  if (!tabs || !diagram || !details || !title || !layer || !size) return;

  let active = P[0];
  let selected = null;
  const builderSelections = new Map();

  const esc = (v) => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const bytes = (packet) => packet.sample.split(/\s+/);

  function renderTabs() {
    tabs.innerHTML = P.map((p, i) => `<button class="packet-tab${p.id === active.id ? " is-active" : ""}" type="button" role="tab" aria-selected="${p.id === active.id}" tabindex="${p.id === active.id ? 0 : -1}" data-id="${p.id}">${p.label}</button>`).join("");
    tabs.querySelectorAll(".packet-tab").forEach((button, index) => {
      button.addEventListener("click", () => activate(button.dataset.id));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowLeft") next = (index - 1 + P.length) % P.length;
        if (event.key === "ArrowRight") next = (index + 1) % P.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = P.length - 1;
        activate(P[next].id, true);
      });
    });
  }

  function activate(id, focus = false) {
    active = P.find((p) => p.id === id) || P[0];
    selected = null;
    renderTabs();
    renderProtocol();
    if (focus) tabs.querySelector(`[data-id="${id}"]`)?.focus();
  }

  function renderProtocol() {
    title.textContent = active.title;
    layer.textContent = active.layer;
    size.textContent = active.size;
    diagram.innerHTML = active.rows.map((row) => `<div class="packet-row">${row.map((field) => `<button class="packet-field" type="button" data-field="${field.id}" style="grid-column: span ${field.span}" title="${esc(field.name)}"><span class="packet-field-name">${esc(field.name)}</span><span class="packet-field-width">${field.bits}</span></button>`).join("")}</div>`).join("");
    diagram.querySelectorAll(".packet-field").forEach((button) => button.addEventListener("click", () => selectField(button.dataset.field)));
    details.innerHTML = `<div class="details-empty">Select a field in the diagram to inspect its offset, bytes, and common values.</div>`;
  }

  function selectField(id) {
    selected = active.rows.flat().find((field) => field.id === id);
    diagram.querySelectorAll(".packet-field").forEach((button) => button.classList.toggle("is-selected", button.dataset.field === id));
    renderDetails();
  }

  function getHexValue(field) {
    const value = bytes(active).slice(field.offset, field.offset + field.length).join(" ");
    if (!field.bitLength) return value || "—";
    const byteValue = parseInt(bytes(active)[field.offset] || "0", 16);
    const shift = 8 - field.bitStart - field.bitLength;
    const mask = (1 << field.bitLength) - 1;
    return `0x${((byteValue >> shift) & mask).toString(16).toUpperCase()}`;
  }

  function renderDump(field) {
    return bytes(active).map((byte, index) => `<span class="hex-byte${index >= field.offset && index < field.offset + field.length ? " is-highlighted" : ""}">${byte}</span>`).join("");
  }

  function renderValues(values) {
    if (!values.length) return "";
    return `<div class="detail-section"><h3>Common values</h3><table class="value-table"><thead><tr><th>Hex / value</th><th>Meaning</th></tr></thead><tbody>${values.map(([value, meaning]) => `<tr><td><code>${esc(value)}</code></td><td>${esc(meaning)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderDetails() {
    const field = selected;
    if (!field) return;
    details.innerHTML = `<div class="detail-title-row"><h2>${esc(field.name)}</h2><span class="detail-badge">${field.bits}</span></div>
      <p class="detail-description">${esc(field.description)}</p>
      <div class="detail-meta"><div class="detail-meta-item"><span class="detail-meta-label">Byte offset</span><span class="detail-meta-value">${field.length === 1 ? field.offset : `${field.offset}–${field.offset + field.length - 1}`}</span></div><div class="detail-meta-item"><span class="detail-meta-label">Sample hex</span><span class="detail-meta-value">${esc(getHexValue(field))}</span></div></div>
      ${field.builder ? renderBuilder(field.builder) : ""}
      <div class="detail-section"><h3>Packet bytes</h3><div class="hex-dump">${renderDump(field)}</div></div>
      ${renderValues(field.values)}`;
    if (field.builder) bindBuilder(field.builder);
  }

  function initialSelection(type) {
    if (!builderSelections.has(type)) builderSelections.set(type, new Set(builders[type].defaults));
    return builderSelections.get(type);
  }

  function renderBuilder(type) {
    const b = builders[type];
    const chosen = initialSelection(type);
    const value = b.flags.reduce((sum, [name, mask]) => chosen.has(name) ? sum | mask : sum, 0);
    const digits = Math.ceil(b.width / 4);
    const hex = `0x${value.toString(16).toUpperCase().padStart(digits, "0")}`;
    const binary = value.toString(2).padStart(b.width, "0");
    const meaning = b.common[value] || (chosen.size ? [...chosen].join(" + ") : "No flags selected");
    return `<div class="detail-section flag-builder" data-builder="${type}"><h3>Interactive bitmask</h3><div class="flag-grid">${b.flags.map(([name, mask, desc]) => `<button class="flag-toggle${chosen.has(name) ? " is-active" : ""}" type="button" data-flag="${name}" title="${esc(desc)}"><strong>${name}</strong><span>0x${mask.toString(16).toUpperCase().padStart(digits, "0")}</span></button>`).join("")}</div><div class="flag-results"><div class="flag-result"><span>Hex</span><code>${hex}</code></div><div class="flag-result"><span>Decimal</span><code>${value}</code></div><div class="flag-result"><span>Binary</span><code>${binary}</code></div></div><p class="flag-meaning">${esc(meaning)}</p>${b.note ? `<p class="flag-meaning">${esc(b.note)}</p>` : ""}</div>`;
  }

  function bindBuilder(type) {
    details.querySelectorAll(".flag-toggle").forEach((button) => button.addEventListener("click", () => {
      const chosen = initialSelection(type);
      const flag = button.dataset.flag;
      chosen.has(flag) ? chosen.delete(flag) : chosen.add(flag);
      renderDetails();
    }));
  }

  renderTabs();
  renderProtocol();
})();
