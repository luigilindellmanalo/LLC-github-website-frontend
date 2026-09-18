/* =====================================================================
   supabase-client.js — the single connection point
   =====================================================================
   Used by BOTH the Client site and the Admin app, with the same
   session-only configuration (D20 + D21).

   ⚠️ CONFIGURE BEFORE USE — the two values below are placeholders.
   Fill them in after creating the Supabase project (runbook step 2).

   WHAT GOES HERE AND WHAT NEVER DOES
   The ANON key belongs here. It is designed to be public and appears
   in every visitor's browser. It is safe ONLY because Row Level
   Security stands behind it.

   The SERVICE_ROLE key must NEVER appear in this file, in any frontend
   file, or anywhere in GitHub. It bypasses every security policy in
   the system. It lives only inside Supabase Edge Functions.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- CONFIGURE THESE TWO VALUES ---------- */
  var SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_n-E4TbfGKVQ5h7RDjEnwDQ_SJk5L_Ew";
  /* ------------------------------------------------ */

  var EDGE = SUPABASE_URL + "/functions/v1/";

  if (!window.supabase || !window.supabase.createClient) {
    console.error(
      "Supabase library not loaded. The CDN <script> tag must come " +
      "before supabase-client.js in the page."
    );
    return;
  }

  /* SESSION-ONLY AUTHENTICATION (D20 / D21)
     ---------------------------------------
     Supabase stores its session in localStorage by default, keeping a
     person signed in for weeks. On a shared computer — an internet
     café, a family PC, a site office — the next person to open the
     site would still be signed in as the previous user.

     sessionStorage is per-tab and cleared when the tab closes. This is
     the same mechanism Phase 1-9 already used for llc_mock_session, so
     it restores the original behaviour rather than inventing a new one.

     Consequences, all intended:
       refresh a tab   -> still signed in, same identity
       close the tab   -> signed out
       open a 2nd tab  -> signed out there (sessions are per-tab)

     detectSessionInUrl is required for password-reset links, which
     open a fresh tab with no session and carry a recovery token in the
     URL. */
  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce"
    }
  });

  /* Calls an Edge Function, attaching the caller's own session token so
     the function can verify who they are. Never sends a role or any
     other claim of authority — the function reads that from the
     database itself. */
  function callFunction(name, payload) {
    return client.auth.getSession().then(function (res) {
      var token = res && res.data && res.data.session
        ? res.data.session.access_token
        : SUPABASE_ANON_KEY;

      return fetch(EDGE + name, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload || {})
      }).then(function (r) {
        return r.json().then(function (body) {
          return { ok: r.ok, status: r.status, body: body };
        });
      });
    });
  }

  /* Removes leftover Phase 1-9 / Phase 10 prototype data. Without this,
     a browser that used the prototype keeps stale accounts and
     conversations around, which produces very confusing behaviour
     during testing. Harmless if nothing is present. */
  function clearPrototypeStorage() {
    try {
      ["llc_mock_users", "llc_mock_session", "llc_admin_current_user_id",
       "llc_admin_mock_session"].forEach(function (k) {
        window.localStorage.removeItem(k);
        window.sessionStorage.removeItem(k);
      });
      Object.keys(window.sessionStorage).forEach(function (k) {
        if (k.indexOf("llc_conversation_") === 0) window.sessionStorage.removeItem(k);
      });
    } catch (e) {
      /* Private browsing can block storage access. Not fatal. */
    }
  }

  clearPrototypeStorage();

  window.LLCSupabase = {
    client: client,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    callFunction: callFunction,
    isConfigured: function () {
      return SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
             SUPABASE_ANON_KEY.indexOf("YOUR-ANON-KEY") === -1;
    }
  };
})();
