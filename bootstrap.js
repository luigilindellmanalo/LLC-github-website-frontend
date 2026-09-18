/* =====================================================================
   bootstrap.js — orchestrates start-up order
   =====================================================================
   THE PROBLEM THIS SOLVES

   app.js line 13 is:      const DATA = window.SITE_DATA;
   captured at PARSE TIME. If app.js runs before the content exists,
   DATA is undefined and nothing renders at all.

   But content cannot be fetched before sign-in either: every table is
   behind the login gate (D2), and anonymous users have no read policy.

   So the order has to be:
       sign in  ->  load content  ->  THEN run app.js

   Rather than rewriting app.js to be async — which would mean touching
   its rendering engine — app.js is simply loaded LAST, on demand, once
   window.SITE_DATA is populated. Line 13 stays exactly as written and
   the gallery engine, lightbox and back-button router are untouched.
   ===================================================================== */
(function () {
  "use strict";

  var appLoaded = false;
  var appLoading = null;

  function loadAppScript() {
    if (appLoaded) return Promise.resolve();
    if (appLoading) return appLoading;

    appLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "js/app.js";
      s.onload = function () { appLoaded = true; resolve(); };
      s.onerror = function () { reject(new Error("Could not load app.js")); };
      document.body.appendChild(s);
    });
    return appLoading;
  }

  /* Called by auth.js once a client is signed in and not archived. */
  function enterApp(user) {
    if (!window.LLCSupabase.isConfigured()) {
      return Promise.reject(new Error(
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY " +
        "in js/supabase-client.js before running the site."
      ));
    }

    return window.LLCDataService.load()
      .then(loadAppScript)
      .then(function () {
        if (window.LLCApp && window.LLCApp.showApp) {
          window.LLCApp.showApp(user);
        }
      });
  }

  /* A password-reset link opens a fresh tab with "#reset" in the URL and
     a recovery token that detectSessionInUrl has already turned into a
     temporary session. Session-only storage (D20) does not interfere:
     the session lives in the tab the link opened. */
  function checkForPasswordReset() {
    if (window.location.hash.indexOf("reset") === -1) return;
    var step = document.getElementById("auth-step-set-password");
    if (!step) return;

    var gate = document.getElementById("auth-modal");
    if (gate) gate.hidden = false;
    Array.prototype.forEach.call(
      document.querySelectorAll("[id^='auth-step-']"),
      function (el) { el.hidden = el.id !== "auth-step-set-password"; }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkForPasswordReset);
  } else {
    checkForPasswordReset();
  }

  window.LLCBootstrap = { enterApp: enterApp };
})();
