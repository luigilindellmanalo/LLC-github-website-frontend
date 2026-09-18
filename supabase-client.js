/* =====================================================================
   supabase-client.js — the single connection point
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- SUPABASE PROJECT CONFIGURATION ---------- */
  var SUPABASE_URL = "https://qkznwtbwomfmbzxngrhu.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_n-E4TbfGKVQ5h7RDjEnwDQ_SJk5L_Ew";
  /* ---------------------------------------------------- */

  var EDGE = SUPABASE_URL + "/functions/v1/";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error(
      "Supabase library not loaded. The CDN script must come before supabase-client.js."
    );
    return;
  }

  var client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        storage: window.sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce"
      }
    }
  );

  function callFunction(name, payload) {
    return client.auth.getSession().then(function (res) {
      var token =
        res &&
        res.data &&
        res.data.session &&
        res.data.session.access_token
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
          return {
            ok: r.ok,
            status: r.status,
            body: body
          };
        });
      });
    });
  }

  window.LLCSupabase = {
    client: client,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    callFunction: callFunction,
    isConfigured: function () {
      return (
        SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
        SUPABASE_ANON_KEY.indexOf("YOUR-ANON-KEY") === -1
      );
    }
  };

  console.log("LLCSupabase initialized successfully.");
})();
