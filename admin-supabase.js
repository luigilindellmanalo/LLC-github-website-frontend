/* =====================================================================
   admin-supabase.js — the Admin app's backend
   =====================================================================
   Loaded BEFORE admin.js. Provides everything admin.js needs to talk to
   Supabase instead of localStorage.

   WHY THIS IS A SEPARATE FILE

   admin.js is 5,000 lines built around a synchronous in-memory STORE
   that is written back wholesale by persistStore(). Converting every
   one of the ~100 call sites to async would mean rewriting the panel
   builders — which is precisely the part worth keeping, because it
   holds the four-role permission model.

   Instead, this file keeps that shape and changes what it means:

       load*()     fetch from Supabase into the same object shapes
       persist*()  DIFF against a snapshot and write ONLY what changed

   The diff matters for more than speed. persistStore() writes
   everything on every change; against a shared database that means two
   staff editing different clients would overwrite each other's work
   without either noticing. Writing only what changed removes that
   entirely.

   ⚠️ NO SERVICE-ROLE KEY. This file uses the public anon key, and Row
   Level Security decides what each staff member may actually do.
   ===================================================================== */
(function () {
  "use strict";

  var sb = window.LLCSupabase;
  if (!sb) {
    console.error("supabase-client.js must load before admin-supabase.js");
    return;
  }
  var client = sb.client;

  /* ---------- Snapshots, for diffing ---------- */
  var snapshots = { clients: {}, conversations: {}, users: {}, content: {} };

  function snap(obj) { return JSON.parse(JSON.stringify(obj || {})); }
  function changed(a, b) { return JSON.stringify(a) !== JSON.stringify(b); }

  function displayMobile(e164) {
    if (!e164) return "";
    var m = String(e164).match(/^\+63(\d{3})(\d{3})(\d{4})$/);
    return m ? "0" + m[1] + " " + m[2] + " " + m[3] : String(e164);
  }

  /* =================================================================
     AUTHENTICATION — replaces mockApiAdapter
     =================================================================
     The role is read from staff_profiles AFTER authentication. It is
     never chosen in the browser, never sent in a request, and never
     taken from storage. The Presentation build's role dropdown has no
     equivalent here and never will.
     ================================================================= */
  var supabaseApiAdapter = {
    login: function (email, password) {
      return client.auth.signInWithPassword({
        email: String(email || "").trim().toLowerCase(),
        password: password
      }).then(function (res) {
        /* One generic failure for a wrong address and a wrong password
           alike — anything else lets someone test which staff addresses
           exist. */
        if (res.error) throw new Error("Invalid email or password.");
        return loadStaffProfile();
      });
    },

    logout: function () {
      return client.auth.signOut().then(function () { return true; });
    },

    checkSession: function () {
      return client.auth.getSession().then(function (res) {
        if (!res.data || !res.data.session) return null;
        return loadStaffProfile().catch(function () { return null; });
      });
    }
  };

  function loadStaffProfile() {
    return client.from("staff_profiles")
      .select("id, name, email, role, enabled")
      .maybeSingle()
      .then(function (res) {
        if (res.error || !res.data) {
          /* Authenticated, but not a staff member — or disabled. Sign
             out rather than leaving a session that can reach nothing. */
          return client.auth.signOut().then(function () {
            throw new Error("This account does not have staff access.");
          });
        }
        if (!res.data.enabled) {
          return client.auth.signOut().then(function () {
            throw new Error("This account has been disabled.");
          });
        }
        return {
          id: res.data.id,
          name: res.data.name,
          username: res.data.email,
          role: res.data.role
        };
      });
  }

  /* =================================================================
     CONTENT  (company, hours, nav, galleries, reviews, testimonials)
     ================================================================= */
  function loadContent() {
    return Promise.all([
      client.from("company_profile").select("*").maybeSingle(),
      client.from("business_hours").select("*").order("day_of_week"),
      client.from("client_nav_items").select("*").order("sort_order"),
      client.from("gallery_sections").select("*").order("sort_order"),
      client.from("gallery_categories").select("*").order("sort_order"),
      client.from("gallery_projects").select("*").order("sort_order"),
      client.from("gallery_media").select("*").order("sort_order"),
      client.from("reviews").select("*").order("sort_order"),
      client.from("testimonial_videos").select("*").order("sort_order")
    ]).then(function (r) {
      var out = {
        company: r[0].data || {},
        hours: r[1].data || [],
        nav: r[2].data || [],
        sections: r[3].data || [],
        categories: r[4].data || [],
        projects: r[5].data || [],
        media: r[6].data || [],
        reviews: r[7].data || [],
        testimonials: r[8].data || []
      };
      snapshots.content = snap(out);
      return out;
    });
  }

  /* =================================================================
     CLIENTS
     =================================================================
     Admin reads the clients table directly. Follow-up and Design
     Operator have NO policy on it and must use their restricted view —
     which is what makes the columns they are denied genuinely
     unreachable rather than merely hidden.
     ================================================================= */
  function loadClients(role) {
    var source = role === "admin" ? "clients"
               : role === "followup-operator" ? "client_followup_view"
               : role === "design-operator" ? "client_design_view"
               : null;

    if (!source) return Promise.resolve({ list: [] });   // uploader: none

    return client.from(source).select("*").then(function (res) {
      if (res.error) throw res.error;

      var list = (res.data || []).map(function (row) {
        return {
          id: row.id,
          authUserId: row.auth_user_id || null,
          firstName: row.first_name,
          middleName: row.middle_name,
          lastName: row.last_name,
          email: row.email,
          mobileNumber: displayMobile(row.mobile_number),
          locationAddress: row.location_address,
          createdAt: row.created_at,
          remarks: row.remarks,
          internalNotes: row.internal_notes,   // admin only; absent elsewhere
          projectType: row.project_type,
          bedrooms: row.bedrooms,
          cr: row.cr,
          bestTimeToCall: row.best_time_to_call,
          archived: !!row.archived
        };
      });

      /* Budget lives in its own table so that "only Admin may see it"
         is a whole-table permission rather than a fragile column rule. */
      if (role !== "admin") {
        snapshots.clients = {};
        list.forEach(function (c) { snapshots.clients[c.id] = snap(c); });
        return { list: list };
      }

      return client.from("client_financials").select("*").then(function (fin) {
        var byId = {};
        (fin.data || []).forEach(function (f) { byId[f.client_id] = f.budget_max; });
        list.forEach(function (c) { c.budgetMax = byId[c.id] != null ? byId[c.id] : null; });

        snapshots.clients = {};
        list.forEach(function (c) { snapshots.clients[c.id] = snap(c); });
        return { list: list };
      });
    });
  }

  /* Writes only the fields that actually changed.

     ⚠️ email and mobile_number are DELIBERATELY EXCLUDED. For a client
     who has a login, those live in auth.users too, and changing one
     without the other would silently break their login and send their
     password reset to an address they cannot read. A database trigger
     rejects the attempt; the sanctioned path is updateClientIdentity()
     below. */
  var CLIENT_FIELDS = {
    firstName: "first_name",
    middleName: "middle_name",
    lastName: "last_name",
    locationAddress: "location_address",
    remarks: "remarks",
    internalNotes: "internal_notes",
    projectType: "project_type",
    bedrooms: "bedrooms",
    cr: "cr",
    bestTimeToCall: "best_time_to_call",
    archived: "archived"
  };

  /* MODIFICATION 6 — client ID reconciliation.
     A new walk-in's local id is a browser-generated crypto.randomUUID(),
     used only so the Admin UI has something to key on before the row
     exists. The database assigns its OWN id on insert. Previously that
     real id was never read back, so a client's SECOND edit in the same
     session targeted a row that did not exist and silently matched
     zero rows. Every new-client insert now chains .select("id").single()
     and the caller (admin.js) is told the {tempId, realId} pair so it
     can update its own in-memory object and re-key its snapshot. */
  function persistClients(state) {
    var writes = [];
    var idMap = [];   // [{ tempId, realId }] for every newly-inserted client

    (state.list || []).forEach(function (c) {
      var before = snapshots.clients[c.id];

      if (!before) {
        /* New walk-in entered by an Admin. No login, so email and
           mobile are safe to set directly here. */
        var tempId = c.id;
        writes.push(
          client.from("clients").insert({
            first_name: c.firstName,
            middle_name: c.middleName || null,
            last_name: c.lastName,
            email: c.email || null,
            mobile_number: c.mobileNumber || null,
            location_address: c.locationAddress || null,
            remarks: c.remarks || "",
            internal_notes: c.internalNotes || "",
            project_type: c.projectType || "",
            bedrooms: c.bedrooms,
            cr: c.cr,
            best_time_to_call: c.bestTimeToCall || ""
          }).select("*").single().then(function (res) {
            if (res.error) throw res.error;
            c.id = res.data.id;   // reconcile in place — same object admin.js holds
            /* Without this, a SECOND edit to the same client later in
               this session would find no snapshot under the new real
               id, be treated as "still new", and insert a duplicate
               row. This makes the very next lookup an UPDATE instead. */
            snapshots.clients[res.data.id] = snap(c);
            idMap.push({ tempId: tempId, realId: res.data.id });
          })
        );
        return;
      }

      var patch = {};
      Object.keys(CLIENT_FIELDS).forEach(function (jsKey) {
        if (changed(before[jsKey], c[jsKey])) patch[CLIENT_FIELDS[jsKey]] = c[jsKey];
      });

      if (Object.keys(patch).length) {
        writes.push(client.from("clients").update(patch).eq("id", c.id));
      }

      if (changed(before.budgetMax, c.budgetMax)) {
        writes.push(
          client.from("client_financials")
            .upsert({ client_id: c.id, budget_max: c.budgetMax })
        );
      }
    });

    /* Resolves with the id reconciliations the caller needs to apply.
       Existing callers that ignore the resolved value are unaffected —
       this is additive, not a breaking change to the return shape. */
    return Promise.all(writes).then(function () { return { idMap: idMap }; });
  }

  /* The ONLY safe way to change a client's login email or mobile.
     Updates auth.users and clients TOGETHER, reverting the first if the
     second fails. Anything else leaves the two out of step. */
  function updateClientIdentity(clientId, email, mobileNumber) {
    return sb.callFunction("admin-client-account", {
      action: "update-identity",
      clientId: clientId,
      email: email,
      mobileNumber: mobileNumber
    }).then(function (res) {
      if (!res.ok) {
        var code = res.body && res.body.error;
        if (code === "email_already_in_use") throw new Error("That email is already used by another account.");
        if (code === "mobile_already_in_use") throw new Error("That mobile number is already used by another account.");
        if (code === "invalid_email") throw new Error("Please enter a valid email address.");
        if (code === "invalid_mobile") throw new Error("Please enter a valid mobile number.");
        if (code === "client_has_no_login") throw new Error("This client has no login, so their details can be edited directly.");
        throw new Error("Could not update login details. Please try again.");
      }
      return true;
    });
  }

  /* D19 — the Admin triggers Supabase's own reset email. They never
     see, set, choose, or learn the password; the link goes from
     Supabase to the client directly. */
  function sendClientPasswordReset(clientId) {
    return sb.callFunction("admin-client-account", {
      action: "reset-password",
      clientId: clientId
    }).then(function (res) {
      if (!res.ok) {
        var code = res.body && res.body.error;
        if (code === "client_archived") throw new Error("This client is archived.");
        if (code === "client_has_no_login") throw new Error("This client has no login account.");
        if (code === "forbidden") throw new Error("Only an Admin can send a password reset.");
        throw new Error("Could not send the reset email. Please try again.");
      }
      return true;
    });
  }

  /* =================================================================
     CONVERSATIONS AND MESSAGES
     ================================================================= */
  function loadConversations() {
    return Promise.all([
      client.from("conversations").select("*").order("last_message_at", {
        ascending: false, nullsFirst: false
      }),
      client.from("messages").select("*").order("created_at")
    ]).then(function (r) {
      if (r[0].error) throw r[0].error;
      var messagesByConv = {};
      (r[1].data || []).forEach(function (m) {
        (messagesByConv[m.conversation_id] = messagesByConv[m.conversation_id] || []).push({
          messageId: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_staff_id || m.sender_client_id,
          senderRole: m.sender_role,
          senderName: m.sender_name_snapshot,
          senderRoleLabel: m.sender_role_label_snapshot,
          messageText: m.message_text,
          attachment: m.attachment_path
            ? { mediaId: null, image: null, path: m.attachment_path,
                caption: m.attachment_caption }
            : null,
          link: m.link_url ? { url: m.link_url, text: m.link_text } : null,
          timestamp: m.created_at,
          readStatus: m.read_at ? "read" : "sent"
        });
      });

      var list = (r[0].data || []).map(function (c) {
        return {
          conversationId: c.id,
          clientId: c.client_id,
          manualName: c.manual_name,
          companyId: "luigi-lindell-construction",
          createdAt: c.created_at,
          lastMessageAt: c.last_message_at,
          adminReadStatus: c.admin_read_status,
          archived: !!c.archived,
          participants: ["client", "admin", "followup-operator"],
          messages: messagesByConv[c.id] || []
        };
      });

      snapshots.conversations = {};
      list.forEach(function (c) { snapshots.conversations[c.conversationId] = snap(c); });
      return { list: list };
    });
  }

  /* Staff reply. sender_staff_id is pinned to the signed-in user by RLS,
     and the displayed name is written by a database trigger — so one
     staff member cannot post under another's name, and no client can
     post as staff. */
  function sendStaffMessage(conversationId, text, attachment, link) {
    return client.auth.getUser().then(function (res) {
      var uid = res.data && res.data.user ? res.data.user.id : null;
      if (!uid) throw new Error("Not signed in");

      var row = {
        conversation_id: conversationId,
        sender_role: "staff",
        sender_staff_id: uid,
        message_text: text || ""
      };
      if (attachment) {
        row.attachment_bucket = attachment.bucket;
        row.attachment_path = attachment.path;
        row.attachment_caption = attachment.caption || null;
        row.attachment_mime_type = attachment.mimeType || "image/jpeg";
        row.attachment_size_bytes = attachment.sizeBytes || null;
      }
      if (link) { row.link_url = link.url; row.link_text = link.text; }

      return client.from("messages").insert(row).select("*").single();
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  }

  function setConversationReadStatus(conversationId, status) {
    return client.rpc("set_conversation_read_status", {
      conv_id: conversationId,
      new_status: status
    });
  }

  /* Realtime for the inbox.
     ⚠️ PENDING LIVE VERIFICATION: Realtime must be published WITH RLS
     enforcement. Without it, subscribers receive every message
     regardless of policy. Staff are allowed to see all conversations,
     so this subscription is correct for the Admin either way — the risk
     is entirely on the CLIENT side, and is tested there. */
  function subscribeToInbox(onChange) {
    return client.channel("admin-inbox")
      .on("postgres_changes",
          { event: "*", schema: "public", table: "messages" }, onChange)
      .on("postgres_changes",
          { event: "*", schema: "public", table: "conversations" }, onChange)
      .subscribe();
  }

  /* =================================================================
     STAFF USERS
     =================================================================
     No password field anywhere. Supabase Auth owns credentials; this
     table only says which role an account has.

     Creating a login is a two-step job by design: the account is made
     in the Supabase dashboard, then given a role here. The prototype's
     Users panel edited a list that had no effect on who could actually
     log in — this replaces that with something real.
     ================================================================= */
  function loadUsers() {
    return client.from("staff_profiles").select("*").order("created_at")
      .then(function (res) {
        if (res.error) throw res.error;
        var list = (res.data || []).map(function (u) {
          return {
            id: u.id,
            name: u.name,
            username: u.email,
            role: u.role,
            enabled: u.enabled,
            createdAt: u.created_at
          };
        });
        snapshots.users = {};
        list.forEach(function (u) { snapshots.users[u.id] = snap(u); });
        return { list: list };
      });
  }

  function persistUsers(state) {
    var writes = [];
    (state.list || []).forEach(function (u) {
      var before = snapshots.users[u.id];
      if (!before) return;   // new accounts are created in the dashboard
      var patch = {};
      if (changed(before.name, u.name)) patch.name = u.name;
      if (changed(before.role, u.role)) patch.role = u.role;
      if (changed(before.enabled, u.enabled)) patch.enabled = u.enabled;
      if (Object.keys(patch).length) {
        writes.push(client.from("staff_profiles").update(patch).eq("id", u.id));
      }
    });
    return Promise.all(writes).then(function () { return true; });
  }

  /* =================================================================
     GALLERY WRITES
     ================================================================= */
  function createCategory(sectionId, name, sortOrder) {
    return client.from("gallery_categories").insert({
      section_id: sectionId, name: name, published: true,
      sort_order: sortOrder || 1
    }).select("*").single();
  }

  function createProject(categoryId, name, description, sortOrder) {
    return client.from("gallery_projects").insert({
      category_id: categoryId, name: name, description: description || null,
      published: true, sort_order: sortOrder || 1
    }).select("*").single();
  }

  /* Records the three files produced for a business photo: the
     untouched HD original, the display copy and the thumbnail (D17). */
  function createMediaRecord(projectId, uploaded, title, caption) {
    return client.from("gallery_media").insert({
      project_id: projectId,
      media_type: uploaded.mediaType,
      storage_bucket: uploaded.bucket,
      storage_path: uploaded.storagePath,      // HD original
      display_path: uploaded.displayPath,      // 2048px viewing copy
      thumbnail_path: uploaded.thumbnailPath,  // 600px grid copy
      title: title || null,
      caption: caption || null,
      published: true,
      file_size_bytes: uploaded.sizeBytes || null
    }).select("*").single();
  }

  /* Diff-based content write-back.
     The prototype's persistStore() rewrote every table on every change.
     Against a shared database that is not merely wasteful: two staff
     editing different things would overwrite each other's work without
     either noticing. Only genuinely changed rows are written. */
  function persistContent(store) {
    var writes = [];
    var before = snapshots.content || {};

    /* Company profile — single row. */
    if (store.company && before.company) {
      var cp = {};
      if (changed(before.company.name, store.company.name)) cp.name = store.company.name;
      if (changed(before.company.description, store.company.description)) cp.description = store.company.description;
      if (changed(before.company.location, store.company.location)) cp.location = store.company.location;
      if (changed(before.company.mobile, store.company.mobile)) cp.mobile = store.company.mobile;
      if (Object.keys(cp).length) {
        writes.push(client.from("company_profile").update(cp).eq("id", 1));
      }
    }

    /* Business hours — 7 rows, keyed by day number. The database stores
       day_of_week as an integer rather than the English name, because
       matching "Monday" against Intl output is locale-fragile. */
    if (store.hours && store.hours.schedule) {
      var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday",
                  "Thursday", "Friday", "Saturday"];
      store.hours.schedule.forEach(function (row) {
        var dow = DAYS.indexOf(row.day);
        if (dow < 0) return;
        var prior = (before.hours || []).filter(function (h) {
          return h.day_of_week === dow;
        })[0];
        if (!prior) return;

        var patch = {};
        if (changed(prior.open_time && prior.open_time.slice(0, 5), row.open)) patch.open_time = row.open;
        if (changed(prior.close_time && prior.close_time.slice(0, 5), row.close)) patch.close_time = row.close;
        if (changed(prior.chat_available, row.chatAvailable)) patch.chat_available = row.chatAvailable;
        if (Object.keys(patch).length) {
          writes.push(client.from("business_hours").update(patch).eq("day_of_week", dow));
        }
      });
    }

    /* Client navigation — including the visible flag, which the
       prototype set but the live site ignored. */
    if (Array.isArray(store.clientNav)) {
      store.clientNav.forEach(function (item, index) {
        var prior = (before.nav || []).filter(function (n) {
          return n.nav_key === item.id;
        })[0];
        if (!prior) return;
        var patch = {};
        if (changed(prior.label, item.label)) patch.label = item.label;
        if (changed(prior.visible, item.visible !== false)) patch.visible = item.visible !== false;
        if (changed(prior.sort_order, index + 1)) patch.sort_order = index + 1;
        if (Object.keys(patch).length) {
          writes.push(client.from("client_nav_items").update(patch).eq("nav_key", item.id));
        }
      });
    }

    /* =====================================================================
       MODIFICATION 5 — galleries, reviews, testimonial videos.
       =====================================================================
       Previously absent entirely: STORE.galleries / .reviews /
       .videoTestimonials were never inspected here, so editing any of
       them reported no error (the surrounding Promise.all still
       resolved) while writing nothing.

       Reuses the SAME diff pattern as company/hours/nav above, and the
       SAME column names already established and trusted elsewhere in
       this file — gallery_categories/projects/media from
       createCategory/createProject/createMediaRecord (lines ~469-503) —
       so nothing here is a new or guessed schema for those three
       tables.

       reviews / testimonial_videos have no create*() function in THIS
       file to confirm column names against, but every field used below
       (customer_name, customer_photo_path, review_text, date_label,
       project_label, location, testimonial_video_id, sort_order for
       reviews; title, description, thumbnail_path, video_path,
       customer_name, project_label, date_label, sort_order for
       testimonial_videos) is independently confirmed by
       js/db-service.js — the Client site's own loader, already part of
       this exact 18-file package — which reads every one of these same
       columns from the same two tables (see its "reviews" and
       "testimonial videos" mapping blocks). Verified against this
       package, not assumed from outside it.

       ID RECONCILIATION: a category/project with no matching row in
       `before` is treated as new and inserted via the EXISTING
       createCategory()/createProject() functions (not duplicated here).
       On success the caller's own in-memory object has its `id`
       overwritten with the real database id — see the returned
       `idMap` — and any project referencing the old temporary category
       id is re-pointed in the same pass, before its own write is
       considered. Gallery MEDIA creation is intentionally left to the
       existing upload pipeline (media-pipeline.js, out of scope here);
       this function only UPDATES media fields (caption/title/order/
       published) that can change after upload.
       ===================================================================== */
    var idMap = [];   // [{ type: 'category'|'project', tempId, realId }]

    var sectionByKey = {};
    (before.sections || []).forEach(function (s) { sectionByKey[s.section_key] = s; });

    var categoryInserts = [];  // deferred: need the real category id before projects can match

    Object.keys(store.galleries || {}).forEach(function (sectionKey) {
      var sectionRow = sectionByKey[sectionKey];
      if (!sectionRow) return;   // section not seeded — nothing to reconcile against
      var localGallery = store.galleries[sectionKey];

      (localGallery.categories || []).forEach(function (cat) {
        var priorRow = (before.categories || []).filter(function (row) {
          return row.section_id === sectionRow.id &&
                 (row.id === cat.id || row.slug === cat.id);
        })[0];

        if (!priorRow) {
          /* New category. Reuses createCategory() rather than a
             duplicate insert implementation. */
          var tempCatId = cat.id;
          categoryInserts.push(
            createCategory(sectionRow.id, cat.name, cat.order).then(function (res) {
              if (res.error) throw res.error;
              cat.id = res.data.id;   // reconcile the live STORE object
              /* Without this, a second edit to the same category later
                 in this session would find no matching prior row (the
                 array below still only reflects the last real load) and
                 be treated as new again, inserting a duplicate. */
              before.categories = before.categories || [];
              before.categories.push(res.data);
              idMap.push({ type: "category", tempId: tempCatId, realId: res.data.id });
              /* Re-point any project that referenced the old temp id,
                 so its own diff below matches correctly in this same
                 call rather than only after a future reload. */
              (localGallery.projects || []).forEach(function (p) {
                if (p.categoryId === tempCatId) p.categoryId = res.data.id;
              });
            })
          );
          return;
        }

        var catPatch = {};
        if (changed(priorRow.name, cat.name)) catPatch.name = cat.name;
        if (changed(priorRow.published, cat.published !== false)) catPatch.published = cat.published !== false;
        if (changed(priorRow.sort_order, cat.order)) catPatch.sort_order = cat.order;
        if (Object.keys(catPatch).length) {
          writes.push(client.from("gallery_categories").update(catPatch).eq("id", priorRow.id));
        }
      });
    });

    /* Projects are diffed AFTER category inserts resolve, so a project
       under a brand-new category has a real category_id to match and
       insert against. */
    var afterCategories = Promise.all(categoryInserts).then(function () {
      Object.keys(store.galleries || {}).forEach(function (sectionKey) {
        var localGallery = store.galleries[sectionKey];
        var mediaKey = (GALLERY_CONFIG_MEDIA_KEYS[sectionKey]) || "photos";

        (localGallery.projects || []).forEach(function (proj) {
          var priorProj = (before.projects || []).filter(function (row) {
            return row.id === proj.id;
          })[0];

          if (!priorProj) {
            /* New project. categoryId has already been reconciled above
               if it belonged to a brand-new category. */
            var tempProjId = proj.id;
            writes.push(
              createProject(proj.categoryId, proj.name, proj.description, proj.order)
                .then(function (res) {
                  if (res.error) throw res.error;
                  proj.id = res.data.id;
                  before.projects = before.projects || [];
                  before.projects.push(res.data);
                  idMap.push({ type: "project", tempId: tempProjId, realId: res.data.id });
                })
            );
            return;
          }

          var projPatch = {};
          if (changed(priorProj.name, proj.name)) projPatch.name = proj.name;
          if (changed(priorProj.description, proj.description)) projPatch.description = proj.description;
          if (changed(priorProj.published, proj.published !== false)) projPatch.published = proj.published !== false;
          if (changed(priorProj.sort_order, proj.order)) projPatch.sort_order = proj.order;
          if (changed(priorProj.category_id, proj.categoryId)) projPatch.category_id = proj.categoryId;
          if (Object.keys(projPatch).length) {
            writes.push(client.from("gallery_projects").update(projPatch).eq("id", priorProj.id));
          }

          /* Media: UPDATE only. Creation is owned by the upload
             pipeline, which already writes a real database row via
             createMediaRecord() at upload time — duplicating that here
             would risk a second, conflicting insert for the same file. */
          (proj[mediaKey] || []).forEach(function (m) {
            var priorMedia = (before.media || []).filter(function (row) {
              return row.id === m.id;
            })[0];
            if (!priorMedia) return;   // not yet a real row — nothing to update yet
            var mPatch = {};
            if (changed(priorMedia.title, m.title)) mPatch.title = m.title;
            if (changed(priorMedia.caption, m.caption)) mPatch.caption = m.caption;
            if (changed(priorMedia.published, m.published !== false)) mPatch.published = m.published !== false;
            if (changed(priorMedia.sort_order, m.order)) mPatch.sort_order = m.order;
            if (Object.keys(mPatch).length) {
              writes.push(client.from("gallery_media").update(mPatch).eq("id", priorMedia.id));
            }
          });
        });
      });
    });

    /* Reviews — flat collection, no categories/projects (Phase 10
       Part design, unchanged here). Column names per the ZIP 1 schema
       design; see the note at the top of this block. */
    ((store.reviews && store.reviews.items) || []).forEach(function (rv) {
      var priorRv = (before.reviews || []).filter(function (row) { return row.id === rv.id; })[0];

      if (!priorRv) {
        var tempRvId = rv.id;
        writes.push(
          client.from("reviews").insert({
            customer_name: rv.customerName || null,
            customer_photo_path: rv.customerPhoto || null,
            review_text: rv.text || null,
            date_label: rv.date || null,
            project_label: rv.project || null,
            location: rv.location || null,
            published: rv.published !== false,
            sort_order: rv.order || 1
          }).select("*").single().then(function (res) {
            if (res.error) throw res.error;
            rv.id = res.data.id;
            before.reviews = before.reviews || [];
            before.reviews.push(res.data);
            idMap.push({ type: "review", tempId: tempRvId, realId: res.data.id });
          })
        );
        return;
      }

      var rvPatch = {};
      if (changed(priorRv.customer_name, rv.customerName)) rvPatch.customer_name = rv.customerName;
      if (changed(priorRv.customer_photo_path, rv.customerPhoto)) rvPatch.customer_photo_path = rv.customerPhoto;
      if (changed(priorRv.review_text, rv.text)) rvPatch.review_text = rv.text;
      if (changed(priorRv.date_label, rv.date)) rvPatch.date_label = rv.date;
      if (changed(priorRv.project_label, rv.project)) rvPatch.project_label = rv.project;
      if (changed(priorRv.location, rv.location)) rvPatch.location = rv.location;
      if (changed(priorRv.published, rv.published !== false)) rvPatch.published = rv.published !== false;
      if (changed(priorRv.sort_order, rv.order)) rvPatch.sort_order = rv.order;
      if (Object.keys(rvPatch).length) {
        writes.push(client.from("reviews").update(rvPatch).eq("id", priorRv.id));
      }
    });

    /* Testimonial videos — own flat table, never gallery_media. */
    ((store.videoTestimonials && store.videoTestimonials.items) || []).forEach(function (tv) {
      var priorTv = (before.testimonials || []).filter(function (row) { return row.id === tv.id; })[0];
      if (!priorTv) return;   // creation is owned by the upload pipeline (uploadTestimonialVideo)

      var tvPatch = {};
      if (changed(priorTv.title, tv.title)) tvPatch.title = tv.title;
      if (changed(priorTv.description, tv.description)) tvPatch.description = tv.description;
      if (changed(priorTv.customer_name, tv.customerName)) tvPatch.customer_name = tv.customerName;
      if (changed(priorTv.project_label, tv.project)) tvPatch.project_label = tv.project;
      if (changed(priorTv.date_label, tv.date)) tvPatch.date_label = tv.date;
      if (changed(priorTv.published, tv.published !== false)) tvPatch.published = tv.published !== false;
      if (changed(priorTv.sort_order, tv.order)) tvPatch.sort_order = tv.order;
      if (Object.keys(tvPatch).length) {
        writes.push(client.from("testimonial_videos").update(tvPatch).eq("id", priorTv.id));
      }
    });

    return afterCategories.then(function () {
      return Promise.all(writes);
    }).then(function () {
      /* Re-snapshot from the STORE actually just written, matching the
         existing behaviour for company/hours/nav above. Categories/
         projects/media/reviews/testimonials keep their PREVIOUS raw
         snapshot shape (before.categories etc.) since this function
         does not re-fetch; the next real loadContent() call (e.g. on
         the next login) re-establishes a fully accurate baseline. */
      snapshots.content = snap({
        company: store.company,
        hours: before.hours,
        nav: before.nav,
        sections: before.sections,
        categories: before.categories,
        projects: before.projects,
        media: before.media,
        reviews: before.reviews,
        testimonials: before.testimonials
      });
      return { idMap: idMap };
    });
  }

  /* section_key -> which media array a project keeps its items in.
     Mirrors GALLERY_CONFIG in admin.js exactly (photos vs videos). */
  var GALLERY_CONFIG_MEDIA_KEYS = {
    "exterior-design": "photos",
    "completed-project-photos": "photos",
    "completed-project-videos": "videos",
    "interior-design": "photos",
    "ground-breaking": "photos"
  };

  /* Conversation state only — read status and archiving.
     Messages are written at the moment they are sent, not here. A
     message is not a draft, and there is no UPDATE policy on the
     messages table: sent text is immutable by design. */
  function persistConversationState(state) {
    var writes = [];
    (state.list || []).forEach(function (c) {
      var before = snapshots.conversations[c.conversationId];
      if (!before) return;

      if (changed(before.adminReadStatus, c.adminReadStatus)) {
        writes.push(setConversationReadStatus(c.conversationId, c.adminReadStatus));
      }
      if (changed(before.archived, c.archived)) {
        writes.push(
          client.from("conversations").update({ archived: c.archived })
            .eq("id", c.conversationId)
        );
      }
    });
    return Promise.all(writes).then(function () { return true; });
  }

  /* Staff self-service password reset. Supabase emails the link
     directly; nothing here sees or sets a password. Always resolves the
     same way, so this cannot be used to discover which staff addresses
     exist. */
  function requestStaffPasswordReset(email) {
    var addr = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      return Promise.reject(new Error("invalid email"));
    }
    /* MODIFICATION 7. The "#reset" marker mirrors the client site's own
       redirectTo (js/auth-service.js) — without it there was nothing
       for the returning page to detect, so the reset link landed on
       the plain login screen with no way to complete it. */
    return client.auth.resetPasswordForEmail(addr, {
      redirectTo: window.location.origin + window.location.pathname + "#reset"
    }).then(function () { return true; });
  }

  /* MODIFICATION 7 — completes the recovery flow. Mirrors the client
     site's AuthService.completePasswordReset() exactly: same minimum
     length, same Supabase call, same error shape. No password is
     logged; res.error is inspected only for its presence, never its
     contents. */
  function completeStaffPasswordReset(newPassword) {
    if (!newPassword || newPassword.length < 8) {
      return Promise.reject(new Error("Password must be at least 8 characters."));
    }
    return client.auth.updateUser({ password: newPassword })
      .then(function (res) {
        if (res.error) throw new Error("Could not update the password.");
        return true;
      });
  }

  window.LLCAdminBackend = {
    apiAdapter: supabaseApiAdapter,
    requestStaffPasswordReset: requestStaffPasswordReset,
    completeStaffPasswordReset: completeStaffPasswordReset,
    loadContent: loadContent,
    persistContent: persistContent,
    persistConversationState: persistConversationState,
    loadClients: loadClients,
    persistClients: persistClients,
    updateClientIdentity: updateClientIdentity,
    sendClientPasswordReset: sendClientPasswordReset,
    loadConversations: loadConversations,
    sendStaffMessage: sendStaffMessage,
    setConversationReadStatus: setConversationReadStatus,
    subscribeToInbox: subscribeToInbox,
    loadUsers: loadUsers,
    persistUsers: persistUsers,
    createCategory: createCategory,
    createProject: createProject,
    createMediaRecord: createMediaRecord,
    displayMobile: displayMobile
  };
})();
