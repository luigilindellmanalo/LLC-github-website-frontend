/* =====================================================================
   archived-state.js — D22, Option A
   =====================================================================
   WHAT ARCHIVING DOES AND DOES NOT DO

   Archiving a client is not deletion. Their record, conversation,
   messages and photos are all kept (D11). What ends is their ability
   to use the site.

   Supabase Auth does not know about archiving, so an archived client
   still AUTHENTICATES successfully. Every database query then returns
   nothing, because current_client_id() resolves to NULL for them — so
   no data is exposed. Without this screen they would simply see an
   empty, broken-looking site with no explanation.

   OPTION A (your decision):
     - the existing session is NOT terminated
     - it stays technically valid until it expires naturally
     - throughout that time they receive no usable data
     - they see this clear message instead of the app
     - a Log out button is provided, but nothing is forced

   With session-only storage (D20) this window is naturally short:
   closing the tab ends the session anyway.
   ===================================================================== */
(function () {
  "use strict";

  var CONTACT_NUMBER = "0975 526 6616";

  function panel() {
    return document.getElementById("auth-step-archived");
  }

  function show() {
    var gate = document.getElementById("auth-modal");
    var shell = document.getElementById("app-shell");
    var target = panel();
    if (!gate || !target) return;

    /* Hide every other gate step, reveal this one. */
    Array.prototype.forEach.call(
      gate.querySelectorAll("[id^='auth-step-']"),
      function (step) { step.hidden = step.id !== "auth-step-archived"; }
    );

    gate.hidden = false;
    if (shell) shell.hidden = true;

    var msg = document.getElementById("archived-contact-number");
    if (msg) msg.textContent = CONTACT_NUMBER;
  }

  function wire() {
    var btn = document.getElementById("btn-archived-logout");
    if (!btn) return;
    btn.addEventListener("click", function () {
      /* The ONLY way this session ends early — the client's own
         choice, never forced (D22). */
      if (window.ChatService && window.ChatService.reset) window.ChatService.reset();
      window.AuthService.logOut().then(function () {
        window.location.reload();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  window.LLCArchivedState = { show: show };
})();
