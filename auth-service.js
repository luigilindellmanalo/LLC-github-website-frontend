/* =====================================================================
   auth-service.js — SUPABASE VERSION
   =====================================================================
   Replaces the Phase 1-9 mock service completely.

   WHAT IS DELIBERATELY PRESERVED
   All nine public method names, and the exact error codes auth.js maps
   to friendly messages. auth.js and app.js therefore need almost no
   change — the swap point Phase 1-9 designed for is being used as
   intended.

   WHAT IS GONE
     password field           -> Supabase Auth holds a bcrypt hash we
                                 never see, store, or compare
     findClientByMobile()     -> answered "is this number registered?",
                                 which is a customer-harvesting tool
     continueWithFacebook()   -> D4, not at launch
     in-memory client counter -> identity is now the Supabase UUID

   AUTHENTICATION MODEL (D14)
   ONE account holds BOTH the email and the mobile, sharing ONE
   password. Either identifier signs in to the same account. No OTP, no
   email verification, no mobile verification.
   ===================================================================== */
(function () {
  "use strict";

  var sb = window.LLCSupabase;
  if (!sb) {
    console.error("supabase-client.js must load before auth-service.js");
    return;
  }
  var client = sb.client;

  /* ---------- Cached state ----------
     app.js calls getCurrentUserSync() synchronously in several places,
     but Supabase is asynchronous everywhere. The profile is fetched
     once when the auth state changes, cached here, and only THEN are
     listeners notified — so by the time showApp() runs, every
     synchronous read works. */
  var currentUser = null;      // mapped profile, or null
  var isArchived = false;      // authenticated but archived (D22)
  var loadError = false;       // AUDIT FIX: query itself failed — NOT the same as archived
  var listeners = [];
  var ready = false;

  function notify() {
    listeners.forEach(function (cb) {
      try { cb(currentUser); } catch (e) { console.error(e); }
    });
  }

  /* ---------- Mobile normalisation ----------
     Supabase stores and matches E.164 ("+639755266616").
     Filipino customers type "0975 526 6616".
     Without this, a correct number and password simply fail to log in,
     looking exactly like a wrong password. */
  function normalizeMobile(raw) {
    var digits = String(raw || "").replace(/[^\d+]/g, "");
    var d = digits.charAt(0) === "+" ? digits.slice(1) : digits;
    if (/^09\d{9}$/.test(d)) d = "63" + d.slice(1);
    else if (/^9\d{9}$/.test(d)) d = "63" + d;
    else if (/^639\d{9}$/.test(d)) { /* already correct */ }
    else return null;
    return "+" + d;
  }

  /* Display form for prefilled fields and staff screens. */
  function displayMobile(e164) {
    if (!e164) return "";
    var m = String(e164).match(/^\+63(\d{3})(\d{3})(\d{4})$/);
    return m ? "0" + m[1] + " " + m[2] + " " + m[3] : String(e164);
  }

  /* ---------- Database row -> the shape app.js already expects ----------
     The database uses snake_case; app.js reads camelCase. Mapping here
     means no rendering code has to change. */
  function mapProfile(row) {
    if (!row) return null;
    return {
      clientId: row.id,
      firstName: row.first_name,
      middleName: row.middle_name || null,
      lastName: row.last_name,
      email: row.email,
      mobileNumber: displayMobile(row.mobile_number),
      mobileE164: row.mobile_number,
      locationAddress: row.location_address,
      authenticationProvider: row.authentication_provider || "password",
      role: "client",                 // display only, never trusted
      createdAt: row.created_at,
      /* D9 — clients may READ their own design information.
         They can never write it; RLS enforces that. */
      remarks: row.remarks || "",
      projectType: row.project_type || "",
      bedrooms: row.bedrooms,
      cr: row.cr,
      bestTimeToCall: row.best_time_to_call || ""
    };
  }

  /* Loads the signed-in person's own record.
     TWO outcomes must NOT be confused, and the audit found they had
     been:
       - the query SUCCEEDS and returns no row  -> genuinely archived
                                                    (or no client record)
       - the query ITSELF FAILS (network drop, a temporary Supabase
         outage, an RLS misconfiguration during setup) -> unknown, and
         must NOT be reported to a real customer as "your account is no
         longer active". That message is only true in the first case. */
  function loadProfile() {
    return client
      .from("client_self_view")
      .select("*")
      .maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;   // genuine failure — propagates, NOT archived
        if (!res.data) {
          currentUser = null;
          isArchived = true;
          return null;
        }
        currentUser = mapProfile(res.data);
        isArchived = false;
        return currentUser;
      });
  }

  function err(code) {
    var e = new Error(code);
    e.code = code;
    return e;
  }

  /* Sign-in failures ALWAYS return auth/wrong-password, whether the
     account exists or not. Distinguishing them would let anyone test
     which email addresses and mobile numbers are registered. */
  function mapSignInError() {
    return err("auth/wrong-password");
  }

  /* ---------- Auth state ---------- */
  client.auth.onAuthStateChange(function (event, session) {
    if (!session) {
      currentUser = null;
      isArchived = false;
      loadError = false;
      ready = true;
      notify();
      return;
    }
    loadProfile()
      .then(function () {
        loadError = false;
      })
      .catch(function (e) {
        /* AUDIT FIX. This used to set isArchived = true here, so any
           genuine failure — a network blip, a temporary outage, an RLS
           mistake during setup — told a real, active customer their
           account was no longer active. It wasn't true, and it isn't
           the code's place to guess. isArchived stays whatever it was
           (normally false); loadError is the honest signal instead. */
        console.error("Profile load failed:", e);
        currentUser = null;
        loadError = true;
      })
      .then(function () {
        ready = true;
        notify();
      });
  });

  var AuthService = {
    /* ---------- 1. State ---------- */
    onAuthStateChanged: function (cb) {
      if (typeof cb !== "function") return function () {};
      listeners.push(cb);
      if (ready) cb(currentUser);   // don't leave a late subscriber waiting
      return function () {
        listeners = listeners.filter(function (l) { return l !== cb; });
      };
    },

    getCurrentUserSync: function () {
      return currentUser;
    },

    /* True when Supabase authenticated the person but no usable client
       record exists — an archived account (D22). auth.js uses this to
       show the archived screen instead of the app. */
    isArchivedSession: function () {
      return isArchived;
    },

    /* AUDIT FIX. True only when the PROFILE QUERY ITSELF failed —
       never true just because the person is archived. auth.js uses
       this to show an honest "couldn't load, please try again"
       message instead of the (false) archived-account message. */
    hasLoadError: function () {
      return loadError;
    },

    /* ---------- 2. Sign up ----------
       Goes through the client-signup Edge Function, which is the only
       thing able to create an account with a PRE-CONFIRMED phone. That
       needs the service-role key, which can never sit in this file. */
    signUpWithEmail: function (details) {
      details = details || {};
      var password = details.password || "";
      var confirm = details.confirmPassword;

      if (confirm !== undefined && password !== confirm) {
        return Promise.reject(err("auth/password-mismatch"));
      }
      if (password.length < 8) {                      // D18
        return Promise.reject(err("auth/weak-password"));
      }

      return sb.callFunction("client-signup", {
        firstName: details.firstName,
        middleName: details.middleName,
        lastName: details.lastName,
        email: details.email,
        mobileNumber: details.mobileNumber,
        locationAddress: details.locationAddress,
        password: password,
        captchaToken: details.captchaToken
      }).then(function (res) {
        if (!res.ok) {
          throw err((res.body && res.body.error && res.body.error.code) ||
                    "auth/network-request-failed");
        }
        /* Sign in straight away, so every session is created by one
           code path rather than the function handing one back. */
        return AuthService.logInWithEmail({
          email: details.email,
          password: password
        });
      }).catch(function (e) {
        throw e && e.code ? e : err("auth/network-request-failed");
      });
    },

    /* ---------- 3. Email login ---------- */
    logInWithEmail: function (details) {
      details = details || {};
      var email = String(details.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Promise.reject(err("auth/invalid-email"));
      }
      if (!details.password) {
        return Promise.reject(err("auth/wrong-password"));
      }

      return client.auth.signInWithPassword({
        email: email,
        password: details.password
      }).then(function (res) {
        if (res.error) throw mapSignInError();
        return loadProfile();
      });
    },

    /* ---------- 4. Mobile login (D14) ----------
       The SAME account as the email route, reached through the other
       identifier. No OTP — a password, exactly as with email. */
    continueWithMobile: function (details) {
      details = details || {};
      var phone = normalizeMobile(details.mobileNumber);
      if (!phone) return Promise.reject(err("auth/invalid-mobile"));
      if (!details.password) return Promise.reject(err("auth/wrong-password"));

      return client.auth.signInWithPassword({
        phone: phone,
        password: details.password
      }).then(function (res) {
        if (res.error) throw mapSignInError();
        return loadProfile();
      });
    },

    /* ---------- 5. Password reset ---------- */
    requestPasswordReset: function (email) {
      var addr = String(email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
        return Promise.reject(err("auth/invalid-email"));
      }
      return client.auth.resetPasswordForEmail(addr, {
        redirectTo: window.location.origin + window.location.pathname + "#reset"
      }).then(function () {
        /* Always reports success, even for an unknown address —
           otherwise this form becomes a way to test which addresses
           are registered. */
        return true;
      });
    },

    /* Completes a reset after the emailed link opens a fresh tab.
       detectSessionInUrl has already turned the recovery token into a
       temporary session by this point. */
    completePasswordReset: function (newPassword) {
      if (!newPassword || newPassword.length < 8) {
        return Promise.reject(err("auth/weak-password"));
      }
      return client.auth.updateUser({ password: newPassword })
        .then(function (res) {
          if (res.error) throw err("auth/weak-password");
          return true;
        });
    },

    /* ---------- 6. Log out ---------- */
    logOut: function () {
      return client.auth.signOut().then(function () {
        currentUser = null;
        isArchived = false;
        loadError = false;
        return true;
      });
    },

    /* ---------- 7. Formatting (unchanged from Phase 1-9) ---------- */
    fullName: function (user) {
      if (!user) return "";
      return [user.firstName, user.middleName, user.lastName]
        .filter(Boolean).join(" ");
    },

    normalizeMobile: normalizeMobile,
    displayMobile: displayMobile
  };

  window.AuthService = AuthService;
})();
