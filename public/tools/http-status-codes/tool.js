(() => {
  "use strict";

  const STATUS_CODES = [
    { code: 100, name: "Continue", common: false, description: "The client can continue sending the request body.", causes: ["A request used Expect: 100-continue before sending a large body."], actions: ["Continue transmitting the body.", "Check proxy handling if the upload stalls."], headers: ["Expect"], cache: "Not cacheable", reference: "RFC 9110 §15.2.1" },
    { code: 101, name: "Switching Protocols", common: true, description: "The server is switching to the protocol requested by the client.", causes: ["A successful HTTP Upgrade handshake, commonly for WebSocket."], actions: ["Confirm Upgrade and Connection headers match.", "Check that intermediaries support the protocol switch."], headers: ["Upgrade", "Connection"], cache: "Not cacheable", reference: "RFC 9110 §15.2.2" },
    { code: 102, name: "Processing", common: false, description: "The server has accepted the request and is still processing it.", causes: ["A long-running WebDAV operation has not completed."], actions: ["Keep the connection open.", "Check server processing time if the final response never arrives."], headers: [], cache: "Not cacheable", reference: "RFC 2518 §10.1" },
    { code: 103, name: "Early Hints", common: false, description: "The server is sending preliminary headers before the final response.", causes: ["The server is hinting that the client can preload linked resources."], actions: ["Process Link headers while waiting for the final response.", "Verify that clients and proxies tolerate informational responses."], headers: ["Link"], cache: "Not independently cacheable", reference: "RFC 8297" },

    { code: 200, name: "OK", common: true, description: "The request succeeded.", causes: ["A resource was retrieved or an operation completed successfully."], actions: ["Inspect the response body and headers for the requested result."], headers: ["Content-Type", "Content-Length", "ETag", "Last-Modified"], cache: "Cacheable unless method or response directives say otherwise", reference: "RFC 9110 §15.3.1" },
    { code: 201, name: "Created", common: true, description: "The request succeeded and created a new resource.", causes: ["A POST or PUT operation created one or more resources."], actions: ["Read Location or Content-Location for the new resource.", "Confirm the representation matches the created state."], headers: ["Location", "Content-Location"], cache: "Usually not heuristically cacheable", reference: "RFC 9110 §15.3.2" },
    { code: 202, name: "Accepted", common: true, description: "The request was accepted for processing but has not completed.", causes: ["The work was queued or delegated to an asynchronous process."], actions: ["Use the supplied status endpoint or job identifier.", "Poll or await a callback if the API defines one."], headers: ["Location", "Retry-After"], cache: "Cacheable only with explicit controls", reference: "RFC 9110 §15.3.3" },
    { code: 203, name: "Non-Authoritative Information", common: false, description: "A transforming intermediary supplied modified response metadata.", causes: ["A proxy changed metadata from the origin response."], actions: ["Compare the response through and around the intermediary.", "Inspect Warning or Via information where available."], headers: ["Via"], cache: "Heuristically cacheable", reference: "RFC 9110 §15.3.4" },
    { code: 204, name: "No Content", common: true, description: "The request succeeded and there is no response body.", causes: ["An update or delete succeeded without a representation to return."], actions: ["Do not attempt to parse a response body.", "Use response headers for updated metadata."], headers: ["ETag"], cache: "Heuristically cacheable", reference: "RFC 9110 §15.3.5" },
    { code: 205, name: "Reset Content", common: false, description: "The request succeeded and the client should reset its document view.", causes: ["A form submission completed and the user interface should clear."], actions: ["Reset the originating form or view.", "Do not expect a response body."], headers: [], cache: "Not cacheable", reference: "RFC 9110 §15.3.6" },
    { code: 206, name: "Partial Content", common: true, description: "The server returned the requested byte range or ranges.", causes: ["The client sent a valid Range request."], actions: ["Validate Content-Range against the requested range.", "Assemble multipart ranges when present."], headers: ["Content-Range", "Accept-Ranges", "ETag", "Last-Modified"], cache: "Cacheable with range-specific rules", reference: "RFC 9110 §15.3.7" },
    { code: 207, name: "Multi-Status", common: false, description: "The response contains separate status information for multiple resources.", causes: ["A WebDAV request affected several resources."], actions: ["Parse the multistatus XML body.", "Handle each resource result independently."], headers: ["Content-Type"], cache: "Cacheable only with explicit controls", reference: "RFC 4918 §11.1" },
    { code: 208, name: "Already Reported", common: false, description: "A WebDAV binding was already included earlier in the response.", causes: ["A DAV:propstat response encountered the same binding more than once."], actions: ["Use the earlier reported binding.", "Avoid processing the same resource twice."], headers: [], cache: "Cacheable only with explicit controls", reference: "RFC 5842 §7.1" },
    { code: 226, name: "IM Used", common: false, description: "The server returned a delta or other instance manipulation result.", causes: ["The request used A-IM and the server applied an instance manipulation."], actions: ["Apply the indicated delta or transformation.", "Check IM and Delta-Base headers."], headers: ["IM", "Delta-Base", "ETag"], cache: "Cacheable with validator requirements", reference: "RFC 3229 §10.4.1" },

    { code: 300, name: "Multiple Choices", common: false, description: "Several representations or destinations are available.", causes: ["The target has multiple possible resources or formats."], actions: ["Choose from the response representation or Location header.", "Set clearer content negotiation preferences."], headers: ["Location", "Vary"], cache: "Heuristically cacheable", reference: "RFC 9110 §15.4.1" },
    { code: 301, name: "Moved Permanently", common: true, description: "The resource has a new permanent URI.", causes: ["A route, domain, or resource was permanently relocated."], actions: ["Update stored links and client configuration.", "Check redirect chains and method rewriting behavior."], headers: ["Location"], cache: "Heuristically cacheable", reference: "RFC 9110 §15.4.2" },
    { code: 302, name: "Found", common: true, description: "The resource is temporarily available at another URI.", causes: ["A temporary redirect, login flow, or routing decision."], actions: ["Follow Location for this request.", "Use 307 when the original method must be preserved."], headers: ["Location"], cache: "Cacheable only with explicit controls", reference: "RFC 9110 §15.4.3" },
    { code: 303, name: "See Other", common: true, description: "Retrieve the result from another URI using GET or HEAD.", causes: ["A POST completed and the server is redirecting to a result page."], actions: ["Follow Location with GET unless using HEAD.", "Use this for POST-redirect-GET flows."], headers: ["Location"], cache: "Cacheable only with explicit controls", reference: "RFC 9110 §15.4.4" },
    { code: 304, name: "Not Modified", common: true, description: "A conditional GET or HEAD can reuse its cached representation.", causes: ["The supplied validator still matches the current resource."], actions: ["Reuse the cached body.", "Merge applicable response metadata into the stored response."], headers: ["ETag", "Last-Modified", "Cache-Control", "Vary"], cache: "Revalidates an existing cached response", reference: "RFC 9110 §15.4.5" },
    { code: 305, name: "Use Proxy", common: false, description: "The requested resource was historically meant to be accessed through a proxy.", causes: ["A legacy implementation emitted the deprecated status."], actions: ["Do not rely on this status in new systems.", "Configure proxies outside the response path."], headers: ["Location"], cache: "Not useful for modern caching", reference: "RFC 9110 §15.4.6" },
    { code: 306, name: "Unused", common: false, description: "The code is reserved and no longer used.", causes: ["A non-standard or obsolete implementation emitted 306."], actions: ["Treat it as an unknown 3xx response.", "Replace it with a defined redirect status."], headers: [], cache: "Undefined", reference: "RFC 9110 §15.4.7" },
    { code: 307, name: "Temporary Redirect", common: true, description: "The resource is temporarily at another URI and the method must be preserved.", causes: ["Temporary routing while retaining the original request method and body."], actions: ["Repeat the request at Location with the same method.", "Check redirect loops."], headers: ["Location"], cache: "Cacheable only with explicit controls", reference: "RFC 9110 §15.4.8" },
    { code: 308, name: "Permanent Redirect", common: true, description: "The resource permanently moved and the method must be preserved.", causes: ["A permanent route or domain migration that must retain request semantics."], actions: ["Update links and client configuration.", "Repeat the request with the same method at Location."], headers: ["Location"], cache: "Heuristically cacheable", reference: "RFC 9110 §15.4.9" },

    { code: 400, name: "Bad Request", common: true, description: "The server cannot process the request because it is malformed or invalid.", causes: ["Invalid syntax, framing, parameters, or request routing."], actions: ["Inspect the request line, headers, body, and encoding.", "Validate payload structure and required fields."], headers: ["Content-Type"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.1" },
    { code: 401, name: "Unauthorized", common: true, description: "Authentication credentials are missing, invalid, or insufficiently accepted.", causes: ["Missing token, expired credentials, invalid signature, or unsupported scheme."], actions: ["Read WWW-Authenticate and authenticate with a supported scheme.", "Refresh expired credentials and verify scopes."], headers: ["WWW-Authenticate", "Authorization"], cache: "Cacheable only with authentication-aware controls", reference: "RFC 9110 §15.5.2" },
    { code: 402, name: "Payment Required", common: false, description: "Reserved for future use and sometimes used by payment-related APIs.", causes: ["An application assigned payment or quota semantics to the reserved code."], actions: ["Follow the API-specific response body and documentation.", "Do not assume uniform semantics across services."], headers: [], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.3" },
    { code: 403, name: "Forbidden", common: true, description: "The server understood the request but refuses to authorize it.", causes: ["Insufficient permissions, policy denial, blocked source, or disabled resource."], actions: ["Verify identity, role, ACL, and policy configuration.", "Check WAF, proxy, and filesystem permissions."], headers: [], cache: "Heuristically cacheable", reference: "RFC 9110 §15.5.4" },
    { code: 404, name: "Not Found", common: true, description: "The server cannot find the requested resource or is concealing its existence.", causes: ["Incorrect path, removed resource, route mismatch, or hidden authorization failure."], actions: ["Verify the URI, route, host, and case sensitivity.", "Check deployment paths and rewrite rules."], headers: [], cache: "Heuristically cacheable", reference: "RFC 9110 §15.5.5" },
    { code: 405, name: "Method Not Allowed", common: true, description: "The resource exists but does not support the request method.", causes: ["The route does not implement GET, POST, PUT, DELETE, or another method."], actions: ["Read Allow and use a supported method.", "Check framework routing and CORS preflight handling."], headers: ["Allow"], cache: "Heuristically cacheable", reference: "RFC 9110 §15.5.6" },
    { code: 406, name: "Not Acceptable", common: true, description: "The server cannot produce a representation acceptable to the client.", causes: ["Accept, Accept-Language, or Accept-Encoding excludes available variants."], actions: ["Relax or correct negotiation headers.", "Add a server representation matching the requested format."], headers: ["Accept", "Accept-Language", "Accept-Encoding", "Vary"], cache: "Cacheable only with explicit controls", reference: "RFC 9110 §15.5.7" },
    { code: 407, name: "Proxy Authentication Required", common: false, description: "The client must authenticate with the outbound proxy.", causes: ["Proxy credentials are missing or rejected."], actions: ["Read Proxy-Authenticate and send Proxy-Authorization.", "Check enterprise proxy configuration."], headers: ["Proxy-Authenticate", "Proxy-Authorization"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.8" },
    { code: 408, name: "Request Timeout", common: true, description: "The server timed out waiting for the complete request.", causes: ["Slow upload, idle connection, network loss, or aggressive server timeout."], actions: ["Retry the request when safe.", "Check client upload speed and server timeout settings."], headers: ["Connection"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.9" },
    { code: 409, name: "Conflict", common: true, description: "The request conflicts with the current state of the resource.", causes: ["Version conflict, duplicate identifier, state transition conflict, or concurrent update."], actions: ["Fetch current state and reconcile changes.", "Use conditional requests or a different unique identifier."], headers: ["ETag", "If-Match"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.10" },
    { code: 410, name: "Gone", common: false, description: "The resource was intentionally removed and is expected to remain unavailable.", causes: ["A retired endpoint, expired resource, or permanent content removal."], actions: ["Remove stored links and stop retrying the URI.", "Use a replacement URI when one is provided."], headers: [], cache: "Heuristically cacheable", reference: "RFC 9110 §15.5.11" },
    { code: 411, name: "Length Required", common: false, description: "The server requires a defined Content-Length for the request.", causes: ["The client used an unsupported framing method or omitted the body length."], actions: ["Send Content-Length when the body size is known.", "Check proxy support for chunked transfer."], headers: ["Content-Length", "Transfer-Encoding"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.12" },
    { code: 412, name: "Precondition Failed", common: true, description: "One or more conditional request headers evaluated to false.", causes: ["ETag or modification-time preconditions no longer match."], actions: ["Retrieve the latest validators.", "Reapply the change against the current representation."], headers: ["If-Match", "If-None-Match", "If-Modified-Since", "If-Unmodified-Since"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.13" },
    { code: 413, name: "Content Too Large", common: true, description: "The request body exceeds a server or intermediary limit.", causes: ["Upload size, reverse-proxy limit, framework limit, or decompressed body limit."], actions: ["Reduce or split the payload.", "Adjust server and proxy body-size limits."], headers: ["Retry-After", "Content-Length"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.14" },
    { code: 414, name: "URI Too Long", common: true, description: "The request target exceeds a supported length.", causes: ["Large query string, redirect loop, or data incorrectly placed in the URI."], actions: ["Move data into a request body.", "Shorten parameters and check redirect construction."], headers: [], cache: "Heuristically cacheable", reference: "RFC 9110 §15.5.15" },
    { code: 415, name: "Unsupported Media Type", common: true, description: "The request content format or encoding is not supported.", causes: ["Incorrect Content-Type, unsupported charset, or unsupported Content-Encoding."], actions: ["Send a supported media type and encoding.", "Verify body serialization matches Content-Type."], headers: ["Content-Type", "Content-Encoding", "Accept"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.16" },
    { code: 416, name: "Range Not Satisfiable", common: false, description: "The requested range cannot be fulfilled for the selected representation.", causes: ["The byte offset is beyond the resource length or the range syntax is invalid."], actions: ["Read Content-Range for the current length.", "Restart or correct the range request."], headers: ["Range", "Content-Range"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.17" },
    { code: 417, name: "Expectation Failed", common: false, description: "The server cannot meet an expectation in the request.", causes: ["Expect: 100-continue or another expectation was rejected."], actions: ["Retry without the unsupported expectation.", "Check intermediary and origin support."], headers: ["Expect"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.18" },
    { code: 418, name: "Unused", common: false, description: "The code is reserved and not assigned HTTP semantics.", causes: ["An application intentionally emitted the well-known novelty code."], actions: ["Treat it as an application-specific 4xx response.", "Use a defined status for interoperable behavior."], headers: [], cache: "Undefined", reference: "RFC 9110 §15.5.19" },
    { code: 421, name: "Misdirected Request", common: false, description: "The server cannot produce a response for the target authority on this connection.", causes: ["A reused HTTP/2 or HTTP/3 connection reached the wrong virtual host."], actions: ["Retry on a new connection for the target origin.", "Check TLS certificates, SNI, and proxy connection coalescing."], headers: [], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.20" },
    { code: 422, name: "Unprocessable Content", common: true, description: "The request syntax is valid but its instructions cannot be processed.", causes: ["Semantic validation failure, invalid field values, or impossible operation."], actions: ["Inspect field-level validation details.", "Correct values without changing the media type or basic syntax."], headers: ["Content-Type"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.21" },
    { code: 423, name: "Locked", common: false, description: "The source or destination resource is locked.", causes: ["A WebDAV lock token is missing, expired, or belongs to another client."], actions: ["Supply the correct lock token.", "Wait for or remove the conflicting lock."], headers: ["If", "Lock-Token"], cache: "Not cacheable by default", reference: "RFC 4918 §11.3" },
    { code: 424, name: "Failed Dependency", common: false, description: "The request failed because an earlier dependent action failed.", causes: ["A WebDAV compound operation could not complete after another operation failed."], actions: ["Resolve the first failed operation.", "Retry the dependent sequence."], headers: [], cache: "Not cacheable by default", reference: "RFC 4918 §11.4" },
    { code: 425, name: "Too Early", common: false, description: "The server will not process a request that might be replayed.", causes: ["TLS early data was used for a non-idempotent or replay-sensitive request."], actions: ["Retry after the TLS handshake without early data.", "Allow early data only for replay-safe operations."], headers: ["Early-Data"], cache: "Not cacheable by default", reference: "RFC 8470 §5.2" },
    { code: 426, name: "Upgrade Required", common: false, description: "The server requires the client to switch to a different protocol.", causes: ["The endpoint requires TLS, HTTP/2, WebSocket, or another upgrade."], actions: ["Read Upgrade and reconnect using a supported protocol.", "Check gateway protocol configuration."], headers: ["Upgrade", "Connection"], cache: "Not cacheable by default", reference: "RFC 9110 §15.5.22" },
    { code: 428, name: "Precondition Required", common: false, description: "The server requires a conditional request to prevent lost updates.", causes: ["A state-changing request omitted If-Match or another required precondition."], actions: ["Fetch the current ETag.", "Retry with the required conditional header."], headers: ["If-Match", "ETag"], cache: "Must not be stored", reference: "RFC 6585 §3" },
    { code: 429, name: "Too Many Requests", common: true, description: "The client exceeded a request rate or quota.", causes: ["API rate limit, burst limit, login throttling, or shared-address quota."], actions: ["Honor Retry-After and use backoff.", "Reduce concurrency, cache results, or request a higher quota."], headers: ["Retry-After", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"], cache: "Must not be stored", reference: "RFC 6585 §4" },
    { code: 431, name: "Request Header Fields Too Large", common: false, description: "The request headers are too large individually or collectively.", causes: ["Oversized cookies, tokens, tracing headers, or proxy limits."], actions: ["Reduce cookies and header size.", "Increase header limits only when appropriate."], headers: ["Cookie", "Authorization"], cache: "Must not be stored", reference: "RFC 6585 §5" },
    { code: 451, name: "Unavailable For Legal Reasons", common: false, description: "Access is denied because of a legal demand or restriction.", causes: ["Court order, regulatory restriction, or legally required content block."], actions: ["Inspect the response representation and Link header.", "Use an authorized route or contact the responsible operator."], headers: ["Link"], cache: "Heuristically cacheable", reference: "RFC 7725" },

    { code: 500, name: "Internal Server Error", common: true, description: "The server encountered an unexpected condition.", causes: ["Unhandled exception, configuration error, dependency failure, or corrupted state."], actions: ["Check application and server logs using the request identifier.", "Reproduce the failing path and inspect recent changes."], headers: ["Retry-After", "Traceparent", "X-Request-ID"], cache: "Not cacheable by default", reference: "RFC 9110 §15.6.1" },
    { code: 501, name: "Not Implemented", common: false, description: "The server does not support the request method or required functionality.", causes: ["Unsupported method, protocol feature, or gateway capability."], actions: ["Use a supported method or endpoint.", "Upgrade or reconfigure the server implementation."], headers: [], cache: "Heuristically cacheable", reference: "RFC 9110 §15.6.2" },
    { code: 502, name: "Bad Gateway", common: true, description: "A gateway or proxy received an invalid response from an upstream server.", causes: ["Upstream crash, protocol mismatch, DNS error, connection reset, or malformed response."], actions: ["Check upstream health and proxy logs.", "Verify DNS, TLS, ports, timeouts, and response framing."], headers: ["Via", "Retry-After"], cache: "Not cacheable by default", reference: "RFC 9110 §15.6.3" },
    { code: 503, name: "Service Unavailable", common: true, description: "The server is temporarily unable to handle the request.", causes: ["Maintenance, overload, unavailable dependency, or no healthy upstream instances."], actions: ["Honor Retry-After and retry with backoff.", "Check capacity, health checks, deployments, and dependencies."], headers: ["Retry-After"], cache: "Not cacheable by default", reference: "RFC 9110 §15.6.4" },
    { code: 504, name: "Gateway Timeout", common: true, description: "A gateway or proxy timed out waiting for an upstream response.", causes: ["Slow upstream, network loss, deadlock, overloaded service, or short proxy timeout."], actions: ["Measure upstream latency and inspect timeout settings.", "Check dependency health and request fan-out."], headers: ["Via", "Retry-After"], cache: "Not cacheable by default", reference: "RFC 9110 §15.6.5" },
    { code: 505, name: "HTTP Version Not Supported", common: false, description: "The server does not support the HTTP version used by the request.", causes: ["Obsolete client version, strict gateway, or protocol negotiation failure."], actions: ["Retry with a supported HTTP version.", "Check ALPN and proxy protocol configuration."], headers: [], cache: "Not cacheable by default", reference: "RFC 9110 §15.6.6" },
    { code: 506, name: "Variant Also Negotiates", common: false, description: "Content negotiation configuration contains a circular reference.", causes: ["A selected variant is itself configured as a negotiable resource."], actions: ["Correct the variant map or negotiation configuration.", "Remove recursive variant references."], headers: ["Alternates", "TCN"], cache: "Not cacheable by default", reference: "RFC 2295 §8.1" },
    { code: 507, name: "Insufficient Storage", common: false, description: "The server cannot store the representation needed to complete the request.", causes: ["Disk full, quota exhausted, or insufficient WebDAV storage."], actions: ["Free storage or increase quota.", "Check temporary and backend storage capacity."], headers: [], cache: "Not cacheable by default", reference: "RFC 4918 §11.5" },
    { code: 508, name: "Loop Detected", common: false, description: "The server detected an infinite loop while processing the request.", causes: ["Recursive WebDAV bindings or a cyclic internal traversal."], actions: ["Remove the cycle in resource bindings or routing.", "Inspect depth and traversal configuration."], headers: [], cache: "Not cacheable by default", reference: "RFC 5842 §7.2" },
    { code: 510, name: "Not Extended", common: false, description: "An obsolete extension framework required more information from the request.", causes: ["A legacy implementation emitted the obsolete status."], actions: ["Replace the extension mechanism with current HTTP features.", "Treat the response as an implementation-specific 5xx."], headers: [], cache: "Not cacheable by default", reference: "RFC 2774; status obsolete" },
    { code: 511, name: "Network Authentication Required", common: false, description: "The client must authenticate to gain network access.", causes: ["A captive portal intercepted the request."], actions: ["Open the network login page and authenticate.", "Check captive portal detection and network policy."], headers: ["Link"], cache: "Must not be stored", reference: "RFC 6585 §6" }
  ];

  const categoryNames = {
    1: "Informational",
    2: "Success",
    3: "Redirection",
    4: "Client error",
    5: "Server error"
  };

  const searchInput = document.querySelector("#status-search");
  const commonOnly = document.querySelector("#common-only");
  const clearButton = document.querySelector("#clear-filters");
  const categoryTabs = [...document.querySelectorAll(".category-tab")];
  const statusList = document.querySelector("#status-list");
  const resultCount = document.querySelector("#result-count");
  const emptyState = document.querySelector("#status-empty");

  if (!searchInput || !commonOnly || !clearButton || !statusList || !resultCount || !emptyState) {
    return;
  }

  let activeCategory = "all";

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const renderList = (items, className = "") => {
    if (!items.length) {
      return '<p class="status-detail-empty">—</p>';
    }

    return `<ul${className ? ` class="${className}"` : ""}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  };

  const renderHeaders = (headers) => {
    if (!headers.length) {
      return '<p class="status-detail-empty">—</p>';
    }

    return `<div class="status-header-list">${headers.map((header) => `<code class="status-header-chip">${escapeHtml(header)}</code>`).join("")}</div>`;
  };

  const createEntry = (status) => {
    const category = String(status.code)[0];
    const article = document.createElement("article");
    article.className = "status-entry";
    article.dataset.category = category;
    article.dataset.code = String(status.code);

    article.innerHTML = `
      <button class="status-summary" type="button" aria-expanded="false">
        <span class="status-code">${status.code}</span>
        <span class="status-title-block">
          <span class="status-title">${escapeHtml(status.name)}</span>
          <span class="status-description">${escapeHtml(status.description)}</span>
        </span>
        <svg class="status-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="status-details">
        <div class="status-detail-grid">
          <div class="status-detail-block">
            <h3>Typical causes</h3>
            ${renderList(status.causes)}
          </div>
          <div class="status-detail-block">
            <h3>Common checks</h3>
            ${renderList(status.actions)}
          </div>
          <div class="status-detail-block">
            <h3>Related headers</h3>
            ${renderHeaders(status.headers)}
          </div>
          <div class="status-detail-block">
            <h3>Cache behavior</h3>
            <p>${escapeHtml(status.cache)}</p>
          </div>
        </div>
        <div class="status-reference-row">
          <span><strong>Category:</strong> ${escapeHtml(categoryNames[category])}</span>
          <span><strong>Reference:</strong> ${escapeHtml(status.reference)}</span>
        </div>
      </div>
    `;

    const summary = article.querySelector(".status-summary");
    summary.addEventListener("click", () => {
      const isOpen = article.classList.toggle("is-open");
      summary.setAttribute("aria-expanded", String(isOpen));
    });

    return article;
  };

  const searchableText = (status) => [
    status.code,
    status.name,
    status.description,
    categoryNames[String(status.code)[0]],
    status.reference,
    status.cache,
    ...status.causes,
    ...status.actions,
    ...status.headers
  ].join(" ").toLowerCase();

  const render = () => {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = STATUS_CODES.filter((status) => {
      const categoryMatch = activeCategory === "all" || String(status.code).startsWith(activeCategory);
      const commonMatch = !commonOnly.checked || status.common;
      const queryMatch = !query || searchableText(status).includes(query);
      return categoryMatch && commonMatch && queryMatch;
    });

    const fragment = document.createDocumentFragment();
    filtered.forEach((status) => fragment.append(createEntry(status)));
    statusList.replaceChildren(fragment);

    resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? "code" : "codes"}`;
    emptyState.hidden = filtered.length !== 0;
  };

  const setActiveCategory = (category) => {
    activeCategory = category;
    categoryTabs.forEach((tab) => {
      const selected = tab.dataset.category === category;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    render();
  };

  categoryTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setActiveCategory(tab.dataset.category || "all"));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + categoryTabs.length) % categoryTabs.length;
      categoryTabs[nextIndex].focus();
      setActiveCategory(categoryTabs[nextIndex].dataset.category || "all");
    });
  });

  searchInput.addEventListener("input", render);
  commonOnly.addEventListener("change", render);
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    commonOnly.checked = false;
    setActiveCategory("all");
    searchInput.focus();
  });

  render();
})();
