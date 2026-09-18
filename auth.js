/* =====================================================================
   auth.js — sign-in gate controller
   =====================================================================
   Talks ONLY to window.AuthService. It has no idea Supabase exists, and
   that is deliberate: the service could be replaced again without this
   file changing.

   WHAT CHANGED FROM PHASE 1-9

   REMOVED  "Continue with Facebook"        (D4 — not at launch)
   REMOVED  the mobileNotFound step         it announced whether a given
                                            number was registered, which
                                            is a customer-harvesting tool
   CHANGED  the mobile step now collects a PASSWORD (D14). Previously it
            logged anyone in with a phone number and no credential.
   CHANGED  weak-password message: 6 -> 8 characters (D18)
   ADDED    password reset request + set-new-password screens (D19)
   ADDED    archived-account handling (D22) — the client STAYS signed in
            and sees a clear message. No forced sign-out.

   UNCHANGED  step navigation, form wiring, busy states, the friendly
              error map, and the no-close-button rule.
   ===================================================================== */
(function () {
  "use strict";

  var gate = document.getElementById("auth-modal");
  var steps = {
    choice: document.getElementById("auth-step-choice"),
    login: document.getElementById("auth-step-login"),
    signup: document.getElementById("auth-step-signup"),
    mobile: document.getElementById("auth-step-mobile"),
    reset: document.getElementById("auth-step-reset"),
    setPassword: document.getElementById("auth-step-set-password"),
    archived: document.getElementById("auth-step-archived")
  };

  function toast(message) {
    if (window.LLCShowToast) window.LLCShowToast(message);
  }

  /* ---------- Friendly error messages ---------- */
  /* Visitors never see raw error codes — only these plain-language
     messages. The codes come from AuthService and from the
     client-signup Edge Function, which deliberately returns the SAME
     strings the prototype used, so this map needed almost no change. */
  var FRIENDLY_ERRORS = {
    "auth/wrong-password": "Those details don't match an account. Please try again.",
    "auth/user-not-found": "Those details don't match an account. Please try again.",
    "auth/email-already-in-use": "An account with that email already exists. Try logging in instead.",
    "auth/mobile-already-in-use": "An account with that mobile number already exists. Try logging in instead.",
    "auth/weak-password": "Please choose a password with at least 8 characters.",
    "auth/password-mismatch": "Passwords don't match. Please re-enter them.",
    "auth/email-mismatch": "Email addresses don't match. Please re-enter them.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/invalid-mobile": "Please enter a valid mobile number (e.g. 0975 526 6616).",
    "auth/missing-first-name": "Please enter your first name.",
    "auth/missing-last-name": "Please enter your last name.",
    "auth/missing-address": "Please enter your address.",
    "auth/too-many-requests": "Too many attempts. Please wait a while and try again.",
    "auth/network-request-failed": "We couldn't connect. Please check your internet connection and try again."
  };

  function friendlyMessage(error) {
    return (
      (error && FRIENDLY_ERRORS[error.code]) ||
      "Something went wrong. Please try again in a moment."
    );
  }

  /* ---------- Step navigation ---------- */
  function goToStep(name) {
    Object.keys(steps).forEach(function (key) {
      if (steps[key]) steps[key].hidden = key !== name;
    });
    var active = steps[name];
    if (!active) return;
    var focusable = active.querySelector("input, button");
    if (focusable) {
      try { focusable.focus(); } catch (e) { /* focus is a nicety */ }
    }
  }

  function clearErrors() {
    /* Uses the existing .auth-error convention from Phase 1-9 markup. */
    Array.prototype.forEach.call(
      document.querySelectorAll("#auth-modal .auth-error"),
      function (node) {
        node.textContent = "";
        node.hidden = true;
      }
    );
  }

  function showError(id, message) {
    var node = document.getElementById(id);
    if (!node) { toast(message); return; }
    node.textContent = message;
    node.hidden = false;
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;
    if (busy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = busyLabel || "Please wait…";
      button.disabled = true;
    } else {
      if (button.dataset.originalLabel) {
        button.textContent = button.dataset.originalLabel;
      }
      button.disabled = false;
    }
  }

  function value(id) {
    var node = document.getElementById(id);
    return node ? node.value : "";
  }

  /* ---------- Gate visibility ---------- */
  function showGate() { if (gate) gate.hidden = false; }
  function hideGate() { if (gate) gate.hidden = true; }

  /* =====================================================================
     WIRING
     ===================================================================== */
  /* Step navigation uses the SAME data-goto convention as Phase 1-9, so
     every existing Back link and "Create account" link keeps working
     without markup changes. One delegated listener covers them all. */
  function wireStepLinks() {
    if (!gate) return;
    gate.addEventListener("click", function (event) {
      var trigger = event.target.closest("[data-goto]");
      if (!trigger || !gate.contains(trigger)) return;
      event.preventDefault();
      clearErrors();
      goToStep(trigger.getAttribute("data-goto"));
    });
  }

  function wireChoice() {
    var map = {
      "btn-continue-email": "login",
      "btn-continue-mobile": "mobile"
    };
    Object.keys(map).forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        clearErrors();
        goToStep(map[id]);
      });
    });

    /* NOTE: there is no Facebook button any more (D4). Its markup was
       removed from index.html rather than hidden, so there is nothing
       here to wire. */
  }

  /* ---------- Email login ---------- */
  function wireLogin() {
    var form = document.getElementById("form-login");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();
      var button = form.querySelector("button[type='submit']");
      setBusy(button, true, "Logging in…");

      window.AuthService
        .logInWithEmail({
          email: value("login-email"),
          password: value("login-password")
        })
        .catch(function (error) {
          showError("login-error", friendlyMessage(error));
        })
        .then(function () { setBusy(button, false); });
    });
  }

  /* ---------- Mobile login (D14) ----------
     The password field is new. In Phase 1-9 this screen logged anyone in
     with just a phone number — no password, no code. A failure now
     returns the SAME message whether the number is unknown or the
     password is wrong, so this screen can no longer be used to discover
     who is a customer. */
  function wireMobile() {
    var form = document.getElementById("form-mobile");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();
      var button = form.querySelector("button[type='submit']");
      setBusy(button, true, "Logging in…");

      window.AuthService
        .continueWithMobile({
          mobileNumber: value("mobile-number"),
          password: value("mobile-password")
        })
        .catch(function (error) {
          showError("mobile-error", friendlyMessage(error));
        })
        .then(function () { setBusy(button, false); });
    });
  }

  /* ---------- Sign up ---------- */
  function wireSignup() {
    var form = document.getElementById("form-signup");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();

      var email = value("signup-email").trim();
      var confirmEmail = value("signup-confirm-email").trim();
      var password = value("signup-password");
      var confirmPassword = value("signup-confirm-password");

      /* Checked here as well as in the service. With no email
         verification anywhere (D14), a typo is never caught later — the
         confirm field is the only thing standing between a customer and
         an unreachable account. */
      if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
        showError("signup-error", FRIENDLY_ERRORS["auth/email-mismatch"]);
        return;
      }
      if (password !== confirmPassword) {
        showError("signup-error", FRIENDLY_ERRORS["auth/password-mismatch"]);
        return;
      }

      var button = form.querySelector("button[type='submit']");
      setBusy(button, true, "Creating your account…");

      window.AuthService
        .signUpWithEmail({
          firstName: value("signup-first-name"),
          middleName: value("signup-middle-name"),
          lastName: value("signup-last-name"),
          email: email,
          mobileNumber: value("signup-mobile"),
          locationAddress: value("signup-address"),
          password: password,
          confirmPassword: confirmPassword
        })
        .catch(function (error) {
          showError("signup-error", friendlyMessage(error));
        })
        .then(function () { setBusy(button, false); });
    });
  }

  /* ---------- Password reset request (D19) ---------- */
  function wireReset() {
    var form = document.getElementById("form-reset");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();
      var button = form.querySelector("button[type='submit']");
      setBusy(button, true, "Sending…");

      window.AuthService
        .requestPasswordReset(value("reset-email"))
        .then(function () {
          /* Deliberately the same message whether or not an account
             exists. Otherwise this form tells a stranger which email
             addresses are registered. */
          toast("If that email is registered, a reset link is on its way.");
          goToStep("choice");
        })
        .catch(function (error) {
          showError("reset-error", friendlyMessage(error));
        })
        .then(function () { setBusy(button, false); });
    });
  }

  /* ---------- Set a new password after following the emailed link ---- */
  function wireSetPassword() {
    var form = document.getElementById("form-set-password");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();

      var password = value("set-password");
      if (password !== value("set-confirm-password")) {
        showError("set-password-error", FRIENDLY_ERRORS["auth/password-mismatch"]);
        return;
      }

      var button = form.querySelector("button[type='submit']");
      setBusy(button, true, "Saving…");

      window.AuthService
        .completePasswordReset(password)
        .then(function () {
          toast("Password updated. You're signed in.");
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        })
        .catch(function (error) {
          showError("set-password-error", friendlyMessage(error));
        })
        .then(function () { setBusy(button, false); });
    });
  }

  /* =====================================================================
     AUTH STATE — the only switch between the gate and the app
     ===================================================================== */
  function wireAuthState() {
    window.AuthService.onAuthStateChanged(function (user) {
      /* AUDIT FIX. Checked BEFORE the archived branch below. This used
         to be absent, so any genuine failure loading the profile — a
         network drop, a temporary outage, an RLS mistake during setup —
         fell through to isArchivedSession() below and told a real,
         active customer their account was no longer active. That was
         false, and it isn't this code's place to guess at "archived"
         when it actually just doesn't know.

         Reuses the exact "choice-error" pattern already used a few
         lines down for a content-load failure, rather than introducing
         a second mechanism for what is the same kind of problem. The
         Supabase session itself is left untouched — nothing here signs
         anyone out — so the retry on the next attempt or page load can
         simply try again. */
      if (!user && window.AuthService.hasLoadError()) {
        showGate();
        goToStep("choice");
        showError(
          "choice-error",
          "We couldn't confirm your account just now. Please try again in a moment."
        );
        return;
      }

      /* ARCHIVED (D22)
         Supabase authenticated them, but no usable client record came
         back. Their session is left alone — not terminated — and they
         see a clear message with a Log out button. Every query returns
         nothing regardless, so there is nothing to expose. */
      if (!user && window.AuthService.isArchivedSession()) {
        showArchived();
        return;
      }

      if (user) {
        clearErrors();
        window.LLCBootstrap.enterApp(user)
          .then(function () { hideGate(); })
          .catch(function (error) {
            /* Content could not load. Staying on the gate with an
               explanation beats revealing a half-empty site. */
            showGate();
            goToStep("choice");
            showError(
              "choice-error",
              "We couldn't load the site content. Please try again in a moment."
            );
            if (window.console) console.error(error);
          });
        return;
      }

      /* Signed out. */
      if (window.LLCApp && window.LLCApp.hideApp) window.LLCApp.hideApp();
      if (window.ChatService && window.ChatService.reset) window.ChatService.reset();
      showGate();
      goToStep("choice");
    });
  }

  function showArchived() {
    if (window.LLCApp && window.LLCApp.hideApp) window.LLCApp.hideApp();
    showGate();
    if (window.LLCArchivedState) {
      window.LLCArchivedState.show();
    } else {
      goToStep("choice");
      showError("choice-error", "This account is no longer active.");
    }
  }

  /* ---------- Start ---------- */
  function init() {
    wireStepLinks();
    wireChoice();
    wireLogin();
    wireMobile();
    wireSignup();
    wireReset();
    wireSetPassword();
    wireAuthState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
