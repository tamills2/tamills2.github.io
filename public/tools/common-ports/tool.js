"use strict";

(() => {
  const ports = [
    {port:"20",protocols:["TCP"],service:"FTP Data",category:"File Transfer",security:"insecure",description:"Traditional FTP data channel, commonly used with active-mode FTP.",software:"vsftpd, ProFTPD, FileZilla Server",related:[21]},
    {port:"21",protocols:["TCP"],service:"FTP Control",category:"File Transfer",security:"insecure",description:"Traditional FTP command and control channel.",software:"vsftpd, ProFTPD, FileZilla Server",related:[20,989,990]},
    {port:"22",protocols:["TCP"],service:"SSH",category:"Remote Access",security:"secure",description:"Encrypted remote shell, command execution, tunneling, SCP, and SFTP.",software:"OpenSSH, Dropbear, Bitvise",related:[23]},
    {port:"23",protocols:["TCP"],service:"Telnet",category:"Remote Access",security:"insecure",description:"Legacy plaintext remote terminal service.",software:"telnetd, network device consoles",related:[22]},
    {port:"25",protocols:["TCP"],service:"SMTP",category:"Email",security:"neutral",description:"Server-to-server mail transfer; encryption may be added with STARTTLS.",software:"Postfix, Exim, Microsoft Exchange",related:[465,587]},
    {port:"53",protocols:["TCP","UDP"],service:"DNS",category:"Name Resolution",security:"neutral",description:"Domain name lookups over UDP and larger responses, transfers, or fallback over TCP.",software:"BIND, Unbound, dnsmasq, Windows DNS",related:[853]},
    {port:"67",protocols:["UDP"],service:"DHCP Server",category:"Addressing",security:"neutral",description:"Server side of DHCPv4 address assignment.",software:"ISC Kea, dnsmasq, Windows DHCP",related:[68]},
    {port:"68",protocols:["UDP"],service:"DHCP Client",category:"Addressing",security:"neutral",description:"Client side of DHCPv4 address assignment.",software:"dhclient, NetworkManager, Windows DHCP Client",related:[67]},
    {port:"69",protocols:["UDP"],service:"TFTP",category:"File Transfer",security:"insecure",description:"Simple unauthenticated file transfer, often used for network boot or device firmware.",software:"tftpd-hpa, atftpd, PXE environments",related:[4011]},
    {port:"80",protocols:["TCP"],service:"HTTP",category:"Web",security:"insecure",description:"Unencrypted web traffic and HTTP redirects.",software:"Apache, Nginx, IIS, Caddy",related:[443,8080,8000]},
    {port:"88",protocols:["TCP","UDP"],service:"Kerberos",category:"Authentication",security:"secure",description:"Kerberos authentication and ticket exchange.",software:"Active Directory, MIT Kerberos, Heimdal",related:[464,749]},
    {port:"110",protocols:["TCP"],service:"POP3",category:"Email",security:"insecure",description:"Legacy plaintext mail retrieval protocol.",software:"Dovecot, Courier, Exchange",related:[995,143,993]},
    {port:"111",protocols:["TCP","UDP"],service:"RPCbind",category:"Network Services",security:"neutral",description:"Maps ONC RPC services to network ports; commonly associated with NFS.",software:"rpcbind, portmap",related:[2049]},
    {port:"119",protocols:["TCP"],service:"NNTP",category:"Messaging",security:"insecure",description:"Network News Transfer Protocol for Usenet.",software:"INN, Leafnode",related:[563]},
    {port:"123",protocols:["UDP"],service:"NTP",category:"Time",security:"neutral",description:"Network Time Protocol clock synchronization.",software:"chrony, ntpd, Windows Time",related:[4460]},
    {port:"135",protocols:["TCP","UDP"],service:"MS RPC Endpoint Mapper",category:"Microsoft",security:"neutral",description:"Microsoft RPC endpoint mapping used by many Windows services.",software:"Windows RPC",related:[139,445]},
    {port:"137",protocols:["UDP"],service:"NetBIOS Name Service",category:"Microsoft",security:"insecure",description:"Legacy NetBIOS name registration and lookup.",software:"Windows networking, Samba",related:[138,139,445]},
    {port:"138",protocols:["UDP"],service:"NetBIOS Datagram",category:"Microsoft",security:"insecure",description:"Legacy NetBIOS datagram service.",software:"Windows networking, Samba",related:[137,139,445]},
    {port:"139",protocols:["TCP"],service:"NetBIOS Session",category:"Microsoft",security:"insecure",description:"Legacy SMB file and printer sharing over NetBIOS.",software:"Windows networking, Samba",related:[137,138,445]},
    {port:"143",protocols:["TCP"],service:"IMAP",category:"Email",security:"neutral",description:"Mailbox synchronization; encryption is commonly negotiated with STARTTLS.",software:"Dovecot, Courier, Exchange",related:[993,110,995]},
    {port:"161",protocols:["UDP"],service:"SNMP",category:"Monitoring",security:"neutral",description:"Network monitoring and management queries. SNMPv3 can provide authentication and encryption.",software:"Net-SNMP, network appliances",related:[162]},
    {port:"162",protocols:["UDP"],service:"SNMP Trap",category:"Monitoring",security:"neutral",description:"Asynchronous SNMP notifications from managed devices.",software:"Net-SNMP, monitoring platforms",related:[161]},
    {port:"179",protocols:["TCP"],service:"BGP",category:"Routing",security:"neutral",description:"Border Gateway Protocol routing sessions between autonomous systems.",software:"FRRouting, BIRD, Cisco IOS, Junos",related:[]},
    {port:"194",protocols:["TCP"],service:"IRC",category:"Messaging",security:"insecure",description:"Traditional Internet Relay Chat service.",software:"InspIRCd, UnrealIRCd",related:[6697]},
    {port:"389",protocols:["TCP","UDP"],service:"LDAP",category:"Directory Services",security:"neutral",description:"Directory queries and authentication; TLS may be negotiated with STARTTLS.",software:"OpenLDAP, Active Directory",related:[636,3268,3269]},
    {port:"427",protocols:["TCP","UDP"],service:"SLP",category:"Discovery",security:"neutral",description:"Service Location Protocol discovery.",software:"OpenSLP, printers, enterprise appliances",related:[]},
    {port:"443",protocols:["TCP","UDP"],service:"HTTPS",category:"Web",security:"secure",description:"HTTP protected with TLS. UDP is commonly used by HTTP/3 over QUIC.",software:"Apache, Nginx, IIS, Caddy",related:[80,8443,9443]},
    {port:"445",protocols:["TCP"],service:"SMB",category:"Microsoft",security:"neutral",description:"Windows file sharing, printer sharing, named pipes, and domain operations.",software:"Windows Server, Samba",related:[137,138,139]},
    {port:"464",protocols:["TCP","UDP"],service:"Kerberos Password Change",category:"Authentication",security:"secure",description:"Kerberos password change service.",software:"Active Directory, MIT Kerberos",related:[88]},
    {port:"465",protocols:["TCP"],service:"SMTPS",category:"Email",security:"secure",description:"SMTP submission using implicit TLS.",software:"Postfix, Exim, Exchange",related:[25,587]},
    {port:"500",protocols:["UDP"],service:"IKE / ISAKMP",category:"VPN",security:"secure",description:"Internet Key Exchange for IPsec VPN negotiation.",software:"strongSwan, libreswan, VPN gateways",related:[4500]},
    {port:"514",protocols:["UDP"],service:"Syslog",category:"Logging",security:"insecure",description:"Traditional plaintext syslog transport.",software:"rsyslog, syslog-ng, network appliances",related:[6514]},
    {port:"515",protocols:["TCP"],service:"LPD / LPR",category:"Printing",security:"insecure",description:"Line Printer Daemon protocol for print jobs.",software:"CUPS, printer servers",related:[631,9100]},
    {port:"520",protocols:["UDP"],service:"RIP",category:"Routing",security:"neutral",description:"Routing Information Protocol version 1 and 2 updates.",software:"FRRouting, routers",related:[521]},
    {port:"546",protocols:["UDP"],service:"DHCPv6 Client",category:"Addressing",security:"neutral",description:"Client side of DHCP for IPv6.",software:"NetworkManager, systemd-networkd, Windows",related:[547]},
    {port:"547",protocols:["UDP"],service:"DHCPv6 Server",category:"Addressing",security:"neutral",description:"Server and relay side of DHCP for IPv6.",software:"ISC Kea, Windows DHCP",related:[546]},
    {port:"554",protocols:["TCP","UDP"],service:"RTSP",category:"Streaming",security:"neutral",description:"Control protocol for streaming media sessions.",software:"VLC, IP cameras, media servers",related:[]},
    {port:"563",protocols:["TCP"],service:"NNTPS",category:"Messaging",security:"secure",description:"NNTP protected with implicit TLS.",software:"INN, Usenet providers",related:[119]},
    {port:"587",protocols:["TCP"],service:"SMTP Submission",category:"Email",security:"secure",description:"Authenticated client mail submission, normally protected with STARTTLS.",software:"Postfix, Exim, Exchange",related:[25,465]},
    {port:"631",protocols:["TCP","UDP"],service:"IPP / CUPS",category:"Printing",security:"neutral",description:"Internet Printing Protocol and CUPS administration/discovery.",software:"CUPS, network printers",related:[515,9100]},
    {port:"636",protocols:["TCP"],service:"LDAPS",category:"Directory Services",security:"secure",description:"LDAP protected with implicit TLS.",software:"OpenLDAP, Active Directory",related:[389,3269]},
    {port:"749",protocols:["TCP","UDP"],service:"Kerberos Administration",category:"Authentication",security:"secure",description:"Kerberos administration service.",software:"MIT Kerberos",related:[88,464]},
    {port:"853",protocols:["TCP"],service:"DNS over TLS",category:"Name Resolution",security:"secure",description:"Encrypted DNS queries over TLS.",software:"Unbound, BIND, stubby",related:[53]},
    {port:"873",protocols:["TCP"],service:"rsync",category:"File Transfer",security:"neutral",description:"rsync daemon file synchronization protocol.",software:"rsync",related:[22]},
    {port:"989",protocols:["TCP"],service:"FTPS Data",category:"File Transfer",security:"secure",description:"FTP data channel protected with implicit TLS.",software:"FTPS servers",related:[21,990]},
    {port:"990",protocols:["TCP"],service:"FTPS Control",category:"File Transfer",security:"secure",description:"FTP control channel protected with implicit TLS.",software:"FTPS servers",related:[21,989]},
    {port:"993",protocols:["TCP"],service:"IMAPS",category:"Email",security:"secure",description:"IMAP protected with implicit TLS.",software:"Dovecot, Courier, Exchange",related:[143]},
    {port:"995",protocols:["TCP"],service:"POP3S",category:"Email",security:"secure",description:"POP3 protected with implicit TLS.",software:"Dovecot, Courier, Exchange",related:[110]},
    {port:"1080",protocols:["TCP"],service:"SOCKS Proxy",category:"Proxy",security:"neutral",description:"SOCKS proxy traffic, commonly SOCKS5.",software:"Dante, SSH dynamic forwarding",related:[3128,8080]},
    {port:"1194",protocols:["TCP","UDP"],service:"OpenVPN",category:"VPN",security:"secure",description:"Common default port for OpenVPN tunnels.",software:"OpenVPN",related:[500,4500,51820]},
    {port:"1433",protocols:["TCP"],service:"Microsoft SQL Server",category:"Database",security:"neutral",description:"Default Microsoft SQL Server database connection port.",software:"Microsoft SQL Server",related:[1434]},
    {port:"1434",protocols:["UDP"],service:"SQL Server Browser",category:"Database",security:"neutral",description:"Discovers Microsoft SQL Server named instances and ports.",software:"Microsoft SQL Server Browser",related:[1433]},
    {port:"1521",protocols:["TCP"],service:"Oracle Database",category:"Database",security:"neutral",description:"Common Oracle Net Listener database port.",software:"Oracle Database",related:[2484]},
    {port:"1701",protocols:["UDP"],service:"L2TP",category:"VPN",security:"neutral",description:"Layer 2 Tunneling Protocol, typically combined with IPsec for security.",software:"xl2tpd, VPN gateways",related:[500,4500]},
    {port:"1812",protocols:["UDP"],service:"RADIUS Authentication",category:"Authentication",security:"neutral",description:"RADIUS authentication and authorization requests.",software:"FreeRADIUS, network access servers",related:[1813]},
    {port:"1813",protocols:["UDP"],service:"RADIUS Accounting",category:"Authentication",security:"neutral",description:"RADIUS accounting records.",software:"FreeRADIUS, network access servers",related:[1812]},
    {port:"1883",protocols:["TCP"],service:"MQTT",category:"IoT",security:"insecure",description:"MQTT messaging without TLS.",software:"Mosquitto, EMQX, HiveMQ",related:[8883]},
    {port:"1900",protocols:["UDP"],service:"SSDP / UPnP",category:"Discovery",security:"neutral",description:"Simple Service Discovery Protocol used by UPnP devices.",software:"Smart TVs, routers, media devices",related:[]},
    {port:"2049",protocols:["TCP","UDP"],service:"NFS",category:"File Sharing",security:"neutral",description:"Network File System file sharing.",software:"Linux kernel NFS, NAS appliances",related:[111]},
    {port:"2375",protocols:["TCP"],service:"Docker API",category:"Containers",security:"insecure",description:"Unencrypted Docker Engine remote API; exposure is highly risky.",software:"Docker Engine",related:[2376]},
    {port:"2376",protocols:["TCP"],service:"Docker API TLS",category:"Containers",security:"secure",description:"Docker Engine remote API protected with TLS.",software:"Docker Engine",related:[2375]},
    {port:"2377",protocols:["TCP"],service:"Docker Swarm Management",category:"Containers",security:"secure",description:"Docker Swarm cluster management traffic.",software:"Docker Swarm",related:[7946,4789]},
    {port:"2484",protocols:["TCP"],service:"Oracle TCPS",category:"Database",security:"secure",description:"Oracle database connections protected with TLS.",software:"Oracle Database",related:[1521]},
    {port:"3000",protocols:["TCP"],service:"Development Web App",category:"Web",security:"neutral",description:"Common development server port used by web frameworks and dashboards.",software:"Node.js apps, Grafana, React dev servers",related:[8000,8080]},
    {port:"3128",protocols:["TCP"],service:"HTTP Proxy",category:"Proxy",security:"neutral",description:"Common caching HTTP proxy port.",software:"Squid Proxy",related:[8080,1080]},
    {port:"3260",protocols:["TCP"],service:"iSCSI",category:"Storage",security:"neutral",description:"Internet Small Computer Systems Interface block storage traffic.",software:"Linux LIO, SAN appliances",related:[]},
    {port:"3268",protocols:["TCP"],service:"LDAP Global Catalog",category:"Directory Services",security:"neutral",description:"Active Directory Global Catalog queries.",software:"Active Directory",related:[389,3269]},
    {port:"3269",protocols:["TCP"],service:"LDAPS Global Catalog",category:"Directory Services",security:"secure",description:"Active Directory Global Catalog over TLS.",software:"Active Directory",related:[636,3268]},
    {port:"3306",protocols:["TCP"],service:"MySQL / MariaDB",category:"Database",security:"neutral",description:"Default MySQL-compatible database connection port.",software:"MySQL, MariaDB, Percona Server",related:[]},
    {port:"3389",protocols:["TCP","UDP"],service:"RDP",category:"Remote Access",security:"secure",description:"Microsoft Remote Desktop Protocol.",software:"Windows Remote Desktop Services, xrdp",related:[22,5900]},
    {port:"3478",protocols:["TCP","UDP"],service:"STUN / TURN",category:"VoIP",security:"neutral",description:"NAT traversal for real-time communications.",software:"coturn, WebRTC platforms",related:[5349]},
    {port:"3690",protocols:["TCP"],service:"Subversion",category:"Version Control",security:"insecure",description:"Native Subversion repository protocol.",software:"Apache Subversion",related:[22,443]},
    {port:"4369",protocols:["TCP"],service:"Erlang Port Mapper",category:"Messaging",security:"neutral",description:"Erlang Port Mapper Daemon used to discover distributed Erlang nodes.",software:"Erlang, RabbitMQ",related:[5672,25672]},
    {port:"4500",protocols:["UDP"],service:"IPsec NAT-T",category:"VPN",security:"secure",description:"IPsec NAT traversal encapsulation.",software:"strongSwan, libreswan, VPN gateways",related:[500]},
    {port:"4789",protocols:["UDP"],service:"VXLAN",category:"Virtualization",security:"neutral",description:"Virtual Extensible LAN overlay network traffic.",software:"Open vSwitch, VMware NSX, Linux VXLAN",related:[2377,7946]},
    {port:"5000",protocols:["TCP"],service:"Development Web App",category:"Web",security:"neutral",description:"Common application development port and Docker Registry default.",software:"Flask, Docker Registry, miscellaneous apps",related:[3000,8000,8080]},
    {port:"5060",protocols:["TCP","UDP"],service:"SIP",category:"VoIP",security:"insecure",description:"Session Initiation Protocol signaling without TLS.",software:"Asterisk, FreeSWITCH, IP phones",related:[5061]},
    {port:"5061",protocols:["TCP"],service:"SIPS",category:"VoIP",security:"secure",description:"SIP signaling protected with TLS.",software:"Asterisk, FreeSWITCH, IP phones",related:[5060]},
    {port:"51820",protocols:["UDP"],service:"WireGuard",category:"VPN",security:"secure",description:"Common default listening port for WireGuard VPN tunnels.",software:"WireGuard",related:[1194,500,4500]},
    {port:"5349",protocols:["TCP","UDP"],service:"TURN over TLS",category:"VoIP",security:"secure",description:"Encrypted TURN relay service for real-time communications.",software:"coturn, WebRTC platforms",related:[3478]},
    {port:"5432",protocols:["TCP"],service:"PostgreSQL",category:"Database",security:"neutral",description:"Default PostgreSQL database connection port.",software:"PostgreSQL",related:[]},
    {port:"5672",protocols:["TCP"],service:"AMQP",category:"Messaging",security:"neutral",description:"Advanced Message Queuing Protocol, commonly RabbitMQ without implicit TLS.",software:"RabbitMQ, Apache Qpid",related:[5671,15672]},
    {port:"5671",protocols:["TCP"],service:"AMQPS",category:"Messaging",security:"secure",description:"AMQP protected with TLS.",software:"RabbitMQ, Apache Qpid",related:[5672]},
    {port:"5900",protocols:["TCP"],service:"VNC",category:"Remote Access",security:"neutral",description:"Virtual Network Computing remote desktop; encryption depends on implementation.",software:"TigerVNC, RealVNC, TightVNC",related:[3389]},
    {port:"5985",protocols:["TCP"],service:"WinRM HTTP",category:"Microsoft",security:"neutral",description:"Windows Remote Management over HTTP, commonly using message-level encryption in domain environments.",software:"Windows Remote Management, PowerShell Remoting",related:[5986]},
    {port:"5986",protocols:["TCP"],service:"WinRM HTTPS",category:"Microsoft",security:"secure",description:"Windows Remote Management protected with TLS.",software:"Windows Remote Management, PowerShell Remoting",related:[5985]},
    {port:"6379",protocols:["TCP"],service:"Redis",category:"Database",security:"neutral",description:"Default Redis data store port. Access should normally be restricted.",software:"Redis",related:[]},
    {port:"6443",protocols:["TCP"],service:"Kubernetes API",category:"Containers",security:"secure",description:"Kubernetes API server HTTPS endpoint.",software:"Kubernetes",related:[10250]},
    {port:"6514",protocols:["TCP"],service:"Syslog over TLS",category:"Logging",security:"secure",description:"Syslog transport protected with TLS.",software:"rsyslog, syslog-ng, SIEM platforms",related:[514]},
    {port:"6697",protocols:["TCP"],service:"IRCS",category:"Messaging",security:"secure",description:"IRC protected with TLS.",software:"InspIRCd, UnrealIRCd",related:[194]},
    {port:"7946",protocols:["TCP","UDP"],service:"Docker Swarm Discovery",category:"Containers",security:"secure",description:"Docker Swarm node communication and discovery.",software:"Docker Swarm",related:[2377,4789]},
    {port:"8000",protocols:["TCP"],service:"HTTP Alternate",category:"Web",security:"neutral",description:"Common alternate and development HTTP port.",software:"Python http.server, Django, application servers",related:[80,8080]},
    {port:"8080",protocols:["TCP"],service:"HTTP Alternate / Proxy",category:"Web",security:"neutral",description:"Common alternate web server, application server, and proxy port.",software:"Tomcat, Jenkins, proxy servers",related:[80,8000,8443]},
    {port:"8443",protocols:["TCP"],service:"HTTPS Alternate",category:"Web",security:"secure",description:"Common alternate HTTPS and application administration port.",software:"Tomcat, Kubernetes dashboards, appliances",related:[443,8080,9443]},
    {port:"8883",protocols:["TCP"],service:"MQTTS",category:"IoT",security:"secure",description:"MQTT messaging protected with TLS.",software:"Mosquitto, EMQX, HiveMQ",related:[1883]},
    {port:"9000",protocols:["TCP"],service:"Application / Storage Console",category:"Web",security:"neutral",description:"Common application service port used by several products.",software:"MinIO console, SonarQube, PHP-FPM variants",related:[9090]},
    {port:"9090",protocols:["TCP"],service:"Monitoring / Web Console",category:"Monitoring",security:"neutral",description:"Common monitoring, metrics, and administration web port.",software:"Prometheus, Cockpit proxy, application consoles",related:[3000,9100]},
    {port:"9100",protocols:["TCP"],service:"JetDirect / Node Exporter",category:"Monitoring",security:"neutral",description:"Raw network printing or, in monitoring environments, Prometheus Node Exporter.",software:"HP JetDirect, network printers, Node Exporter",related:[515,631,9090]},
    {port:"9200",protocols:["TCP"],service:"Elasticsearch HTTP",category:"Search",security:"neutral",description:"Elasticsearch REST API and HTTP interface.",software:"Elasticsearch, OpenSearch variants",related:[9300]},
    {port:"9300",protocols:["TCP"],service:"Elasticsearch Transport",category:"Search",security:"neutral",description:"Elasticsearch inter-node transport protocol.",software:"Elasticsearch",related:[9200]},
    {port:"9418",protocols:["TCP"],service:"Git Protocol",category:"Version Control",security:"insecure",description:"Native unauthenticated Git protocol.",software:"git daemon",related:[22,443]},
    {port:"9443",protocols:["TCP"],service:"HTTPS Alternate",category:"Web",security:"secure",description:"Another common alternate HTTPS or administration port.",software:"Application servers, security appliances",related:[443,8443]},
    {port:"10250",protocols:["TCP"],service:"Kubelet API",category:"Containers",security:"secure",description:"Kubernetes kubelet API endpoint.",software:"Kubernetes",related:[6443]},
    {port:"11211",protocols:["TCP","UDP"],service:"Memcached",category:"Database",security:"neutral",description:"Distributed memory caching service. UDP is often disabled for safety.",software:"Memcached",related:[]},
    {port:"15672",protocols:["TCP"],service:"RabbitMQ Management",category:"Messaging",security:"neutral",description:"RabbitMQ web management interface.",software:"RabbitMQ",related:[5672,5671]},
    {port:"25565",protocols:["TCP"],service:"Minecraft Java",category:"Gaming",security:"neutral",description:"Default Minecraft Java Edition server port.",software:"Minecraft Server, Paper, Spigot",related:[19132]},
    {port:"25672",protocols:["TCP"],service:"RabbitMQ Distribution",category:"Messaging",security:"secure",description:"RabbitMQ inter-node and CLI communication.",software:"RabbitMQ, Erlang distribution",related:[4369,5672]},
    {port:"27017",protocols:["TCP"],service:"MongoDB",category:"Database",security:"neutral",description:"Default MongoDB database connection port.",software:"MongoDB",related:[]},
    {port:"32400",protocols:["TCP"],service:"Plex Media Server",category:"Streaming",security:"neutral",description:"Plex Media Server web and streaming endpoint.",software:"Plex Media Server",related:[]},
    {port:"19132",protocols:["UDP"],service:"Minecraft Bedrock",category:"Gaming",security:"neutral",description:"Default Minecraft Bedrock Edition server port.",software:"Minecraft Bedrock Dedicated Server",related:[25565]},
    {port:"4011",protocols:["UDP"],service:"PXE ProxyDHCP",category:"Addressing",security:"neutral",description:"PXE boot server discovery and ProxyDHCP service.",software:"WDS, PXE boot systems",related:[67,68,69]}
  ].sort((a,b) => Number(a.port) - Number(b.port));

  const els = {
    search: document.querySelector("#port-search"), category: document.querySelector("#category-filter"), protocol: document.querySelector("#protocol-filter"),
    security: document.querySelector("#security-filter"), body: document.querySelector("#ports-body"), status: document.querySelector("#ports-status"),
    reset: document.querySelector("#reset-filters"), title: document.querySelector("#details-title"), description: document.querySelector("#details-description"),
    list: document.querySelector("#details-list"), detailPort: document.querySelector("#detail-port"), detailProtocol: document.querySelector("#detail-protocol"),
    detailCategory: document.querySelector("#detail-category"), detailSecurity: document.querySelector("#detail-security"), detailSoftware: document.querySelector("#detail-software"),
    relatedBlock: document.querySelector("#related-block"), relatedPorts: document.querySelector("#related-ports"), copySelected: document.querySelector("#copy-selected"),
    host: document.querySelector("#host-input"), commandPort: document.querySelector("#command-port"), commandGrid: document.querySelector("#command-grid")
  };

  let selected = null;

  const copyIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';

  async function copyText(text, button) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0";
        document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
      }
      const old = button.innerHTML; button.textContent = "Copied"; button.disabled = true;
      setTimeout(() => { button.innerHTML = old; button.disabled = false; }, 1100);
    } catch (error) { console.error(error); }
  }

  function securityLabel(value) {
    return value === "secure" ? "Secure / encrypted" : value === "insecure" ? "Plaintext / legacy" : "Depends on configuration";
  }

  function populateCategories() {
    [...new Set(ports.map(item => item.category))].sort().forEach(category => {
      const option = document.createElement("option"); option.value = category; option.textContent = category; els.category.append(option);
    });
  }

  function filteredPorts() {
    const query = els.search.value.trim().toLowerCase();
    return ports.filter(item => {
      const searchable = [item.port,item.service,item.category,item.description,item.software,item.protocols.join(" ")].join(" ").toLowerCase();
      const protocolMatch = els.protocol.value === "all" || (els.protocol.value === "BOTH" ? item.protocols.length > 1 : item.protocols.includes(els.protocol.value));
      return (!query || searchable.includes(query)) && (els.category.value === "all" || item.category === els.category.value) && protocolMatch && (els.security.value === "all" || item.security === els.security.value);
    });
  }

  function renderTable() {
    const matches = filteredPorts(); els.body.replaceChildren();
    if (!matches.length) {
      const row = document.createElement("tr"); row.className = "empty-row"; row.innerHTML = '<td colspan="6">No ports match the current filters.</td>'; els.body.append(row);
    } else matches.forEach(item => {
      const row = document.createElement("tr"); row.tabIndex = 0; row.dataset.port = item.port; row.classList.toggle("selected", selected?.port === item.port);
      row.innerHTML = `<td><span class="port-number">${item.port}</span></td><td><span class="protocol-badges">${item.protocols.map(p=>`<span class="protocol-badge">${p}</span>`).join("")}</span></td><td><span class="service-name">${item.service}</span><br><span class="security-badge ${item.security}">${securityLabel(item.security)}</span></td><td>${item.category}</td><td>${item.description}</td><td><button class="port-copy" type="button" aria-label="Copy ${item.service} port">${copyIcon}</button></td>`;
      row.addEventListener("click", event => { if (!event.target.closest(".port-copy")) selectPort(item); });
      row.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectPort(item); } });
      row.querySelector(".port-copy").addEventListener("click", event => { event.stopPropagation(); copyText(`${item.port}/${item.protocols.join("+")} — ${item.service}`, event.currentTarget); });
      els.body.append(row);
    });
    els.status.textContent = `${matches.length} of ${ports.length} common port entries shown.`;
  }

  function selectPort(item) {
    selected = item; els.title.textContent = item.service; els.description.textContent = item.description;
    els.detailPort.textContent = item.port; els.detailProtocol.textContent = item.protocols.join(" and "); els.detailCategory.textContent = item.category;
    els.detailSecurity.textContent = securityLabel(item.security); els.detailSoftware.textContent = item.software; els.list.hidden = false; els.copySelected.hidden = false;
    els.commandPort.value = item.port; renderCommands();
    const related = item.related.map(number => ports.find(p => Number(p.port) === Number(number))).filter(Boolean);
    els.relatedPorts.replaceChildren(); els.relatedBlock.hidden = !related.length;
    related.forEach(port => { const button = document.createElement("button"); button.type="button"; button.textContent=`${port.port} ${port.service}`; button.addEventListener("click",()=>{ selectPort(port); els.search.value=port.port; renderTable(); }); els.relatedPorts.append(button); });
    renderTable();
  }

  function renderCommands() {
    const host = els.host.value.trim() || "example.com"; const port = Math.min(65535, Math.max(1, Number(els.commandPort.value) || 443));
    const safeHost = host.replace(/[\r\n]/g, "");
    const commands = [
      ["Netcat", `nc -vz ${safeHost} ${port}`],
      ["Nmap", `nmap -p ${port} ${safeHost}`],
      ["PowerShell", `Test-NetConnection ${safeHost} -Port ${port}`],
      ["Windows netstat (local)", `netstat -ano | findstr :${port}`],
      ["Linux ss (local)", `ss -tulpn | grep ':${port}'`],
      ["Bash TCP check", `timeout 5 bash -c '</dev/tcp/${safeHost}/${port}' && echo open || echo closed`]
    ];
    els.commandGrid.replaceChildren();
    commands.forEach(([name,command]) => { const card=document.createElement("div"); card.className="command-output"; card.innerHTML=`<div><strong>${name}</strong><code>${command.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></div><button class="command-copy" type="button" aria-label="Copy ${name} command">${copyIcon}</button>`; card.querySelector("button").addEventListener("click",e=>copyText(command,e.currentTarget)); els.commandGrid.append(card); });
  }

  [els.search,els.category,els.protocol,els.security].forEach(control => control.addEventListener(control.tagName === "INPUT" ? "input" : "change", renderTable));
  els.reset.addEventListener("click",()=>{ els.search.value=""; els.category.value="all"; els.protocol.value="all"; els.security.value="all"; renderTable(); });
  document.querySelectorAll("[data-quick]").forEach(button => button.addEventListener("click",()=>{ els.search.value=button.dataset.quick; renderTable(); const item=ports.find(p=>p.port===button.dataset.quick); if(item) selectPort(item); }));
  [els.host,els.commandPort].forEach(input=>input.addEventListener("input",renderCommands));
  els.copySelected.addEventListener("click",event=>{ if(!selected)return; copyText(`${selected.service}\nPort: ${selected.port}\nProtocol: ${selected.protocols.join(" and ")}\nCategory: ${selected.category}\nSecurity: ${securityLabel(selected.security)}\nDescription: ${selected.description}\nTypical software: ${selected.software}`,event.currentTarget); });

  populateCategories(); renderTable(); renderCommands();
})();
