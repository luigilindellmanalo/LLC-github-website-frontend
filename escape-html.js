/* =====================================================================
   escape-html.js — the helper neither codebase had
   =====================================================================
   Shared by the Client site and the Admin app.

   THE PROBLEM THIS SOLVES
   When text is put inside an innerHTML string, the browser reads it as
   INSTRUCTIONS FOR BUILDING THE PAGE, not as text to display. Ordinary
   words are harmless. Something that looks like code gets executed.

   A client typing this as their name:
       <img src=x onerror="...">
   would have it run inside the Admin's browser, with the Admin's
   session, the moment their name appeared in a list.

   THREE RULES
   1. Prefer .textContent. It cannot execute anything, ever.
   2. If you must build HTML as a string, wrap every value in esc().
   3. Never put user data in a URL attribute without safeUrl().

   Loaded before everything else. No dependencies.
   ===================================================================== */
(function () {
  "use strict";

  var MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;"
  };

  /* Escape text destined for element content or an attribute value. */
  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"'`]/g, function (ch) {
      return MAP[ch];
    });
  }

  /* URLs need more than escaping. A value like "javascript:alert(1)" is
     perfectly valid HTML and still dangerous, so the SCHEME is checked
     before the characters are. Anything not http/https/blob/data-image
     returns empty, which renders as a broken image rather than a
     working attack. */
  function safeUrl(value) {
    if (!value) return "";
    var raw = String(value).trim();

    // Allow relative paths and Supabase storage keys.
    if (/^[\w./-]+$/.test(raw)) return esc(raw);

    var lower = raw.toLowerCase();
    var ok =
      lower.indexOf("https://") === 0 ||
      lower.indexOf("http://") === 0 ||
      lower.indexOf("blob:") === 0 ||
      lower.indexOf("data:image/") === 0;

    return ok ? esc(raw) : "";
  }

  /* Convenience: set text safely without touching innerHTML at all.
     This is the pattern to prefer everywhere. */
  function setText(node, value) {
    if (!node) return;
    node.textContent = value === null || value === undefined ? "" : String(value);
  }

  window.LLCEscape = { esc: esc, safeUrl: safeUrl, setText: setText };
})();
