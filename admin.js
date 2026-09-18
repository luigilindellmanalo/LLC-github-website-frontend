(function () {
  "use strict";

  /**
   * ============================================================
   * SHARED CONTENT MODEL (PROTOTYPE STORAGE — Phase 10 Part 2)
   * ============================================================
   * DEFAULT_STORE is a snapshot of the real Phase 9 Client content
   * (js/data.js): company info, business hours, and the Client's
   * actual public navigation array — same ids, same order, same
   * labels, same icons. Nothing here was invented.
   *
   * WHY localStorage: Save needs to actually commit and survive a
   * reload, which sessionStorage/in-memory variables don't do across
   * tabs or after closing the browser. localStorage is the browser's
   * standard mechanism for that.
   *
   * THIS IS PROTOTYPE STORAGE, NOT A PRODUCTION BACKEND:
   *   - It lives only in this browser, only in this browser profile.
   *   - It is NOT synced to any server, and it does NOT modify the
   *     actual Phase 9 Client HTML file at all — that file is a
   *     separate, untouched document. Editing here does not yet
   *     change what a real site visitor sees; wiring the two
   *     together is real backend work reserved for a later phase.
   *   - Photos are stored as base64 data URLs inside this same
   *     localStorage entry — fine for a prototype preview, not how a
   *     real media pipeline should work (no server-side file
   *     storage, no CDN, no size limits enforced beyond what the
   *     browser itself allows).
   *
   * WHY THE SHAPE MATTERS: company/hours/clientNav mirror the actual
   * fields and stable "id" values already used in js/data.js. A real
   * backend can later replace loadStore()/persistStore() with real
   * network calls without changing anything else in this file, and a
   * future Client integration can read this same shape — the id
   * values (e.g. "exterior-design") never change even when their
   * label does, exactly like the real Client data already works.
   */
  var STORAGE_KEY = "llc_admin_content_v1";

  var DEFAULT_STORE = {
    company: {
      name: "Luigi Lindell Construction",
      description: "We are a construction company that focuses on quality, building projects with best way and methodologies for new house construction, renovation, commercial building, resort development, hotel construction, subdivision housing, land development, industrial building and project development and management consultancy.",
      location: "Calaca City, Batangas, Philippines",
      mobile: "0975 526 6616",
      coverImage: "https://picsum.photos/seed/luigi-lindell-cover/1600/600",
      profileImage: "https://picsum.photos/seed/luigi-lindell-profile/240/240"
    },
    // Matches js/data.js exactly: Sunday is closed (open/close: null)
    // but still chatAvailable — office hours and chat are separate
    // concepts, never linked.
    hours: {
      timezone: "Asia/Manila",
      schedule: [
        { day: "Sunday", open: null, close: null, chatAvailable: true },
        { day: "Monday", open: "10:00", close: "17:00", chatAvailable: true },
        { day: "Tuesday", open: "10:00", close: "17:00", chatAvailable: true },
        { day: "Wednesday", open: "10:00", close: "17:00", chatAvailable: true },
        { day: "Thursday", open: "10:00", close: "17:00", chatAvailable: true },
        { day: "Friday", open: "10:00", close: "17:00", chatAvailable: true },
        { day: "Saturday", open: "10:00", close: "16:00", chatAvailable: true }
      ]
    },
    // Matches js/data.js "nav" array exactly — same 8 ids, same
    // order, same labels/icons. "visible" is the only new field,
    // added here for Admin show/hide; it defaults to true for every
    // item so nothing changes until the Admin explicitly hides one.
    clientNav: [
      { id: "about", label: "About", icon: "info", status: "active", visible: true },
      { id: "reviews", label: "Reviews", icon: "star", status: "active", visible: true },
      { id: "testimonial-videos", label: "Testimonial Videos", icon: "play", status: "active", visible: true },
      { id: "completed-project-photos", label: "Completed Project Photos", icon: "image", status: "active", visible: true },
      { id: "completed-project-videos", label: "Completed Project Videos", icon: "film", status: "active", visible: true },
      { id: "ground-breaking", label: "Ground Breaking", icon: "check", status: "active", visible: true },
      { id: "exterior-design", label: "Exterior Design", icon: "home", status: "active", visible: true },
      { id: "interior-design", label: "Interior Design", icon: "layout", status: "active", visible: true }
    ],

    /**
     * GALLERIES (Phase 10 Part 4)
     * ------------------------------------------------------------
     * Categories below are copied EXACTLY from the real js/data.js —
     * same ids, names, cover images, and order — for all 5 galleries
     * this Part manages. "projects" starts empty for every section,
     * matching js/data.js's real "projects: []" (the Client currently
     * falls back to data.js's separate "sampleProjects" for preview
     * only, which this Admin does not edit — those are static
     * reference content, not real data). Every real project/category/
     * media item the Admin adds here uses the same field names and
     * "published" visibility flag js/data.js already uses, so this
     * shape could feed a real Client integration later without a
     * redesign.
     */
    galleries: {
      "exterior-design": {
        categories: [
          { id: "bungalow", name: "Bungalow", coverImage: "https://picsum.photos/seed/llc-cat-bungalow/480/320", published: true, order: 1 },
          { id: "2-storey", name: "2 Storey", coverImage: "https://picsum.photos/seed/llc-cat-2storey/480/320", published: true, order: 2 },
          { id: "3-storey", name: "3 Storey", coverImage: "https://picsum.photos/seed/llc-cat-3storey/480/320", published: true, order: 3 }
        ],
        projects: []
      },
      "completed-project-photos": {
        categories: [
          { id: "bungalow", name: "Bungalow", coverImage: "https://picsum.photos/seed/llc-cpp-cat-bungalow/480/320", published: true, order: 1 },
          { id: "two-storey", name: "2 Storey", coverImage: "https://picsum.photos/seed/llc-cpp-cat-2storey/480/320", published: true, order: 2 },
          { id: "three-storey", name: "3 Storey", coverImage: "https://picsum.photos/seed/llc-cpp-cat-3storey/480/320", published: true, order: 3 },
          { id: "others", name: "Others", coverImage: "https://picsum.photos/seed/llc-cpp-cat-others/480/320", published: true, order: 4 }
        ],
        projects: []
      },
      "completed-project-videos": {
        categories: [
          { id: "bungalow", name: "Bungalow", coverImage: "https://picsum.photos/seed/llc-cpv-cat-bungalow/480/320", published: true, order: 1 },
          { id: "two-storey", name: "2 Storey", coverImage: "https://picsum.photos/seed/llc-cpv-cat-2storey/480/320", published: true, order: 2 },
          { id: "three-storey", name: "3 Storey", coverImage: "https://picsum.photos/seed/llc-cpv-cat-3storey/480/320", published: true, order: 3 },
          { id: "others", name: "Others", coverImage: "https://picsum.photos/seed/llc-cpv-cat-others/480/320", published: true, order: 4 }
        ],
        projects: []
      },
      "interior-design": {
        categories: [
          { id: "bungalow", name: "Bungalow", coverImage: "https://picsum.photos/seed/llc-int-cat-bungalow/480/320", published: true, order: 1 },
          { id: "two-storey", name: "2 Storey", coverImage: "https://picsum.photos/seed/llc-int-cat-2storey/480/320", published: true, order: 2 },
          { id: "three-storey", name: "3 Storey", coverImage: "https://picsum.photos/seed/llc-int-cat-3storey/480/320", published: true, order: 3 },
          { id: "others", name: "Others", coverImage: "https://picsum.photos/seed/llc-int-cat-others/480/320", published: true, order: 4 }
        ],
        projects: []
      },
      "ground-breaking": {
        categories: [
          { id: "bungalow", name: "Bungalow", coverImage: "https://picsum.photos/seed/llc-gb-cat-bungalow/480/320", published: true, order: 1 },
          { id: "two-storey", name: "2 Storey", coverImage: "https://picsum.photos/seed/llc-gb-cat-2storey/480/320", published: true, order: 2 },
          { id: "three-storey", name: "3 Storey", coverImage: "https://picsum.photos/seed/llc-gb-cat-3storey/480/320", published: true, order: 3 },
          { id: "others", name: "Others", coverImage: "https://picsum.photos/seed/llc-gb-cat-others/480/320", published: true, order: 4 }
        ],
        projects: []
      }
    },

    /**
     * REVIEWS & VIDEO TESTIMONIALS (Phase 10 correction)
     * ------------------------------------------------------------
     * Copied EXACTLY from the real js/data.js field shapes — these are
     * simple FLAT lists, deliberately kept separate from
     * STORE.galleries (they are top-level siblings in the real data
     * too, not a 6th gallery). "items" starts empty, matching the
     * real data's "items: []" — the real file's "sampleItems" are
     * static placeholder/demo content the Client falls back to and
     * are not something this Admin edits, so nothing fake is seeded
     * here.
     */
    reviews: {
      recommendPercent: 100,
      items: []
    },
    videoTestimonials: {
      items: []
    }
  };

  // Per-section engine config — mirrors GALLERY_SECTIONS in the Phase 9
  // Client's app.js exactly (same section ids, same mediaKey per
  // section) so the Admin's gallery shape matches the real one.
  var GALLERY_CONFIG = {
    "exterior-design": { label: "Exterior Design", mediaKey: "photos", mediaType: "photos", mediaNoun: "photo" },
    "completed-project-photos": { label: "Completed Project Photos", mediaKey: "photos", mediaType: "photos", mediaNoun: "photo" },
    "completed-project-videos": { label: "Completed Project Videos", mediaKey: "videos", mediaType: "videos", mediaNoun: "video" },
    "interior-design": { label: "Interior Design", mediaKey: "photos", mediaType: "photos", mediaNoun: "photo" },
    "ground-breaking": { label: "Ground Breaking", mediaKey: "photos", mediaType: "photos", mediaNoun: "photo" }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function loadStore() {
    var out = clone(DEFAULT_STORE);
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && saved.company) out.company = Object.assign({}, out.company, saved.company);
        if (saved && saved.hours && Array.isArray(saved.hours.schedule)) out.hours = saved.hours;
        if (saved && Array.isArray(saved.clientNav) && saved.clientNav.length) out.clientNav = saved.clientNav;
        if (saved && saved.galleries) {
          Object.keys(out.galleries).forEach(function (sectionId) {
            var savedSection = saved.galleries[sectionId];
            if (savedSection && Array.isArray(savedSection.categories) && Array.isArray(savedSection.projects)) {
              out.galleries[sectionId] = savedSection;
            }
          });
        }
        if (saved && saved.reviews && Array.isArray(saved.reviews.items)) out.reviews = saved.reviews;
        if (saved && saved.videoTestimonials && Array.isArray(saved.videoTestimonials.items)) out.videoTestimonials = saved.videoTestimonials;
      }
    } catch (e) {
      // Corrupt or inaccessible storage — fall back to the Phase 9 defaults.
    }
    return out;
  }

  /* MODIFICATION 3. Was gated on `window.LLCAdminBackend &&
     ...persistContent` — true unconditionally, since admin-supabase.js
     always defines that object regardless of whether Supabase is
     actually configured. That meant the local fallback below could
     never run once this file was deployed, even before any Supabase
     project existed: every save attempted a real network call to the
     placeholder URL, failed, and the edit was lost with no working
     fallback.

     Gated on useSupabase() now:
       NOT CONFIGURED -> local fallback, exactly as before.
       CONFIGURED     -> Supabase. A failure here is a REAL failure and
                         is reported as one below — never silently
                         treated as a successful save. */
  function persistStore() {
    if (useSupabase()) {
      /* New categories/projects/reviews are reconciled to their real
         database id INSIDE persistContent() itself, by mutating the
         same STORE objects this call already holds by reference —
         nothing further is needed here for that. */
      window.LLCAdminBackend.persistContent(STORE).catch(function (e) {
        showToast("Could not save to the database. Please try again.");
        if (window.console) console.error(e);
      });
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STORE));
    } catch (e) {
      // Most likely quota exceeded (a replaced photo can be large as a
      // base64 string) or storage disabled entirely in this browser.
      showToast("Could not save — browser storage is full or unavailable.");
    }
  }

  var STORE = loadStore();

  /**
   * ============================================================
   * ADMIN DASHBOARD UI
   * ============================================================
   */
  var ICONS = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="6" rx="7.5" ry="2.6"/><path d="M4.5 6v6c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6V6"/><path d="M4.5 12v6c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6v-6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.4"/><path d="M4 17l5-5 3 3 3.5-4L20 16"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><line x1="8" y1="4.5" x2="8" y2="19.5"/><line x1="16" y1="4.5" x2="16" y2="19.5"/><line x1="3.5" y1="9" x2="8" y2="9"/><line x1="16" y1="9" x2="20.5" y2="9"/><line x1="3.5" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="20.5" y2="15"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.6 2.6L16.3 9"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v9.5h12V10"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><line x1="3.5" y1="10.5" x2="20.5" y2="10.5"/><line x1="11.5" y1="10.5" x2="11.5" y2="19.5"/></svg>',
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5h16v11H9.5L5 20v-3.5H4z" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M15.2 14.2c2.4.2 4.3 1.9 4.3 4.3"/></svg>'
  };

  // Fixed Admin navigation order, per Phase 10 Part 1 spec.
  var ADMIN_NAV = [
    { id: "about", label: "About", icon: "info" },
    { id: "messages", label: "Messages", icon: "message" },
    { id: "database", label: "Database", icon: "database" },
    { id: "reviews", label: "Reviews", icon: "star" },
    { id: "testimonial-videos", label: "Testimonial Videos", icon: "play" },
    { id: "completed-project-photos", label: "Completed Project Photos", icon: "image" },
    { id: "completed-project-videos", label: "Completed Project Videos", icon: "film" },
    { id: "ground-breaking", label: "Ground Breaking", icon: "check" },
    { id: "exterior-design", label: "Exterior Design", icon: "home" },
    { id: "interior-design", label: "Interior Design", icon: "layout" },
    { id: "users", label: "Users", icon: "users" }
  ];

  // No entries needed anymore — Reviews, Testimonial Videos, and Users
  // are all real sections now. Kept as an empty fallback map (with
  // renderMain's generic fallback message) purely as future-proofing
  // in case a new unhandled nav id is ever added.
  var PLACEHOLDER_MESSAGES = {};

  // The 5 real Phase 9 galleries this Admin now fully manages (Phase 10 Part 4).
  var MANAGED_GALLERY_SECTIONS = {
    "completed-project-photos": true,
    "completed-project-videos": true,
    "ground-breaking": true,
    "exterior-design": true,
    "interior-design": true
  };

  var activeSection = ADMIN_NAV[0].id;

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function showToast(message) {
    var toast = document.getElementById("admin-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("toast--visible"); }, 3200);
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    document.getElementById("admin-cover-photo").src = STORE.company.coverImage;
    document.getElementById("admin-cover-photo").alt = STORE.company.name + " project sites";
    document.getElementById("admin-profile-photo").src = STORE.company.profileImage;
    document.getElementById("admin-profile-photo").alt = STORE.company.name + " logo";
    document.getElementById("admin-company-name").textContent = STORE.company.name;
    document.title = STORE.company.name + " — Admin";
  }

  /* ---------- Sidebar + mobile tab strip ---------- */
  function renderNav() {
    var list = document.getElementById("admin-nav-list");
    var strip = document.getElementById("admin-tab-strip");
    list.innerHTML = "";
    strip.innerHTML = "";

    getVisibleNavItems().forEach(function (item) {
      var li = el("li");
      var btn = el("button", "nav-item",
        '<span class="nav-item__icon">' + (ICONS[item.icon] || "") + "</span><span>" + item.label + "</span>");
      btn.setAttribute("aria-current", item.id === activeSection ? "true" : "false");
      btn.addEventListener("click", function () { selectSection(item.id); });
      li.appendChild(btn);
      list.appendChild(li);

      var tab = el("button", "tab-strip__item", item.label);
      tab.setAttribute("aria-current", item.id === activeSection ? "true" : "false");
      tab.addEventListener("click", function () { selectSection(item.id); });
      strip.appendChild(tab);
    });
  }

  function selectSection(id) {
    activeSection = id;
    renderNav();
    renderMain();
    document.getElementById("admin-main-content").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- About page: editable company content (Phase 10 Part 2) ---------- */

  function buildAboutPanel() {
    // Defense in depth: even if this were called directly (e.g. from a
    // browser console) bypassing renderMain's own check, it still
    // refuses for any role without edit permission.
    if (!can("edit")) return buildAccessDeniedPanel();
    var wrap = document.createElement("div");
    wrap.appendChild(buildAboutIntro());
    wrap.appendChild(buildCompanyInfoCard());
    wrap.appendChild(buildPhotoCard({
      title: "Cover Photo",
      storeKey: "coverImage",
      frameClass: "photo-preview-frame--cover",
      altSuffix: " cover photo"
    }));
    wrap.appendChild(buildPhotoCard({
      title: "Profile Photo",
      storeKey: "profileImage",
      frameClass: "photo-preview-frame--profile",
      altSuffix: " logo"
    }));
    wrap.appendChild(buildBusinessHoursCard());
    wrap.appendChild(buildContactCard());
    wrap.appendChild(buildNavManagerCard());
    return wrap;
  }

  function buildAboutIntro() {
    var panel = el("section", "panel");
    panel.innerHTML =
      '<span class="coming-soon__badge">Phase 10 — Part 2</span>' +
      '<h2 class="panel__title" style="margin-top:10px;">About &amp; Company Content</h2>' +
      '<div class="panel__body"><p>Edit the company profile the Client site is meant to show. Every card below ' +
      'follows the same pattern: tap Edit, make changes, then Save to commit them or Cancel to discard them — ' +
      'nothing changes until you tap Save.</p></div>';
    return panel;
  }

  // ---- Company Information (name, description, location) ----
  function buildCompanyInfoCard() {
    var panel = el("section", "panel edit-card");
    var draft = null;

    function renderView() {
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Company Information</h2></div>' +
        '<ul class="panel__meta-list">' +
          '<li><b>Company Name</b><span data-f="name"></span></li>' +
          '<li><b>Description</b><span data-f="description"></span></li>' +
          '<li><b>Location</b><span data-f="location"></span></li>' +
        '</ul>';
      panel.querySelector('[data-f="name"]').textContent = STORE.company.name;
      panel.querySelector('[data-f="description"]').textContent = STORE.company.description;
      panel.querySelector('[data-f="location"]').textContent = STORE.company.location;
      addEditButton(panel, renderEdit);
    }

    function renderEdit() {
      draft = { name: STORE.company.name, description: STORE.company.description, location: STORE.company.location };
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Edit Company Information</h2></div>' +
        '<label class="field">Company Name<input type="text" data-f="name"></label>' +
        '<label class="field">Description<textarea data-f="description" rows="4"></textarea></label>' +
        '<label class="field">Location / Address<input type="text" data-f="location"></label>' +
        '<div class="card-actions"></div>';

      panel.querySelector('[data-f="name"]').value = draft.name;
      panel.querySelector('[data-f="description"]').value = draft.description;
      panel.querySelector('[data-f="location"]').value = draft.location;

      panel.querySelector('[data-f="name"]').addEventListener("input", function (e) { draft.name = e.target.value; });
      panel.querySelector('[data-f="description"]').addEventListener("input", function (e) { draft.description = e.target.value; });
      panel.querySelector('[data-f="location"]').addEventListener("input", function (e) { draft.location = e.target.value; });

      addSaveCancel(panel, function save() {
        STORE.company.name = draft.name.trim() || STORE.company.name;
        STORE.company.description = draft.description;
        STORE.company.location = draft.location;
        persistStore();
        renderHeader();
        renderView();
        showToast("Changes saved");
      }, function cancel() {
        draft = null;
        renderView(); // untouched — draft is simply discarded
      });
    }

    renderView();
    return panel;
  }

  // ---- Cover Photo / Profile Photo (shared builder) ----
  function buildPhotoCard(options) {
    var panel = el("section", "panel edit-card");
    var draftDataUrl = null;

    function renderView() {
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">' + options.title + '</h2></div>' +
        '<div class="photo-preview-row">' +
          '<div class="photo-preview-frame ' + options.frameClass + '"><img data-f="img" alt=""></div>' +
        '</div>';
      var img = panel.querySelector('[data-f="img"]');
      img.src = STORE.company[options.storeKey];
      img.alt = STORE.company.name + options.altSuffix;

      addEditButton(panel, renderEdit, "Replace " + options.title);
    }

    function renderEdit() {
      draftDataUrl = STORE.company[options.storeKey];
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Replace ' + options.title + '</h2></div>' +
        '<div class="photo-preview-row">' +
          '<div class="photo-preview-frame ' + options.frameClass + '"><img data-f="preview" alt="Preview"></div>' +
          '<div class="photo-edit-controls">' +
            '<p class="photo-hint">Choose an image file to preview it here — this is a live, unsaved preview; ' +
            'nothing changes until you tap Save. Stored in this browser only for this prototype (no permanent ' +
            'file server yet).</p>' +
            '<input type="file" accept="image/*" data-f="file">' +
            '<div class="card-actions"></div>' +
          '</div>' +
        '</div>';

      var previewImg = panel.querySelector('[data-f="preview"]');
      previewImg.src = draftDataUrl;
      previewImg.alt = "Preview of new " + options.title.toLowerCase();

      panel.querySelector('[data-f="file"]').addEventListener("change", function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        /* D17: company assets are optimized for their display size.
           Was base64 into localStorage; now Storage + a path. */
        previewImg.src = URL.createObjectURL(file);
        var kind = options.storeKey === "coverImage" ? "company-cover" : "company-logo";
        showToast("Optimizing\u2026");
        window.LLCMedia.uploadDisplayAsset(file, kind)
          .then(function (out) {
            draftDataUrl = out.path;
            showToast("Ready to save.");
          })
          .catch(function (err) {
            showToast("That image could not be prepared.");
            if (window.console) console.error(err);
          });
      });

      addSaveCancel(panel, function save() {
        STORE.company[options.storeKey] = draftDataUrl;
        persistStore();
        renderHeader();
        renderView();
        showToast("Changes saved");
      }, function cancel() {
        draftDataUrl = null;
        renderView(); // reads straight from STORE — restores the previous image exactly
      });
    }

    renderView();
    return panel;
  }

  // ---- Business Hours ----
  function to12Hour(t) {
    if (!t) return "";
    var parts = t.split(":");
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var ap = h >= 12 ? "PM" : "AM";
    var hh = h % 12;
    if (hh === 0) hh = 12;
    return hh + ":" + m + " " + ap;
  }

  function buildBusinessHoursCard() {
    var panel = el("section", "panel edit-card");
    var draft = null;

    function renderView() {
      var rows = STORE.hours.schedule.map(function (d) {
        var timeText = d.open ? (to12Hour(d.open) + " – " + to12Hour(d.close)) : "Closed";
        var chatTag = d.chatAvailable !== false ? '<span class="chat-tag">Chat available</span>' : "";
        return "<li><span>" + d.day + "</span><span>" + timeText + chatTag + "</span></li>";
      }).join("");

      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Business Hours</h2></div>' +
        '<ul class="hours-view-list">' + rows + '</ul>' +
        '<p class="hours-caption">Chat availability is separate from office hours — a day can be Closed and ' +
        'still offer Chat, exactly like Sunday above.</p>';

      addEditButton(panel, renderEdit);
    }

    function renderEdit() {
      draft = clone(STORE.hours.schedule);
      var rowsHtml = draft.map(function (d, i) {
        return (
          '<div class="hours-editor-row" data-idx="' + i + '">' +
            '<span class="hours-editor-row__day">' + d.day + '</span>' +
            '<label class="inline-check"><input type="checkbox" data-f="open-toggle"' + (d.open ? " checked" : "") + '> Open</label>' +
            '<input type="time" data-f="open-time" value="' + (d.open || "") + '"' + (d.open ? "" : " disabled") + '>' +
            '<input type="time" data-f="close-time" value="' + (d.close || "") + '"' + (d.open ? "" : " disabled") + '>' +
            '<label class="inline-check"><input type="checkbox" data-f="chat-toggle"' + (d.chatAvailable !== false ? " checked" : "") + '> Chat</label>' +
          '</div>'
        );
      }).join("");

      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Edit Business Hours</h2></div>' +
        '<div data-f="rows">' + rowsHtml + '</div>' +
        '<p class="hours-caption">Turning "Open" off sets that day to Closed. "Chat" is completely independent — ' +
        'closing a day never turns its Chat off, and it stays off if you turn it off yourself, unless you change it here.</p>' +
        '<div class="card-actions"></div>';

      Array.prototype.forEach.call(panel.querySelectorAll(".hours-editor-row"), function (rowEl) {
        var idx = parseInt(rowEl.getAttribute("data-idx"), 10);
        var openToggle = rowEl.querySelector('[data-f="open-toggle"]');
        var openTime = rowEl.querySelector('[data-f="open-time"]');
        var closeTime = rowEl.querySelector('[data-f="close-time"]');
        var chatToggle = rowEl.querySelector('[data-f="chat-toggle"]');

        openToggle.addEventListener("change", function () {
          var isOpen = openToggle.checked;
          openTime.disabled = !isOpen;
          closeTime.disabled = !isOpen;
          if (isOpen) {
            if (!openTime.value) openTime.value = "09:00";
            if (!closeTime.value) closeTime.value = "17:00";
            draft[idx].open = openTime.value;
            draft[idx].close = closeTime.value;
          } else {
            draft[idx].open = null;
            draft[idx].close = null;
          }
        });
        openTime.addEventListener("input", function () { draft[idx].open = openTime.value; });
        closeTime.addEventListener("input", function () { draft[idx].close = closeTime.value; });
        // Chat is a separate field on the same draft row — it is never
        // touched by the open/close handlers above, and vice versa.
        chatToggle.addEventListener("change", function () { draft[idx].chatAvailable = chatToggle.checked; });
      });

      addSaveCancel(panel, function save() {
        STORE.hours.schedule = draft;
        persistStore();
        renderView();
        showToast("Changes saved");
      }, function cancel() {
        draft = null;
        renderView();
      });
    }

    renderView();
    return panel;
  }

  // ---- Contact Number ----
  function buildContactCard() {
    var panel = el("section", "panel edit-card");
    var draft = null;

    function renderView() {
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Contact Number</h2></div>' +
        '<ul class="panel__meta-list"><li><b>Mobile</b><span data-f="mobile"></span></li></ul>';
      panel.querySelector('[data-f="mobile"]').textContent = STORE.company.mobile;
      addEditButton(panel, renderEdit);
    }

    function renderEdit() {
      draft = { mobile: STORE.company.mobile };
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Edit Contact Number</h2></div>' +
        '<label class="field">Mobile Number<input type="tel" data-f="mobile"></label>' +
        '<p class="hours-caption">The Client\u2019s Call button keeps using a real tel: link built from this number \u2014 no Messenger, WhatsApp, or Viber is added.</p>' +
        '<div class="card-actions"></div>';
      panel.querySelector('[data-f="mobile"]').value = draft.mobile;
      panel.querySelector('[data-f="mobile"]').addEventListener("input", function (e) { draft.mobile = e.target.value; });

      addSaveCancel(panel, function save() {
        STORE.company.mobile = draft.mobile.trim() || STORE.company.mobile;
        persistStore();
        renderView();
        showToast("Changes saved");
      }, function cancel() {
        draft = null;
        renderView();
      });
    }

    renderView();
    return panel;
  }

  // ---- Client Navigation Manager (rename / show-hide / reorder) ----
  function buildNavManagerCard() {
    var panel = el("section", "panel edit-card");
    var draft = null;
    var dragFromIndex = null;

    function renderView() {
      var rows = STORE.clientNav.map(function (item) {
        var hiddenBadge = item.visible === false ? '<span class="hidden-badge">Hidden</span>' : "";
        return (
          '<li class="nav-manager-item' + (item.visible === false ? " nav-manager-item--hidden" : "") + '">' +
            '<div class="nav-manager-item__body">' +
              "<div>" + item.label + hiddenBadge + "</div>" +
              '<p class="nav-manager-item__id">ID: ' + item.id + "</p>" +
            "</div>" +
          "</li>"
        );
      }).join("");

      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Client Public Navigation</h2></div>' +
        '<p class="nav-manager-hint">This is the actual Phase 9 navigation, in its current order. Renaming an ' +
        'item never changes its ID.</p>' +
        '<ul class="nav-manager-list">' + rows + '</ul>';

      addEditButton(panel, renderEdit, "Edit Navigation");
    }

    function renderEdit() {
      if (!draft) draft = clone(STORE.clientNav);
      renderEditRows();
    }

    function renderEditRows() {
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Edit Client Navigation</h2></div>' +
        '<p class="nav-manager-hint">Drag the handle to reorder on desktop, or use \u25B2 \u25BC \u2014 those work ' +
        'everywhere, including Android. Renaming never changes an item\u2019s ID.</p>' +
        '<ul class="nav-manager-list" data-f="list"></ul>' +
        '<div class="card-actions"></div>';

      var list = panel.querySelector('[data-f="list"]');

      draft.forEach(function (item, idx) {
        var li = document.createElement("li");
        li.className = "nav-manager-item" + (item.visible === false ? " nav-manager-item--hidden" : "");
        li.setAttribute("draggable", "true");

        li.innerHTML =
          '<span class="nav-manager-item__handle" title="Drag to reorder">' + ICONS.layout + "</span>" +
          '<div class="nav-manager-item__body">' +
            '<input type="text" class="nav-rename-input" data-f="label">' +
            '<p class="nav-manager-item__id">ID: ' + item.id + " (fixed)</p>" +
          "</div>" +
          '<label class="switch nav-manager-item__visibility">' +
            '<input type="checkbox" data-f="visible">' +
            '<span class="switch__track"></span>' +
            (item.visible !== false ? "Visible" : "Hidden") +
          "</label>" +
          '<div class="nav-manager-item__reorder">' +
            '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + ">\u25B2</button>" +
            '<button type="button" data-f="down"' + (idx === draft.length - 1 ? " disabled" : "") + ">\u25BC</button>" +
          "</div>";

        li.querySelector('[data-f="label"]').value = item.label;
        li.querySelector('[data-f="visible"]').checked = item.visible !== false;

        list.appendChild(li);

        li.querySelector('[data-f="label"]').addEventListener("input", function (e) {
          draft[idx].label = e.target.value;
        });
        li.querySelector('[data-f="visible"]').addEventListener("change", function (e) {
          draft[idx].visible = e.target.checked;
          renderEditRows(); // refresh the dimmed/"Hidden" styling
        });
        li.querySelector('[data-f="up"]').addEventListener("click", function () { moveDraftItem(idx, idx - 1); });
        li.querySelector('[data-f="down"]').addEventListener("click", function () { moveDraftItem(idx, idx + 1); });

        li.addEventListener("dragstart", function (e) {
          dragFromIndex = idx;
          li.classList.add("is-dragging");
          e.dataTransfer.effectAllowed = "move";
          try { e.dataTransfer.setData("text/plain", String(idx)); } catch (err) { /* Safari needs the try/catch, value unused */ }
        });
        li.addEventListener("dragend", function () {
          li.classList.remove("is-dragging");
          dragFromIndex = null;
        });
        li.addEventListener("dragover", function (e) { e.preventDefault(); });
        li.addEventListener("drop", function (e) {
          e.preventDefault();
          if (dragFromIndex === null || dragFromIndex === idx) return;
          moveDraftItem(dragFromIndex, idx);
        });
      });

      addSaveCancel(panel, function save() {
        STORE.clientNav = draft;
        persistStore();
        draft = null;
        renderView();
        showToast("Changes saved");
      }, function cancel() {
        draft = null;
        renderView();
      });
    }

    function moveDraftItem(from, to) {
      if (to < 0 || to >= draft.length) return;
      var item = draft.splice(from, 1)[0];
      draft.splice(to, 0, item);
      renderEditRows();
    }

    renderView();
    return panel;
  }

  // ---- Shared Edit / Save / Cancel button wiring ----
  function addEditButton(panel, onClick, label) {
    var head = panel.querySelector(".card-head");
    var btn = el("button", "btn btn--secondary btn--sm", label || "Edit");
    btn.type = "button";
    btn.addEventListener("click", onClick);
    head.appendChild(btn);
  }

  function addSaveCancel(panel, onSave, onCancel) {
    var actions = panel.querySelector(".card-actions");
    var saveBtn = el("button", "btn btn--primary btn--sm", "Save");
    saveBtn.type = "button";
    saveBtn.addEventListener("click", onSave);

    var cancelBtn = el("button", "btn btn--secondary btn--sm", "Cancel");
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", onCancel);

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
  }

  function buildPlaceholderPanel(label, message) {
    var panel = el("section", "panel coming-soon");
    panel.innerHTML =
      '<span class="coming-soon__badge">Phase 10 — Part 1 foundation</span>' +
      '<h2 class="coming-soon__title">' + label + '</h2>' +
      '<p class="coming-soon__body">' + message + '</p>';
    return panel;
  }

  /* ============================================================
   * GALLERY / MEDIA MANAGEMENT (Phase 10 Part 4)
   * ============================================================
   * Manages the same 5 real Phase 9 galleries — exterior-design,
   * completed-project-photos, completed-project-videos,
   * interior-design, ground-breaking — using the exact category ids,
   * names, and order already defined in js/data.js (see
   * DEFAULT_STORE.galleries above). This never reads or writes
   * js/data.js itself, or any Phase 9 Client file; it is the Admin's
   * own snapshot, following the same shape so a future shared backend
   * could serve both from one source without a redesign.
   *
   * Field names intentionally match the real data: "published" for
   * visibility (categories, projects, and media all use it, exactly
   * like js/data.js), "coverPhotoId" for the project cover (a stable
   * media id — never a separately duplicated image URL), and stable
   * "id" values on every category/project/media item that never
   * change when the item is renamed.
   */

  function genId(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function galleryData(sectionId) { return STORE.galleries[sectionId]; }

  function getCategories(sectionId) {
    return galleryData(sectionId).categories.slice().sort(function (a, b) { return a.order - b.order; });
  }
  function getCategoryById(sectionId, id) {
    return galleryData(sectionId).categories.filter(function (c) { return c.id === id; })[0];
  }
  function getProjectsForCategory(sectionId, categoryId) {
    return galleryData(sectionId).projects
      .filter(function (p) { return p.categoryId === categoryId; })
      .sort(function (a, b) { return a.order - b.order; });
  }
  function getProjectById(sectionId, projectId) {
    return galleryData(sectionId).projects.filter(function (p) { return p.id === projectId; })[0];
  }
  function getMediaList(sectionId, project) {
    var key = GALLERY_CONFIG[sectionId].mediaKey;
    return (project[key] || []).slice().sort(function (a, b) { return a.order - b.order; });
  }
  function resolveCoverSrc(sectionId, project) {
    var key = GALLERY_CONFIG[sectionId].mediaKey;
    var all = project[key] || [];
    var chosen = all.filter(function (m) { return m.id === project.coverPhotoId; })[0] || all[0];
    if (!chosen) return null;
    return chosen.image || chosen.thumbnail || null;
  }

  function nextOrder(list) {
    var max = 0;
    list.forEach(function (item) { if (item.order > max) max = item.order; });
    return max + 1;
  }

  function moveItemOrder(sortedList, id, delta) {
    var idx = -1;
    for (var i = 0; i < sortedList.length; i++) { if (sortedList[i].id === id) { idx = i; break; } }
    var newIdx = idx + delta;
    if (idx === -1 || newIdx < 0 || newIdx >= sortedList.length) return false;
    var tmp = sortedList[idx];
    sortedList[idx] = sortedList[newIdx];
    sortedList[newIdx] = tmp;
    sortedList.forEach(function (item, i2) { item.order = i2 + 1; });
    return true;
  }

  function reorderListByDrag(sortedList, fromId, toId) {
    var fromIdx = -1, toIdx = -1;
    sortedList.forEach(function (x, i) { if (x.id === fromId) fromIdx = i; if (x.id === toId) toIdx = i; });
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return false;
    var item = sortedList.splice(fromIdx, 1)[0];
    sortedList.splice(toIdx, 0, item);
    sortedList.forEach(function (it, i) { it.order = i + 1; });
    return true;
  }

  function removeMediaAndFixCover(sectionId, project, mediaId) {
    var key = GALLERY_CONFIG[sectionId].mediaKey;
    project[key] = (project[key] || []).filter(function (m) { return m.id !== mediaId; });
    var stillValid = project[key].some(function (m) { return m.id === project.coverPhotoId; });
    if (!stillValid) {
      var firstPublished = project[key].filter(function (m) { return m.published; })[0];
      project.coverPhotoId = firstPublished ? firstPublished.id : (project[key][0] ? project[key][0].id : null);
    }
  }

  function buildBackLink(text, onClick) {
    var back = el("button", "back-link", "\u2190 " + text);
    back.type = "button";
    back.addEventListener("click", onClick);
    return back;
  }

  function generateVideoThumbnail(objectUrl, callback) {
    var videoEl = document.createElement("video");
    videoEl.muted = true;
    videoEl.playsInline = true;
    var settled = false;
    function finish(dataUrl) {
      if (settled) return;
      settled = true;
      callback(dataUrl);
    }
    videoEl.addEventListener("loadeddata", function () {
      try { videoEl.currentTime = Math.min(1, (videoEl.duration || 2) / 2); }
      catch (e) { finish(null); }
    });
    videoEl.addEventListener("seeked", function () {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth || 320;
        canvas.height = videoEl.videoHeight || 180;
        canvas.getContext("2d").drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.7));
      } catch (e) { finish(null); }
    });
    videoEl.addEventListener("error", function () { finish(null); });
    videoEl.src = objectUrl;
    setTimeout(function () { finish(null); }, 4000);
  }

  var adminGalleryStates = {};
  function getGalleryAdminState(sectionId) {
    if (!adminGalleryStates[sectionId]) {
      adminGalleryStates[sectionId] = { level: "categories", categoryId: null, projectId: null };
    }
    return adminGalleryStates[sectionId];
  }

  function buildGalleryAdminPanel(sectionId) {
    // Defense in depth: gallery management (rename/delete/upload/etc.)
    // is Admin-only for Part 6A — a dedicated, more limited Uploader
    // workflow is Part 6B's job, not this one's.
    if (!can("edit")) {
      var denied = document.createElement("div");
      denied.appendChild(buildAccessDeniedPanel());
      return denied;
    }
    var config = GALLERY_CONFIG[sectionId];
    var container = document.createElement("div");
    var dragFromId = null;

    function state() { return getGalleryAdminState(sectionId); }
    function goRoot() { var s = state(); s.level = "categories"; s.categoryId = null; s.projectId = null; render(); }
    function goProjects(categoryId) { var s = state(); s.level = "projects"; s.categoryId = categoryId; s.projectId = null; render(); }
    function goMedia(categoryId, projectId) { var s = state(); s.level = "media"; s.categoryId = categoryId; s.projectId = projectId; render(); }

    function render() {
      container.innerHTML = "";
      container.appendChild(buildBreadcrumb());
      var s = state();
      if (s.level === "categories") container.appendChild(buildCategoryScreen());
      else if (s.level === "projects") container.appendChild(buildProjectsScreen());
      else container.appendChild(buildMediaScreen());
    }

    function buildBreadcrumb() {
      var s = state();
      var nav = el("nav", "breadcrumb");
      var root = el("button", "breadcrumb__item", config.label);
      root.type = "button";
      if (s.level === "categories") root.setAttribute("aria-current", "true");
      root.addEventListener("click", goRoot);
      nav.appendChild(root);

      if (s.categoryId) {
        var cat = getCategoryById(sectionId, s.categoryId);
        nav.appendChild(el("span", "breadcrumb__sep", "/"));
        var catCrumb = el("button", "breadcrumb__item", cat ? cat.name : "");
        catCrumb.type = "button";
        if (s.level === "projects") catCrumb.setAttribute("aria-current", "true");
        catCrumb.addEventListener("click", function () { goProjects(s.categoryId); });
        nav.appendChild(catCrumb);
      }
      if (s.projectId) {
        var proj = getProjectById(sectionId, s.projectId);
        nav.appendChild(el("span", "breadcrumb__sep", "/"));
        var pCrumb = el("span", "breadcrumb__item breadcrumb__item--current", proj ? proj.name : "");
        pCrumb.setAttribute("aria-current", "true");
        nav.appendChild(pCrumb);
      }
      return nav;
    }

    function buildCategoryScreen() {
      var panel = el("section", "panel");
      var categories = getCategories(sectionId);

      var head = el("div", "gm-toolbar");
      head.innerHTML = '<div class="gm-toolbar__title"><h2 class="panel__title" style="margin:0;">' + config.label + '</h2></div>';
      var addBtn = el("button", "btn btn--primary btn--sm", "+ Add Category");
      addBtn.type = "button";
      head.querySelector(".gm-toolbar__title").appendChild(addBtn);
      panel.appendChild(head);

      var formHolder = el("div");
      panel.appendChild(formHolder);
      addBtn.addEventListener("click", function () {
        formHolder.innerHTML = "";
        var form = el("div", "gm-inline-form");
        form.innerHTML =
          '<label class="field">Category Name<input type="text" data-f="name"></label>' +
          '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Save</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>';
        formHolder.appendChild(form);
        form.querySelector('[data-f="cancel"]').addEventListener("click", function () { formHolder.innerHTML = ""; });
        form.querySelector('[data-f="save"]').addEventListener("click", function () {
          var name = form.querySelector('[data-f="name"]').value.trim();
          if (!name) return;
          var cats = galleryData(sectionId).categories;
          cats.push({ id: genId("cat"), name: name, coverImage: null, published: true, order: nextOrder(cats) });
          persistStore();
          formHolder.innerHTML = "";
          render();
          showToast("Category added");
        });
      });

      var grid = el("div", "album-grid");
      categories.forEach(function (cat, idx) { grid.appendChild(buildCategoryCard(cat, idx, categories)); });
      panel.appendChild(grid);

      return panel;
    }

    function buildCategoryCard(cat, idx, sortedList) {
      var card = el("div", "album-card" + (cat.published === false ? " album-card--hidden" : ""));
      card.setAttribute("draggable", "true");

      function renderView() {
        var projectCount = getProjectsForCategory(sectionId, cat.id).length;
        card.innerHTML =
          '<button type="button" class="album-card__link" data-f="open">' +
            '<span class="album-card__thumb">' +
              (cat.coverImage ? '<img src="' + escapeAttr(safeMediaUrl(cat.coverImage)) + '" alt="">' : '<span class="album-card__thumb--empty">' + ICONS.image + '</span>') +
            '</span>' +
            '<span class="album-card__body">' +
              '<span class="album-card__name">' + cat.name + (cat.published === false ? ' <span class="hidden-tag">Hidden</span>' : '') + '</span>' +
              '<span class="album-card__meta">' + projectCount + ' project' + (projectCount === 1 ? '' : 's') + '</span>' +
            '</span>' +
          '</button>' +
          '<div class="gm-card-actions">' +
            '<span class="gm-reorder">' +
              '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + '>\u25B2</button>' +
              '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + '>\u25BC</button>' +
            '</span>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="rename">Rename</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">' + (cat.published === false ? "Show" : "Hide") + '</button>' +
            '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
          '</div>';

        card.querySelector('[data-f="open"]').addEventListener("click", function () { goProjects(cat.id); });
        card.querySelector('[data-f="up"]').addEventListener("click", function () { if (moveItemOrder(sortedList, cat.id, -1)) { persistStore(); render(); } });
        card.querySelector('[data-f="down"]').addEventListener("click", function () { if (moveItemOrder(sortedList, cat.id, 1)) { persistStore(); render(); } });
        card.querySelector('[data-f="rename"]').addEventListener("click", renderRename);
        card.querySelector('[data-f="toggle"]').addEventListener("click", function () {
          cat.published = cat.published === false ? true : false;
          persistStore();
          render();
          showToast(cat.published ? "Category shown" : "Category hidden");
        });
        card.querySelector('[data-f="delete"]').addEventListener("click", function () {
          var pCount = getProjectsForCategory(sectionId, cat.id).length;
          showConfirmDialog({
            title: "Delete this category permanently?",
            body: pCount > 0
              ? "This category contains " + pCount + " project" + (pCount === 1 ? "" : "s") + ". Deleting it will also remove " + (pCount === 1 ? "that project" : "those projects") + " and their media. This cannot be undone."
              : "This cannot be undone.",
            confirmLabel: "Delete Permanently",
            onConfirm: function () {
              galleryData(sectionId).categories = galleryData(sectionId).categories.filter(function (c) { return c.id !== cat.id; });
              galleryData(sectionId).projects = galleryData(sectionId).projects.filter(function (p) { return p.categoryId !== cat.id; });
              persistStore();
              render();
              showToast("Category deleted");
            }
          });
        });
      }

      function renderRename() {
        card.innerHTML =
          '<div class="rename-row"><input type="text" data-f="input">' +
          '<button type="button" class="db-save" data-f="save" title="Save">\u2713</button>' +
          '<button type="button" class="db-cancel" data-f="cancel" title="Cancel">\u2715</button></div>';
        var input = card.querySelector('[data-f="input"]');
        input.value = cat.name;
        card.querySelector('[data-f="cancel"]').addEventListener("click", renderView);
        card.querySelector('[data-f="save"]').addEventListener("click", function () {
          var v = input.value.trim();
          if (v) { cat.name = v; persistStore(); showToast("Changes saved"); }
          renderView();
        });
      }

      card.addEventListener("dragstart", function (e) {
        dragFromId = cat.id;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", cat.id); } catch (err) { }
      });
      card.addEventListener("dragend", function () { card.classList.remove("is-dragging"); dragFromId = null; });
      card.addEventListener("dragover", function (e) { e.preventDefault(); });
      card.addEventListener("drop", function (e) {
        e.preventDefault();
        if (dragFromId && dragFromId !== cat.id && reorderListByDrag(sortedList, dragFromId, cat.id)) {
          persistStore();
          render();
        }
      });

      renderView();
      return card;
    }

    function buildProjectsScreen() {
      var s = state();
      var category = getCategoryById(sectionId, s.categoryId);
      var projects = getProjectsForCategory(sectionId, s.categoryId);
      var panel = el("section", "panel");

      var backRow = el("div", "back-row");
      backRow.appendChild(buildBackLink(config.label, goRoot));
      panel.appendChild(backRow);

      var head = el("div", "gm-toolbar");
      head.innerHTML = '<div class="gm-toolbar__title"><h2 class="panel__title" style="margin:0;">' + (category ? category.name : "") + ' Projects</h2></div>';
      var addBtn = el("button", "btn btn--primary btn--sm", "+ Add Project");
      addBtn.type = "button";
      head.querySelector(".gm-toolbar__title").appendChild(addBtn);
      panel.appendChild(head);

      var formHolder = el("div");
      panel.appendChild(formHolder);
      addBtn.addEventListener("click", function () {
        formHolder.innerHTML = "";
        var form = el("div", "gm-inline-form");
        form.innerHTML =
          '<label class="field">Project Name<input type="text" data-f="name"></label>' +
          '<label class="field">Description (optional)<textarea data-f="desc" rows="2"></textarea></label>' +
          '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Save</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>';
        formHolder.appendChild(form);
        form.querySelector('[data-f="cancel"]').addEventListener("click", function () { formHolder.innerHTML = ""; });
        form.querySelector('[data-f="save"]').addEventListener("click", function () {
          var name = form.querySelector('[data-f="name"]').value.trim();
          if (!name) return;
          var projs = galleryData(sectionId).projects;
          var mediaKey = config.mediaKey;
          var siblings = projs.filter(function (p) { return p.categoryId === s.categoryId; });
          var newProject = {
            id: genId("proj"), categoryId: s.categoryId, name: name,
            description: form.querySelector('[data-f="desc"]').value.trim() || null,
            coverPhotoId: null, published: true, order: nextOrder(siblings)
          };
          newProject[mediaKey] = [];
          projs.push(newProject);
          persistStore();
          formHolder.innerHTML = "";
          render();
          showToast("Project added");
        });
      });

      if (projects.length === 0) {
        var empty = el("div");
        empty.innerHTML =
          '<h3 class="empty-state__title">No projects yet.</h3>' +
          '<p class="empty-state__body">Projects will appear here once you add one.</p>';
        panel.appendChild(empty);
      } else {
        var grid = el("div", "album-grid");
        projects.forEach(function (p, idx) { grid.appendChild(buildProjectCard(p, idx, projects)); });
        panel.appendChild(grid);
      }

      return panel;
    }

    function buildProjectCard(p, idx, sortedList) {
      var card = el("div", "album-card" + (p.published === false ? " album-card--hidden" : ""));
      card.setAttribute("draggable", "true");

      function renderView() {
        var coverSrc = resolveCoverSrc(sectionId, p);
        var mediaCount = getMediaList(sectionId, p).length;
        card.innerHTML =
          '<button type="button" class="album-card__link" data-f="open">' +
            '<span class="album-card__thumb">' +
              (coverSrc ? '<img src="' + escapeAttr(safeMediaUrl(coverSrc)) + '" alt="">' : '<span class="album-card__thumb--empty">' + ICONS[config.mediaType === "videos" ? "film" : "image"] + '</span>') +
            '</span>' +
            '<span class="album-card__body">' +
              '<span class="album-card__name">' + p.name + (p.published === false ? ' <span class="hidden-tag">Hidden</span>' : '') + '</span>' +
              (p.description ? '<span class="album-card__desc">' + p.description + '</span>' : '') +
              '<span class="album-card__meta">' + mediaCount + ' ' + config.mediaNoun + (mediaCount === 1 ? '' : 's') + '</span>' +
            '</span>' +
          '</button>' +
          '<div class="gm-card-actions">' +
            '<span class="gm-reorder">' +
              '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + '>\u25B2</button>' +
              '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + '>\u25BC</button>' +
            '</span>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="edit">Edit</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">' + (p.published === false ? "Show" : "Hide") + '</button>' +
            '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
          '</div>';

        card.querySelector('[data-f="open"]').addEventListener("click", function () { goMedia(state().categoryId, p.id); });
        card.querySelector('[data-f="up"]').addEventListener("click", function () { if (moveItemOrder(sortedList, p.id, -1)) { persistStore(); render(); } });
        card.querySelector('[data-f="down"]').addEventListener("click", function () { if (moveItemOrder(sortedList, p.id, 1)) { persistStore(); render(); } });
        card.querySelector('[data-f="edit"]').addEventListener("click", renderEdit);
        card.querySelector('[data-f="toggle"]').addEventListener("click", function () {
          p.published = p.published === false ? true : false;
          persistStore();
          render();
          showToast(p.published ? "Project shown" : "Project hidden");
        });
        card.querySelector('[data-f="delete"]').addEventListener("click", function () {
          var mCount = getMediaList(sectionId, p).length;
          showConfirmDialog({
            title: "Delete this project permanently?",
            body: mCount > 0
              ? "This project contains " + mCount + " " + config.mediaNoun + (mCount === 1 ? "" : "s") + ". Deleting it will also remove that media. This cannot be undone."
              : "This cannot be undone.",
            confirmLabel: "Delete Permanently",
            onConfirm: function () {
              galleryData(sectionId).projects = galleryData(sectionId).projects.filter(function (x) { return x.id !== p.id; });
              persistStore();
              render();
              showToast("Project deleted");
            }
          });
        });
      }

      function renderEdit() {
        card.innerHTML =
          '<div class="rename-row" style="flex-direction:column; align-items:stretch;">' +
            '<label class="field">Name<input type="text" data-f="name"></label>' +
            '<label class="field">Description<textarea data-f="desc" rows="2"></textarea></label>' +
            '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Save</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>' +
          '</div>';
        card.querySelector('[data-f="name"]').value = p.name;
        card.querySelector('[data-f="desc"]').value = p.description || "";
        card.querySelector('[data-f="cancel"]').addEventListener("click", renderView);
        card.querySelector('[data-f="save"]').addEventListener("click", function () {
          var v = card.querySelector('[data-f="name"]').value.trim();
          if (v) {
            p.name = v;
            p.description = card.querySelector('[data-f="desc"]').value.trim() || null;
            persistStore();
            showToast("Changes saved");
          }
          renderView();
        });
      }

      card.addEventListener("dragstart", function (e) {
        dragFromId = p.id;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", p.id); } catch (err) { }
      });
      card.addEventListener("dragend", function () { card.classList.remove("is-dragging"); dragFromId = null; });
      card.addEventListener("dragover", function (e) { e.preventDefault(); });
      card.addEventListener("drop", function (e) {
        e.preventDefault();
        if (dragFromId && dragFromId !== p.id && reorderListByDrag(sortedList, dragFromId, p.id)) {
          persistStore();
          render();
        }
      });

      renderView();
      return card;
    }

    function buildMediaScreen() {
      var s = state();
      var project = getProjectById(sectionId, s.projectId);
      var category = getCategoryById(sectionId, s.categoryId);
      var panel = el("section", "panel");

      var backRow = el("div", "back-row");
      backRow.appendChild(buildBackLink((category ? category.name : config.label) + " Projects", function () { goProjects(s.categoryId); }));
      panel.appendChild(backRow);

      if (!project) {
        panel.appendChild(el("h2", "panel__title", "Project not found"));
        return panel;
      }

      var titleRow = el("div", "panel__title-row");
      titleRow.innerHTML = '<h2 class="panel__title">' + escapeHtml(project.name) + (project.published === false ? ' <span class="hidden-tag">Hidden</span>' : '') + '</h2>';
      panel.appendChild(titleRow);
      if (project.description) panel.appendChild(el("p", "panel__body-text", project.description));

      panel.appendChild(buildUploadZone(project));

      var mediaList = getMediaList(sectionId, project);
      if (mediaList.length === 0) {
        var emptyText = config.mediaType === "videos" ? "No videos yet." : "No photos yet.";
        panel.appendChild(el("h3", "empty-state__title", emptyText));
      } else if (config.mediaType === "videos") {
        var vgrid = el("div", "video-grid");
        mediaList.forEach(function (v, idx) { vgrid.appendChild(buildVideoCard(project, v, idx, mediaList)); });
        panel.appendChild(vgrid);
      } else {
        var pgrid = el("div", "photo-grid");
        mediaList.forEach(function (ph, idx) { pgrid.appendChild(buildPhotoThumb(project, ph, idx, mediaList)); });
        panel.appendChild(pgrid);
      }

      return panel;
    }

    function buildUploadZone(project) {
      var zone = el("div", "gm-dropzone");
      var isVideo = config.mediaType === "videos";
      zone.innerHTML =
        '<p>' + (isVideo ? "Drag videos here or Select Videos" : "Drag photos here or Select Photos") + '</p>' +
        '<input type="file" accept="' + (isVideo ? "video/*" : "image/*") + '" multiple data-f="file">' +
        '<p class="gm-storage-note">' + (isVideo
          ? "Videos are stored in Supabase Storage at full quality and are not compressed. They remain available after closing this page. file later will need videos re-uploaded to play again."
          : "Prototype storage: photos are saved in this browser only (as embedded image data), not a real file server.") + '</p>';

      function handleFiles(fileList) {
        var files = Array.prototype.slice.call(fileList);
        if (!files.length) return;
        var mediaKey = config.mediaKey;
        if (!project[mediaKey]) project[mediaKey] = [];

        /* BUSINESS MEDIA (D17). These are Luigi's project assets.
             Photos: the HD ORIGINAL is uploaded untouched and never
                     compressed. A 2048px display copy and a 600px
                     thumbnail are generated ALONGSIDE it, so grids and
                     the viewer never fetch the original.
             Videos: uploaded as-is. NO browser compression, ever.
           This is a different path from chat photos on purpose — a
           client photo can never reach it, and these never reach the
           reduction path. */
        files.forEach(function (file) {
          showToast(isVideo ? "Uploading video\u2026" : "Uploading photo\u2026");
          window.LLCMedia.uploadBusinessMedia(file, project.id, function (msg) {
            if (typeof msg === "string") showToast(msg);
          }).then(function (out) {
            var order = nextOrder(project[mediaKey]);
            var mediaItem = isVideo
              ? {
                  id: out.mediaId,
                  title: file.name.replace(/\.[a-zA-Z0-9]+$/, "") || "Untitled video",
                  description: null,
                  thumbnail: out.thumbnailUrl || null,
                  videoUrl: out.url || null,
                  storagePath: out.path,
                  date: null, order: order, published: true
                }
              : {
                  id: out.mediaId,
                  image: out.displayUrl || out.url || null,
                  thumbnail: out.thumbnailUrl || null,
                  storagePath: out.path,
                  caption: null, order: order, published: true
                };
            project[mediaKey].push(mediaItem);
            /* Uploader may not SET a cover (D-uploader). Only fill the
               slot when the album has none at all, which matches the
               prototype's own behaviour. */
            if (!project.coverPhotoId) project.coverPhotoId = mediaItem.id;
            persistStore();
            render();
          }).catch(function (err) {
            showToast("That file could not be uploaded.");
            if (window.console) console.error(err);
          });
        });
      }

      zone.querySelector('[data-f="file"]').addEventListener("change", function (e) {
        handleFiles(e.target.files);
        e.target.value = "";
      });
      zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("gm-dropzone--drag"); });
      zone.addEventListener("dragleave", function () { zone.classList.remove("gm-dropzone--drag"); });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        zone.classList.remove("gm-dropzone--drag");
        if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
      });

      return zone;
    }

    function buildPhotoThumb(project, photo, idx, sortedList) {
      var card = el("div", "photo-card" + (photo.published === false ? " photo-card--hidden" : ""));
      var isCover = project.coverPhotoId === photo.id;
      card.style.position = "relative";
      card.innerHTML =
        (isCover ? '<span class="gm-cover-star" title="Cover photo">\u2605</span>' : '') +
        '<button type="button" class="photo-thumb" data-f="open" style="width:100%;"><img src="' + photo.image + '" alt=""></button>' +
        (photo.published === false ? '<span class="hidden-tag" style="position:absolute;top:8px;right:8px;">Hidden</span>' : '') +
        '<div class="gm-card-actions">' +
          '<span class="gm-reorder">' +
            '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + '>\u25B2</button>' +
            '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + '>\u25BC</button>' +
          '</span>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cover"' + (isCover ? " disabled" : "") + '>Set Cover</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">' + (photo.published === false ? "Show" : "Hide") + '</button>' +
          '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
        '</div>';

      card.querySelector('[data-f="open"]').addEventListener("click", function () { openPhotoViewer(project, sortedList, idx); });
      card.querySelector('[data-f="up"]').addEventListener("click", function () { if (moveItemOrder(sortedList, photo.id, -1)) { persistStore(); render(); } });
      card.querySelector('[data-f="down"]').addEventListener("click", function () { if (moveItemOrder(sortedList, photo.id, 1)) { persistStore(); render(); } });
      card.querySelector('[data-f="cover"]').addEventListener("click", function () {
        project.coverPhotoId = photo.id;
        persistStore();
        render();
        showToast("Cover updated");
      });
      card.querySelector('[data-f="toggle"]').addEventListener("click", function () {
        photo.published = photo.published === false ? true : false;
        persistStore();
        render();
      });
      card.querySelector('[data-f="delete"]').addEventListener("click", function () {
        showConfirmDialog({
          title: "Delete this photo permanently?",
          body: "This cannot be undone.",
          confirmLabel: "Delete Permanently",
          onConfirm: function () {
            removeMediaAndFixCover(sectionId, project, photo.id);
            persistStore();
            render();
            showToast("Photo deleted");
          }
        });
      });

      return card;
    }

    function buildVideoCard(project, video, idx, sortedList) {
      var card = el("div", "video-card" + (video.published === false ? " video-card--hidden" : ""));
      var isCover = project.coverPhotoId === video.id;
      card.innerHTML =
        '<div style="position:relative;">' +
          (isCover ? '<span class="gm-cover-star" title="Cover video">\u2605</span>' : '') +
          '<button type="button" class="video-card__thumb" data-f="open">' +
            (video.thumbnail ? '<img src="' + escapeAttr(safeMediaUrl(video.thumbnail)) + '" alt="">' : '<span class="video-card__no-preview">No preview</span>') +
          '</button>' +
        '</div>' +
        '<div class="video-card__body">' +
          '<p class="video-card__title">' + escapeHtml(video.title) + (video.published === false ? ' <span class="hidden-tag">Hidden</span>' : '') + '</p>' +
        '</div>' +
        '<div class="gm-card-actions">' +
          '<span class="gm-reorder">' +
            '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + '>\u25B2</button>' +
            '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + '>\u25BC</button>' +
          '</span>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cover"' + (isCover ? " disabled" : "") + '>Set Cover</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">' + (video.published === false ? "Show" : "Hide") + '</button>' +
          '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
        '</div>';

      card.querySelector('[data-f="open"]').addEventListener("click", function () { openVideoModal(project, video); });
      card.querySelector('[data-f="up"]').addEventListener("click", function () { if (moveItemOrder(sortedList, video.id, -1)) { persistStore(); render(); } });
      card.querySelector('[data-f="down"]').addEventListener("click", function () { if (moveItemOrder(sortedList, video.id, 1)) { persistStore(); render(); } });
      card.querySelector('[data-f="cover"]').addEventListener("click", function () {
        project.coverPhotoId = video.id;
        persistStore();
        render();
        showToast("Cover updated");
      });
      card.querySelector('[data-f="toggle"]').addEventListener("click", function () {
        video.published = video.published === false ? true : false;
        persistStore();
        render();
      });
      card.querySelector('[data-f="delete"]').addEventListener("click", function () {
        showConfirmDialog({
          title: "Delete this video permanently?",
          body: "This cannot be undone.",
          confirmLabel: "Delete Permanently",
          onConfirm: function () {
            removeMediaAndFixCover(sectionId, project, video.id);
            persistStore();
            render();
            showToast("Video deleted");
          }
        });
      });

      return card;
    }

    function openPhotoViewer(project, mediaList, startIndex) {
      var idx = startIndex;
      var overlay = el("div", "admin-photo-modal");
      overlay.innerHTML =
        '<div class="admin-photo-modal__panel">' +
          '<button type="button" class="admin-photo-modal__close" data-f="close">\u00D7</button>' +
          '<p class="admin-photo-modal__crumb" data-f="crumb"></p>' +
          '<img data-f="img" alt="">' +
          '<div class="admin-photo-modal__meta" data-f="counter"></div>' +
          '<div class="admin-photo-modal__nav">' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="prev">\u2039 Prev</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="next">Next \u203A</button>' +
          '</div>' +
          '<div class="admin-photo-modal__actions">' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="cover">Set Cover</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">Hide</button>' +
            '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
          '</div>' +
        '</div>';

      var cat = getCategoryById(sectionId, state().categoryId);
      var crumbLabel = [config.label, cat ? cat.name : null, project.name].filter(Boolean).join(" \u203A ");

      function currentList() { return getMediaList(sectionId, project); }

      function draw() {
        var list = currentList();
        if (!list.length) { close(); return; }
        if (idx >= list.length) idx = list.length - 1;
        if (idx < 0) idx = 0;
        var photo = list[idx];
        overlay.querySelector('[data-f="crumb"]').textContent = crumbLabel;
        overlay.querySelector('[data-f="img"]').src = photo.image;
        overlay.querySelector('[data-f="counter"]').textContent = "Photo " + (idx + 1) + " / " + list.length;
        var coverBtn = overlay.querySelector('[data-f="cover"]');
        var isCover = project.coverPhotoId === photo.id;
        coverBtn.disabled = isCover;
        coverBtn.textContent = isCover ? "Current Cover" : "Set Cover";
        overlay.querySelector('[data-f="toggle"]').textContent = photo.published === false ? "Show" : "Hide";
        var multi = list.length > 1;
        overlay.querySelector('[data-f="prev"]').hidden = !multi;
        overlay.querySelector('[data-f="next"]').hidden = !multi;
      }

      function close() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        render();
      }

      overlay.querySelector('[data-f="close"]').addEventListener("click", close);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      overlay.querySelector('[data-f="prev"]').addEventListener("click", function () {
        var list = currentList();
        idx = (idx - 1 + list.length) % list.length;
        draw();
      });
      overlay.querySelector('[data-f="next"]').addEventListener("click", function () {
        var list = currentList();
        idx = (idx + 1) % list.length;
        draw();
      });
      overlay.querySelector('[data-f="cover"]').addEventListener("click", function () {
        var photo = currentList()[idx];
        project.coverPhotoId = photo.id;
        persistStore();
        draw();
        showToast("Cover updated");
      });
      overlay.querySelector('[data-f="toggle"]').addEventListener("click", function () {
        var photo = currentList()[idx];
        photo.published = photo.published === false ? true : false;
        persistStore();
        draw();
      });
      overlay.querySelector('[data-f="delete"]').addEventListener("click", function () {
        var photo = currentList()[idx];
        showConfirmDialog({
          title: "Delete this photo permanently?",
          body: "This cannot be undone.",
          confirmLabel: "Delete Permanently",
          onConfirm: function () {
            removeMediaAndFixCover(sectionId, project, photo.id);
            persistStore();
            draw();
            showToast("Photo deleted");
          }
        });
      });

      document.body.appendChild(overlay);
      draw();
    }

    function openVideoModal(project, video) {
      var overlay = el("div", "admin-photo-modal");
      overlay.innerHTML =
        '<div class="admin-photo-modal__panel">' +
          '<button type="button" class="admin-photo-modal__close" data-f="close">\u00D7</button>' +
          '<video data-f="player" controls style="width:100%;max-height:62vh;background:#000;border-radius:6px;display:block;"></video>' +
          '<div class="admin-photo-modal__meta" data-f="title"></div>' +
          '<div class="admin-photo-modal__actions">' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="cover">Set Cover</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">Hide</button>' +
            '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
          '</div>' +
        '</div>';

      overlay.querySelector('[data-f="player"]').src = video.videoUrl;
      overlay.querySelector('[data-f="title"]').textContent = video.title;

      function close() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        render();
      }
      overlay.querySelector('[data-f="close"]').addEventListener("click", close);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });

      function refreshButtons() {
        var isCover = project.coverPhotoId === video.id;
        var coverBtn = overlay.querySelector('[data-f="cover"]');
        coverBtn.disabled = isCover;
        coverBtn.textContent = isCover ? "Current Cover" : "Set Cover";
        overlay.querySelector('[data-f="toggle"]').textContent = video.published === false ? "Show" : "Hide";
      }
      refreshButtons();

      overlay.querySelector('[data-f="cover"]').addEventListener("click", function () {
        project.coverPhotoId = video.id;
        persistStore();
        refreshButtons();
        showToast("Cover updated");
      });
      overlay.querySelector('[data-f="toggle"]').addEventListener("click", function () {
        video.published = video.published === false ? true : false;
        persistStore();
        refreshButtons();
      });
      overlay.querySelector('[data-f="delete"]').addEventListener("click", function () {
        showConfirmDialog({
          title: "Delete this video permanently?",
          body: "This cannot be undone.",
          confirmLabel: "Delete Permanently",
          onConfirm: function () {
            removeMediaAndFixCover(sectionId, project, video.id);
            persistStore();
            close();
            showToast("Video deleted");
          }
        });
      });

      document.body.appendChild(overlay);
    }

    render();
    return container;
  }


  /* ============================================================
   * DATABASE MODULE (Phase 10 Part 3) — Admin-only client records
   * ============================================================
   * ADMIN-ONLY: this whole module only ever renders inside the
   * Admin's own "Database" nav section. There is no code path in
   * the Client HTML that reads this data, links to it, or displays
   * it — clients can never see this panel.
   *
   * WHERE THE RECORDS COME FROM (read this before assuming live
   * sync): the Phase 9 Client's sign-up accounts live in that page's
   * OWN sessionStorage (see js/auth-service.js — key
   * "llc_mock_users"), which is tab-scoped, cleared when that tab
   * closes, and — since the Client and this Admin app are two
   * separate HTML documents — not something this file can reliably
   * read even if it were still open. So, honestly: nothing here is
   * pulled live from the Client site yet. That real-time link is
   * genuine backend work for a later phase.
   *
   * What this Part actually builds is the full Admin-only records
   * matrix — storage shape, search, sort, select, archive, and every
   * per-field editor — around the exact same fields the real Client
   * sign-up form already collects (firstName, middleName, lastName,
   * email, mobileNumber, locationAddress), plus the Admin-only fields
   * this Part adds (remarks, projectType, bedrooms, cr,
   * bestTimeToCall, budgetMax). For now, records are entered directly
   * by the Admin — exactly the same pattern already used for Reviews
   * in js/data.js ("entered on a real customer's behalf"). The moment
   * a shared backend exists, real Client sign-ups can be pushed into
   * this exact same shape without changing this UI.
   *
   * PERSISTENCE: localStorage under its own key, separate from the
   * Part 2 content store, so a client record is never lost by
   * logging out, closing the browser, refreshing, or reopening this
   * file — only "Archive" (never permanent delete) removes a record
   * from the active list, and archiving keeps 100% of its data.
   */
  var CLIENTS_STORAGE_KEY = "llc_admin_clients_v1";

  function loadClients() {
    try {
      var raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && Array.isArray(saved.list)) {
          return { list: saved.list, nextNum: saved.nextNum || (saved.list.length + 1) };
        }
      }
    } catch (e) {
      // Corrupt or inaccessible storage — start clean rather than crash.
    }
    return { list: [], nextNum: 1 };
  }

  /* MODIFICATION 3 + 6. Gated on useSupabase(), matching persistStore()
     above. On success, applies MODIFICATION 6's client-id reconciliation:
     a walk-in's temporary crypto.randomUUID() is replaced with the id
     the database actually assigned, in-place, so a second edit in the
     same session targets a row that really exists. */
  function persistClients() {
    if (useSupabase()) {
      /* A new walk-in's id is reconciled to the real database id
         INSIDE persistClients() itself, by mutating the same client
         object this call already holds by reference. */
      window.LLCAdminBackend.persistClients(CLIENTS).catch(function (e) {
        showToast("Could not save to the database. Please try again.");
        if (window.console) console.error(e);
      });
      return;
    }
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(CLIENTS));
    } catch (e) {
      showToast("Could not save — browser storage is full or unavailable.");
    }
  }

  var CLIENTS = loadClients();

  /* =====================================================================
     MODIFICATION 2 + 4 — read path actually reaches Supabase.
     =====================================================================
     Previously STORE/CLIENTS/CONVERSATIONS/USERS were populated ONCE,
     synchronously, from local defaults/localStorage only — never from
     Supabase, regardless of configuration. The synchronous assignments
     above and at the other three `var X = loadX();` sites are left
     UNCHANGED: they still give the page something safe to render
     immediately at parse time, before any network request could
     possibly have completed, and they remain the entire behaviour when
     Supabase is not configured.

     What's new is this function, called once from showDashboard() after
     a successful login/session-check (see below) — the same choke
     point both the login-submit handler and the page-load session
     restore already share, so there is exactly one place this can race
     from, not two. If configured, it fetches the real data and
     OVERWRITES the fields of the EXISTING STORE/CLIENTS/CONVERSATIONS/
     USERS objects in place (never reassigning the variables themselves),
     so every function elsewhere that reads e.g. STORE.company sees the
     update without needing to know a reload happened. This is also
     where loadContent() actually gets called at last — which is what
     seeds persistContent()'s comparison baseline (Modification 4). */

  var GALLERY_SECTION_KEYS = Object.keys(GALLERY_CONFIG);

  /* Raw Supabase rows -> the nested UI shape DEFAULT_STORE already uses.
     Every field name on the right of each mapping mirrors exactly what
     persistContent()'s WRITE side (admin-supabase.js) already reads and
     writes for the same column, so the two stay honest mirrors of each
     other rather than two independently-guessed shapes. */
  function mapFlatContentToStore(flat, urlFor) {
    var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday"];

    var company = {
      name: (flat.company && flat.company.name) || "",
      description: (flat.company && flat.company.description) || "",
      location: (flat.company && flat.company.location) || "",
      mobile: (flat.company && flat.company.mobile) || "",
      coverImage: urlFor("company-assets", flat.company && flat.company.cover_image_path),
      profileImage: urlFor("company-assets", flat.company && flat.company.profile_image_path)
    };

    var scheduleByDay = {};
    (flat.hours || []).forEach(function (row) { scheduleByDay[row.day_of_week] = row; });
    var schedule = DAYS.map(function (dayName, dow) {
      var row = scheduleByDay[dow];
      return {
        day: dayName,
        open: row && row.open_time ? row.open_time.slice(0, 5) : null,
        close: row && row.close_time ? row.close_time.slice(0, 5) : null,
        chatAvailable: row ? !!row.chat_available : true
      };
    });

    var clientNav = (flat.nav || [])
      .slice()
      .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
      .map(function (row) {
        return {
          id: row.nav_key, label: row.label, icon: row.icon,
          status: row.status || "active", visible: row.visible !== false
        };
      });

    var sectionsById = {};
    (flat.sections || []).forEach(function (s) { sectionsById[s.id] = s; });

    var galleries = {};
    GALLERY_SECTION_KEYS.forEach(function (sectionKey) {
      var mediaKey = GALLERY_CONFIG[sectionKey].mediaKey;
      var sectionRow = (flat.sections || []).filter(function (s) {
        return s.section_key === sectionKey;
      })[0];
      var sectionId = sectionRow && sectionRow.id;

      var categories = (flat.categories || [])
        .filter(function (c) { return c.section_id === sectionId; })
        .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
        .map(function (c) {
          return {
            id: c.id, name: c.name,
            coverImage: urlFor("gallery-media", c.cover_image_path),
            published: c.published !== false, order: c.sort_order || 1
          };
        });

      var projects = (flat.projects || [])
        .filter(function (p) {
          var cat = (flat.categories || []).filter(function (c) { return c.id === p.category_id; })[0];
          return cat && cat.section_id === sectionId;
        })
        .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
        .map(function (p) {
          var media = (flat.media || [])
            .filter(function (m) { return m.project_id === p.id; })
            .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
            .map(function (m) {
              return mediaKey === "videos"
                ? {
                    id: m.id, title: m.title, description: null,
                    thumbnail: urlFor("gallery-media", m.thumbnail_path),
                    videoUrl: urlFor("gallery-media", m.storage_path),
                    storagePath: m.storage_path, date: null,
                    order: m.sort_order || 1, published: m.published !== false
                  }
                : {
                    id: m.id,
                    /* Matches js/db-service.js's own established
                       convention exactly (both fields, same fallback
                       order) — that file already correctly sets both
                       .image and .display; this was the one place that
                       had drifted from it, producing .image only. */
                    image: urlFor("gallery-media", m.display_path || m.thumbnail_path),
                    display: urlFor("gallery-media", m.display_path),
                    thumbnail: urlFor("gallery-media", m.thumbnail_path),
                    storagePath: m.storage_path, caption: m.caption,
                    order: m.sort_order || 1, published: m.published !== false
                  };
            });

          var proj = {
            id: p.id, categoryId: p.category_id, name: p.name,
            description: p.description,
            coverPhotoId: p.cover_media_id || null,
            published: p.published !== false, order: p.sort_order || 1
          };
          proj[mediaKey] = media;
          return proj;
        });

      galleries[sectionKey] = { categories: categories, projects: projects };
    });

    var reviews = (flat.reviews || [])
      .slice().sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
      .map(function (r) {
        return {
          id: r.id, customerName: r.customer_name,
          customerPhoto: urlFor("review-photos", r.customer_photo_path),
          text: r.review_text, date: r.date_label, project: r.project_label,
          location: r.location, video: r.testimonial_video_id,
          published: r.published !== false, order: r.sort_order || 1
        };
      });

    var testimonials = (flat.testimonials || [])
      .slice().sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); })
      .map(function (t) {
        return {
          id: t.id, title: t.title, description: t.description,
          thumbnail: urlFor("testimonial-videos", t.thumbnail_path),
          videoUrl: urlFor("testimonial-videos", t.video_path),
          storagePath: t.video_path,
          customerName: t.customer_name, project: t.project_label, date: t.date_label,
          published: t.published !== false, order: t.sort_order || 1
        };
      });

    return {
      company: company,
      hours: { timezone: "Asia/Manila", schedule: schedule },
      clientNav: clientNav,
      galleries: galleries,
      reviews: { recommendPercent: 100, items: reviews },
      videoTestimonials: { items: testimonials }
    };
  }

  /* Collects every storage path the transform above will need, signs
     them in as few batched calls as the four buckets allow (getMany()
     takes one bucket at a time), and returns a lookup function so the
     transform itself stays synchronous and simple. Paths that fail to
     sign (removed file, expired session mid-load, etc.) fall back to
     null rather than throwing — a missing photo should not block the
     rest of the dashboard from loading. */
  function buildUrlResolver(flat) {
    var byBucket = {
      "company-assets": [], "gallery-media": [], "testimonial-videos": [], "review-photos": []
    };
    if (flat.company) {
      byBucket["company-assets"].push(flat.company.cover_image_path, flat.company.profile_image_path);
    }
    (flat.categories || []).forEach(function (c) { byBucket["gallery-media"].push(c.cover_image_path); });
    (flat.media || []).forEach(function (m) {
      byBucket["gallery-media"].push(m.storage_path, m.display_path, m.thumbnail_path);
    });
    (flat.reviews || []).forEach(function (r) { byBucket["review-photos"].push(r.customer_photo_path); });
    (flat.testimonials || []).forEach(function (t) {
      byBucket["testimonial-videos"].push(t.video_path, t.thumbnail_path);
    });

    var resolved = {};   // "bucket/path" -> signedUrl
    var jobs = Object.keys(byBucket).map(function (bucket) {
      return window.LLCSignedUrls.getMany(bucket, byBucket[bucket]).then(function (map) {
        Object.keys(map).forEach(function (path) { resolved[bucket + "/" + path] = map[path]; });
      }).catch(function () { /* leave this bucket's paths unresolved */ });
    });

    return Promise.all(jobs).then(function () {
      return function urlFor(bucket, path) {
        if (!path) return null;
        return resolved[bucket + "/" + path] || null;
      };
    });
  }

  /* The single entry point showDashboard() awaits before rendering.
     Local mode (not configured) resolves immediately and touches
     nothing — STORE/CLIENTS/CONVERSATIONS/USERS stay exactly as their
     synchronous local load already set them. */
  function refreshFromBackendIfConfigured() {
    if (!useSupabase()) return Promise.resolve();

    var role = (getCurrentUser() || {}).role;

    return Promise.all([
      window.LLCAdminBackend.loadContent(),
      window.LLCAdminBackend.loadClients(role),
      window.LLCAdminBackend.loadConversations(),
      window.LLCAdminBackend.loadUsers()
    ]).then(function (results) {
      var flatContent = results[0], clientsResult = results[1],
          conversationsResult = results[2], usersResult = results[3];

      return buildUrlResolver(flatContent).then(function (urlFor) {
        var nextStore = mapFlatContentToStore(flatContent, urlFor);

        /* Mutate the EXISTING objects' fields rather than reassigning
           STORE/CLIENTS/CONVERSATIONS/USERS themselves, so every
           closure elsewhere that already holds a reference to them
           sees the update with no further wiring needed. */
        Object.keys(nextStore).forEach(function (key) { STORE[key] = nextStore[key]; });

        CLIENTS.list = (clientsResult && clientsResult.list) || [];
        CONVERSATIONS.list = (conversationsResult && conversationsResult.list) || [];
        USERS.list = (usersResult && usersResult.list) || [];
      });
    }).catch(function (e) {
      /* A failed refresh must not leave the Admin silently showing
         local/default data as if it were authoritative. Local content
         is deliberately CLEARED here rather than left in place, so an
         empty/error state is visibly different from real data — the
         one thing the previous behaviour never distinguished. */
      showToast("Could not load data from the database. Please refresh to try again.");
      if (window.console) console.error(e);
      throw e;
    });
  }


  /* Client ids are generated by the DATABASE as UUIDs. The old
     "client_001" counter is gone, as is the Client site's in-memory
     "client-1" counter that reset on every refresh and could hand one
     customer another customer's conversation. Nothing here invents an
     identity; a new walk-in row gets its id back from Supabase. */
  function makeClientId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "tmp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function fullClientName(c) {
    return [c.firstName, c.middleName, c.lastName].filter(Boolean).join(" ") || "(no name)";
  }

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function formatDateSignedUp(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return MONTH_NAMES[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function formatPeso(n) {
    if (n === null || n === undefined || n === "" || isNaN(n)) return "—";
    var rounded = Math.round(Number(n));
    var str = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (rounded < 0 ? "-" : "") + "\u20B1" + str;
  }

  function escapeAttr(str) { return String(str === null || str === undefined ? "" : str).replace(/"/g, "&quot;"); }

  /* Escapes text destined for an innerHTML string. Neither codebase had
     one of these, which is how three injection points survived. Prefer
     .textContent where possible; use this where a string is built. */
  function escapeHtml(str) {
    if (window.LLCEscape && window.LLCEscape.esc) return window.LLCEscape.esc(str);
    return String(str === null || str === undefined ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Only http(s) and Supabase signed URLs may reach an image src. */
  function safeMediaUrl(url) {
    var u = String(url === null || url === undefined ? "" : url);
    return /^(https?:|blob:|data:image\/)/i.test(u) ? u : "";
  }

  /**
   * DETERMINISTIC chat-text extraction — NO AI, NO LLM, NO guessing.
   * Only recognizes the exact explicit patterns the spec calls out:
   *   Bedrooms:  "BR 3" / "3 BR" / "Bedrooms: 3"
   *   CR:        "CR 2" / "2 CR" / "Bathrooms: 2"
   *   Project:   the literal words "Bungalow", "2 storey", "3 storey"
   * Anything else — "I want a big house", "maybe three", "something
   * with enough rooms" — matches nothing and is left completely alone.
   */
  function extractFieldsFromMessage(text) {
    var result = { bedrooms: null, cr: null, projectType: null };
    if (!text) return result;

    var brMatch =
      text.match(/\bBR\s*[:\-]?\s*(\d{1,2})\b/i) ||
      text.match(/\b(\d{1,2})\s*BR\b/i) ||
      text.match(/\bbedrooms?\s*[:\-]?\s*(\d{1,2})\b/i);
    if (brMatch) result.bedrooms = parseInt(brMatch[1], 10);

    var crMatch =
      text.match(/\bCR\s*[:\-]?\s*(\d{1,2})\b/i) ||
      text.match(/\b(\d{1,2})\s*CR\b/i) ||
      text.match(/\bbathrooms?\s*[:\-]?\s*(\d{1,2})\b/i);
    if (crMatch) result.cr = parseInt(crMatch[1], 10);

    if (/\bbungalow\b/i.test(text)) {
      result.projectType = "Bungalow";
    } else if (/\b2\s*-?\s*storey\b/i.test(text)) {
      result.projectType = "2 Storey";
    } else if (/\b3\s*-?\s*storey\b/i.test(text)) {
      result.projectType = "3 Storey";
    }

    return result;
  }

  // Only fills fields that are currently empty — a manually confirmed
  // value is never silently overwritten. To re-extract into a field,
  // an Admin has to clear it first, which is an explicit action.
  function applyExtraction(client, extraction) {
    var applied = [];
    var skipped = [];

    if (extraction.bedrooms !== null) {
      if (client.bedrooms === null || client.bedrooms === undefined) {
        client.bedrooms = extraction.bedrooms;
        applied.push("Bedrooms = " + extraction.bedrooms);
      } else {
        skipped.push("Bedrooms (already set to " + client.bedrooms + ")");
      }
    }
    if (extraction.cr !== null) {
      if (client.cr === null || client.cr === undefined) {
        client.cr = extraction.cr;
        applied.push("CR = " + extraction.cr);
      } else {
        skipped.push("CR (already set to " + client.cr + ")");
      }
    }
    if (extraction.projectType !== null) {
      if (!client.projectType) {
        client.projectType = extraction.projectType;
        applied.push("Project Type = " + extraction.projectType);
      } else {
        skipped.push("Project Type (already set to " + client.projectType + ")");
      }
    }

    return { applied: applied, skipped: skipped };
  }

  /**
   * A real on-page confirm dialog (not window.confirm) so the two
   * buttons can say exactly "Cancel" and a caller-supplied destructive
   * label like "Delete Permanently" — window.confirm's button text is
   * fixed by the browser and can't be customized. Styled to match the
   * rest of the Admin app; appended to document.body so it always sits
   * above the current panel regardless of scroll position.
   */
  function showConfirmDialog(options) {
    var overlay = el("div", "confirm-overlay");
    overlay.innerHTML =
      '<div class="confirm-dialog" role="alertdialog" aria-modal="true">' +
        '<h3 class="confirm-dialog__title"></h3>' +
        '<p class="confirm-dialog__body"></p>' +
        '<div class="card-actions">' +
          '<button type="button" class="btn btn--danger btn--sm" data-f="confirm"></button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button>' +
        '</div>' +
      '</div>';

    overlay.querySelector(".confirm-dialog__title").textContent = options.title;
    overlay.querySelector(".confirm-dialog__body").textContent = options.body;
    var confirmBtn = overlay.querySelector('[data-f="confirm"]');
    confirmBtn.textContent = options.confirmLabel || "Confirm";

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    confirmBtn.addEventListener("click", function () {
      close();
      options.onConfirm();
    });
    overlay.querySelector('[data-f="cancel"]').addEventListener("click", close);
    // Clicking the dimmed backdrop itself (not the dialog card) also
    // cancels — but the dialog card stops that click from bubbling, so
    // an accidental tap can't land on the destructive button by chance.
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
  }

  var selectedIds = new Set();
  var dbSearchTerm = "";
  var dbShowArchived = false;

  // Default: newest signup first — same default as before, just
  // expressed as column + direction instead of one combined string.
  var dbSortColumn = "date";
  var dbSortDirection = "desc"; // "asc" | "desc"

  // Every value this column relies on, ranked so free-text values that
  // happen to match a known real-world label ("Morning", "Bungalow")
  // sort in a meaningful order instead of plain alphabetical.
  var PROJECT_TYPE_RANK = { bungalow: 0, "2 storey": 1, "3 storey": 2, others: 3 };
  var BEST_TIME_RANK = { morning: 0, afternoon: 1, evening: 2 };

  // Whether this client has no value at all for the given sort column.
  // Empty always sorts to the end of the list, in EITHER direction —
  // reversing the sort should not make blank rows jump to the top.
  function isEmptyForColumn(column, c) {
    switch (column) {
      case "mobile": return !c.mobileNumber;
      case "email": return !c.email;
      case "remarks": return !(c.remarks && c.remarks.trim());
      case "projectType": return !c.projectType;
      case "bedrooms": return c.bedrooms === null || c.bedrooms === undefined || c.bedrooms === "";
      case "cr": return c.cr === null || c.cr === undefined || c.cr === "";
      case "budgetMax": return c.budgetMax === null || c.budgetMax === undefined || c.budgetMax === "";
      case "bestTimeToCall": return !(c.bestTimeToCall && c.bestTimeToCall.trim());
      case "location": return !(c.locationAddress && c.locationAddress.trim());
      default: return false; // name and date are always present
    }
  }

  // Compares two clients that are BOTH known non-empty for this column —
  // isEmptyForColumn already handled the empty cases before this runs.
  function rawCompare(column, a, b) {
    switch (column) {
      case "name":
        return fullClientName(a).localeCompare(fullClientName(b), undefined, { sensitivity: "base" });
      case "mobile": {
        var aDigits = a.mobileNumber.replace(/\D/g, "");
        var bDigits = b.mobileNumber.replace(/\D/g, "");
        // Numeric compare when both are plain digit strings short enough
        // to stay exact as JS numbers; otherwise fall back to a plain
        // string compare so nothing ever throws or silently misorders.
        if (aDigits.length && bDigits.length && aDigits.length <= 15 && bDigits.length <= 15) {
          return Number(aDigits) - Number(bDigits);
        }
        return aDigits.localeCompare(bDigits);
      }
      case "email":
        return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
      case "date":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "remarks":
        return a.remarks.trim().toLowerCase().localeCompare(b.remarks.trim().toLowerCase());
      case "projectType": {
        var aKey = a.projectType.toLowerCase();
        var bKey = b.projectType.toLowerCase();
        var aRank = PROJECT_TYPE_RANK.hasOwnProperty(aKey) ? PROJECT_TYPE_RANK[aKey] : 99;
        var bRank = PROJECT_TYPE_RANK.hasOwnProperty(bKey) ? PROJECT_TYPE_RANK[bKey] : 99;
        return aRank !== bRank ? aRank - bRank : aKey.localeCompare(bKey);
      }
      case "bedrooms":
      case "cr":
      case "budgetMax":
        return Number(a[column]) - Number(b[column]);
      case "location":
        return a.locationAddress.trim().toLowerCase().localeCompare(b.locationAddress.trim().toLowerCase());
      case "bestTimeToCall": {
        var aTime = a.bestTimeToCall.trim().toLowerCase();
        var bTime = b.bestTimeToCall.trim().toLowerCase();
        var aTRank = BEST_TIME_RANK.hasOwnProperty(aTime) ? BEST_TIME_RANK[aTime] : 99;
        var bTRank = BEST_TIME_RANK.hasOwnProperty(bTime) ? BEST_TIME_RANK[bTime] : 99;
        return aTRank !== bTRank ? aTRank - bTRank : aTime.localeCompare(bTime);
      }
      default:
        return 0;
    }
  }

  function compareClients(column, direction, a, b) {
    var aEmpty = isEmptyForColumn(column, a);
    var bEmpty = isEmptyForColumn(column, b);
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;  // empty always last, regardless of direction
    if (bEmpty) return -1; // empty always last, regardless of direction
    var cmp = rawCompare(column, a, b);
    return direction === "asc" ? cmp : -cmp;
  }

  function getVisibleClients() {
    var list = CLIENTS.list.filter(function (c) { return dbShowArchived ? !!c.archived : !c.archived; });

    var term = dbSearchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(function (c) {
        return (
          fullClientName(c).toLowerCase().indexOf(term) !== -1 ||
          (c.mobileNumber || "").toLowerCase().indexOf(term) !== -1 ||
          (c.email || "").toLowerCase().indexOf(term) !== -1
        );
      });
    }

    // Sort by stable client id as a final tiebreaker, so equal values
    // (e.g. two clients both with no Remarks) always land in the same
    // relative order instead of shuffling between renders.
    list = list.slice().sort(function (a, b) {
      var primary = compareClients(dbSortColumn, dbSortDirection, a, b);
      if (primary !== 0) return primary;
      return a.id.localeCompare(b.id);
    });

    return list;
  }


  /* ============================================================
   * UPLOADER WORKSPACE (Phase 10 Part 6B)
   * ============================================================
   * Reuses the EXACT SAME gallery data (categories/projects/media,
   * stable IDs, order, published flags, coverPhotoId) that
   * buildGalleryAdminPanel (Part 4) already reads and writes — there
   * is no second media store. The Uploader workspace is simply a much
   * more restricted set of controls over the same data:
   *   - Create category/project ("folder"/"subfolder"), rename them.
   *   - Upload photos/videos, choosing the display name BEFORE saving.
   *   - Reorder uploaded media.
   * It deliberately has NO delete, NO hide/show, NO Set Cover, and NO
   * category/project reorder — none of those are part of "upload
   * only" authority. Every action below is gated by can("upload") or
   * can("organize"), never a raw role comparison.
   */

  function buildUploaderGalleryPanel(sectionId) {
    if (!can("upload")) return buildAccessDeniedPanel();

    var config = GALLERY_CONFIG[sectionId];
    var container = document.createElement("div");

    function state() { return getGalleryAdminState(sectionId); }
    function goRoot() { var s = state(); s.level = "categories"; s.categoryId = null; s.projectId = null; render(); }
    function goProjects(categoryId) { var s = state(); s.level = "projects"; s.categoryId = categoryId; s.projectId = null; render(); }
    function goMedia(categoryId, projectId) { var s = state(); s.level = "media"; s.categoryId = categoryId; s.projectId = projectId; render(); }

    function render() {
      container.innerHTML = "";
      container.appendChild(buildIntro());
      container.appendChild(buildBreadcrumbUploader());
      var s = state();
      if (s.level === "categories") container.appendChild(buildCategoryScreen());
      else if (s.level === "projects") container.appendChild(buildProjectsScreen());
      else container.appendChild(buildMediaScreen());
    }

    function buildIntro() {
      var panel = el("section", "panel");
      panel.innerHTML =
        '<span class="coming-soon__badge">Phase 10 — Part 6B</span>' +
        '<h2 class="panel__title" style="margin-top:10px;">' + config.label + ' — Uploader Workspace</h2>' +
        '<p class="panel__body-text">You can create and rename folders/subfolders and upload files here. Deleting, ' +
        "hiding, reordering folders, and setting a cover photo are Admin-only and are not shown here.</p>";
      return panel;
    }

    function buildBreadcrumbUploader() {
      var s = state();
      var nav = el("nav", "breadcrumb");
      var root = el("button", "breadcrumb__item", config.label);
      root.type = "button";
      if (s.level === "categories") root.setAttribute("aria-current", "true");
      root.addEventListener("click", goRoot);
      nav.appendChild(root);

      if (s.categoryId) {
        var cat = getCategoryById(sectionId, s.categoryId);
        nav.appendChild(el("span", "breadcrumb__sep", "/"));
        var catCrumb = el("button", "breadcrumb__item", cat ? cat.name : "");
        catCrumb.type = "button";
        if (s.level === "projects") catCrumb.setAttribute("aria-current", "true");
        catCrumb.addEventListener("click", function () { goProjects(s.categoryId); });
        nav.appendChild(catCrumb);
      }
      if (s.projectId) {
        var proj = getProjectById(sectionId, s.projectId);
        nav.appendChild(el("span", "breadcrumb__sep", "/"));
        var pCrumb = el("span", "breadcrumb__item breadcrumb__item--current", proj ? proj.name : "");
        pCrumb.setAttribute("aria-current", "true");
        nav.appendChild(pCrumb);
      }
      return nav;
    }

    /* ---------------- Folder (category) screen ---------------- */
    function buildCategoryScreen() {
      var panel = el("section", "panel");
      var categories = getCategories(sectionId);

      var head = el("div", "gm-toolbar");
      head.innerHTML = '<div class="gm-toolbar__title"><h2 class="panel__title" style="margin:0;">Folders</h2></div>';
      var addBtn = el("button", "btn btn--primary btn--sm", "+ Create Folder");
      addBtn.type = "button";
      head.querySelector(".gm-toolbar__title").appendChild(addBtn);
      panel.appendChild(head);

      var formHolder = el("div");
      panel.appendChild(formHolder);
      addBtn.addEventListener("click", function () {
        if (!can("organize")) return;
        formHolder.innerHTML = "";
        var form = el("div", "gm-inline-form");
        form.innerHTML =
          '<label class="field">Folder Name<input type="text" data-f="name"></label>' +
          '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Create Folder</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>';
        formHolder.appendChild(form);
        form.querySelector('[data-f="cancel"]').addEventListener("click", function () { formHolder.innerHTML = ""; });
        form.querySelector('[data-f="save"]').addEventListener("click", function () {
          if (!can("organize")) return;
          var name = form.querySelector('[data-f="name"]').value.trim();
          if (!name) return;
          var cats = galleryData(sectionId).categories;
          cats.push({ id: genId("cat"), name: name, coverImage: null, published: true, order: nextOrder(cats) });
          persistStore();
          formHolder.innerHTML = "";
          render();
          showToast("Folder created");
        });
      });

      var grid = el("div", "album-grid");
      categories.forEach(function (cat) { grid.appendChild(buildCategoryCard(cat)); });
      panel.appendChild(grid);
      return panel;
    }

    function buildCategoryCard(cat) {
      var card = el("div", "album-card");

      function renderView() {
        var projectCount = getProjectsForCategory(sectionId, cat.id).length;
        card.innerHTML =
          '<button type="button" class="album-card__link" data-f="open">' +
            '<span class="album-card__thumb">' +
              (cat.coverImage ? '<img src="' + escapeAttr(safeMediaUrl(cat.coverImage)) + '" alt="">' : '<span class="album-card__thumb--empty">' + ICONS.image + "</span>") +
            "</span>" +
            '<span class="album-card__body">' +
              '<span class="album-card__name">' + cat.name + "</span>" +
              '<span class="album-card__meta">' + projectCount + " subfolder" + (projectCount === 1 ? "" : "s") + "</span>" +
            "</span>" +
          "</button>" +
          '<div class="gm-card-actions">' +
            (can("organize") ? '<button type="button" class="btn btn--secondary btn--sm" data-f="rename">Rename</button>' : "") +
          "</div>";

        card.querySelector('[data-f="open"]').addEventListener("click", function () { goProjects(cat.id); });
        var renameBtn = card.querySelector('[data-f="rename"]');
        if (renameBtn) renameBtn.addEventListener("click", renderRename);
      }

      function renderRename() {
        if (!can("organize")) return;
        card.innerHTML =
          '<div class="rename-row"><input type="text" data-f="input">' +
          '<button type="button" class="db-save" data-f="save" title="Save">\u2713</button>' +
          '<button type="button" class="db-cancel" data-f="cancel" title="Cancel">\u2715</button></div>';
        var input = card.querySelector('[data-f="input"]');
        input.value = cat.name;
        card.querySelector('[data-f="cancel"]').addEventListener("click", renderView);
        card.querySelector('[data-f="save"]').addEventListener("click", function () {
          if (!can("organize")) return;
          var v = input.value.trim();
          if (v) { cat.name = v; persistStore(); showToast("Changes saved"); }
          renderView();
        });
      }

      renderView();
      return card;
    }

    /* ---------------- Subfolder (project) screen ---------------- */
    function buildProjectsScreen() {
      var s = state();
      var category = getCategoryById(sectionId, s.categoryId);
      var projects = getProjectsForCategory(sectionId, s.categoryId);
      var panel = el("section", "panel");

      var backRow = el("div", "back-row");
      backRow.appendChild(buildBackLink(config.label, goRoot));
      panel.appendChild(backRow);

      var head = el("div", "gm-toolbar");
      head.innerHTML = '<div class="gm-toolbar__title"><h2 class="panel__title" style="margin:0;">' + (category ? category.name : "") + ' — Subfolders</h2></div>';
      var addBtn = el("button", "btn btn--primary btn--sm", "+ Create Subfolder");
      addBtn.type = "button";
      head.querySelector(".gm-toolbar__title").appendChild(addBtn);
      panel.appendChild(head);

      var formHolder = el("div");
      panel.appendChild(formHolder);
      addBtn.addEventListener("click", function () {
        if (!can("organize")) return;
        formHolder.innerHTML = "";
        var form = el("div", "gm-inline-form");
        form.innerHTML =
          '<label class="field">Subfolder Name<input type="text" data-f="name"></label>' +
          '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Create Subfolder</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>';
        formHolder.appendChild(form);
        form.querySelector('[data-f="cancel"]').addEventListener("click", function () { formHolder.innerHTML = ""; });
        form.querySelector('[data-f="save"]').addEventListener("click", function () {
          if (!can("organize")) return;
          var name = form.querySelector('[data-f="name"]').value.trim();
          if (!name) return;
          var projs = galleryData(sectionId).projects;
          var mediaKey = config.mediaKey;
          var siblings = projs.filter(function (p) { return p.categoryId === s.categoryId; });
          var newProject = {
            id: genId("proj"), categoryId: s.categoryId, name: name,
            description: null, coverPhotoId: null, published: true, order: nextOrder(siblings)
          };
          newProject[mediaKey] = [];
          projs.push(newProject);
          persistStore();
          formHolder.innerHTML = "";
          render();
          showToast("Subfolder created");
        });
      });

      if (projects.length === 0) {
        var empty = el("div");
        empty.innerHTML =
          '<h3 class="empty-state__title">No subfolders yet.</h3>' +
          '<p class="empty-state__body">Create one to start uploading files into it.</p>';
        panel.appendChild(empty);
      } else {
        var grid = el("div", "album-grid");
        projects.forEach(function (p) { grid.appendChild(buildProjectCard(p)); });
        panel.appendChild(grid);
      }
      return panel;
    }

    function buildProjectCard(p) {
      var card = el("div", "album-card");

      function renderView() {
        var coverSrc = resolveCoverSrc(sectionId, p);
        var mediaCount = getMediaList(sectionId, p).length;
        card.innerHTML =
          '<button type="button" class="album-card__link" data-f="open">' +
            '<span class="album-card__thumb">' +
              (coverSrc ? '<img src="' + escapeAttr(safeMediaUrl(coverSrc)) + '" alt="">' : '<span class="album-card__thumb--empty">' + ICONS[config.mediaType === "videos" ? "film" : "image"] + "</span>") +
            "</span>" +
            '<span class="album-card__body">' +
              '<span class="album-card__name">' + p.name + "</span>" +
              '<span class="album-card__meta">' + mediaCount + " " + config.mediaNoun + (mediaCount === 1 ? "" : "s") + "</span>" +
            "</span>" +
          "</button>" +
          '<div class="gm-card-actions">' +
            (can("organize") ? '<button type="button" class="btn btn--secondary btn--sm" data-f="rename">Rename</button>' : "") +
          "</div>";

        card.querySelector('[data-f="open"]').addEventListener("click", function () { goMedia(state().categoryId, p.id); });
        var renameBtn = card.querySelector('[data-f="rename"]');
        if (renameBtn) renameBtn.addEventListener("click", renderRename);
      }

      function renderRename() {
        if (!can("organize")) return;
        card.innerHTML =
          '<div class="rename-row"><input type="text" data-f="input">' +
          '<button type="button" class="db-save" data-f="save" title="Save">\u2713</button>' +
          '<button type="button" class="db-cancel" data-f="cancel" title="Cancel">\u2715</button></div>';
        var input = card.querySelector('[data-f="input"]');
        input.value = p.name;
        card.querySelector('[data-f="cancel"]').addEventListener("click", renderView);
        card.querySelector('[data-f="save"]').addEventListener("click", function () {
          if (!can("organize")) return;
          var v = input.value.trim();
          if (v) { p.name = v; persistStore(); showToast("Changes saved"); }
          renderView();
        });
      }

      renderView();
      return card;
    }

    /* ---------------- Media (file) screen ---------------- */
    function buildMediaScreen() {
      var s = state();
      var project = getProjectById(sectionId, s.projectId);
      var category = getCategoryById(sectionId, s.categoryId);
      var panel = el("section", "panel");

      var backRow = el("div", "back-row");
      backRow.appendChild(buildBackLink((category ? category.name : config.label) + " — Subfolders", function () { goProjects(s.categoryId); }));
      panel.appendChild(backRow);

      if (!project) {
        panel.appendChild(el("h2", "panel__title", "Subfolder not found"));
        return panel;
      }

      panel.appendChild(el("h2", "panel__title", project.name));
      panel.appendChild(buildUploaderUploadZone(project));

      var mediaList = getMediaList(sectionId, project);
      if (mediaList.length === 0) {
        var emptyText = config.mediaType === "videos" ? "No videos yet." : "No photos yet.";
        panel.appendChild(el("h3", "empty-state__title", emptyText));
      } else if (config.mediaType === "videos") {
        var vgrid = el("div", "video-grid");
        mediaList.forEach(function (v, idx) { vgrid.appendChild(buildUploaderVideoCard(project, v, idx, mediaList)); });
        panel.appendChild(vgrid);
      } else {
        var pgrid = el("div", "photo-grid");
        mediaList.forEach(function (ph, idx) { pgrid.appendChild(buildUploaderPhotoCard(project, ph, idx, mediaList)); });
        panel.appendChild(pgrid);
      }

      return panel;
    }

    // Uploader's upload flow STAGES files first, so the display/file
    // name can be entered/edited BEFORE anything is saved — unlike the
    // Admin upload zone (Part 4), which commits immediately on
    // selection. Each staged row is a real, persistent DOM node (not
    // rebuilt on every keystroke) so typing a name never loses focus.
    function buildUploaderUploadZone(project) {
      if (!can("upload")) return document.createElement("div");
      var isVideo = config.mediaType === "videos";
      var mediaKey = config.mediaKey;
      var staged = []; // { file, name, previewUrl, rowEl }

      var zone = el("div", "gm-dropzone");
      zone.innerHTML =
        '<p>' + (isVideo ? "Drag videos here or Select Videos" : "Drag photos here or Select Photos") + '</p>' +
        '<input type="file" accept="' + (isVideo ? "video/*" : "image/*") + '" multiple data-f="file">' +
        '<p class="gm-storage-note">Choose your files, then set a display name for each before uploading. ' +
        (isVideo
          ? "Prototype storage: thumbnails are saved to this browser; full video playback only lasts for this browser session."
          : "Prototype storage: photos are saved in this browser only (as embedded image data), not a real file server.") +
        "</p>";

      var stagingHolder = el("div", "gm-staging-list");
      zone.appendChild(stagingHolder);

      var actionsHolder = el("div", "card-actions");
      zone.appendChild(actionsHolder);

      function cleanName(filename) {
        return filename.replace(/\.[a-zA-Z0-9]+$/, "");
      }

      function renderActions() {
        actionsHolder.innerHTML = "";
        if (!staged.length) return;
        var uploadBtn = el("button", "btn btn--primary btn--sm", "Upload " + staged.length + " file" + (staged.length === 1 ? "" : "s"));
        uploadBtn.type = "button";
        uploadBtn.addEventListener("click", commitStaged);
        actionsHolder.appendChild(uploadBtn);
      }

      function addStagedRow(file, previewUrl) {
        var item = { file: file, name: cleanName(file.name), previewUrl: previewUrl };
        var row = el("div", "rename-row");
        row.innerHTML =
          (previewUrl ? '<img src="' + previewUrl + '" style="width:36px;height:36px;object-fit:cover;border-radius:4px;flex:none;">' : "") +
          '<input type="text" data-f="name" style="flex:1;">' +
          '<button type="button" class="db-cancel" data-f="remove" title="Remove">\u2715</button>';
        row.querySelector('[data-f="name"]').value = item.name;
        row.querySelector('[data-f="name"]').addEventListener("input", function (e) { item.name = e.target.value; });
        row.querySelector('[data-f="remove"]').addEventListener("click", function () {
          staged = staged.filter(function (s2) { return s2 !== item; });
          stagingHolder.removeChild(row);
          renderActions();
        });
        item.rowEl = row;
        staged.push(item);
        stagingHolder.appendChild(row);
        renderActions();
      }

      function handleFiles(fileList) {
        if (!can("upload")) return;
        var files = Array.prototype.slice.call(fileList);
        files.forEach(function (file) {
          if (isVideo) {
            addStagedRow(file, null);
          } else {
            var reader = new FileReader();
            reader.onload = function (ev) { addStagedRow(file, ev.target.result); };
            reader.readAsDataURL(file);
          }
        });
      }

      function commitStaged() {
        if (!can("upload")) return;
        if (!project[mediaKey]) project[mediaKey] = [];
        var remaining = staged.length;
        var batch = staged.slice();
        staged = [];
        showToast("Uploading " + remaining + " file" + (remaining === 1 ? "" : "s") + "\u2026");

        /* BUSINESS MEDIA (D17). Same path the Admin gallery uses: HD
           original preserved untouched, display copy and thumbnail
           generated alongside, videos never re-encoded.

           The display NAME the Uploader chose is stored in the database
           title/caption. The stored FILE gets a generated UUID name —
           user-controlled storage paths invite collisions and path
           manipulation, and the display name is what they actually
           care about. */
        var uploads = batch.map(function (item) {
          var displayName = item.name.trim() || cleanName(item.file.name);
          return window.LLCMedia.uploadBusinessMedia(item.file, project.id)
            .then(function (out) {
              var order = nextOrder(project[mediaKey]);
              var mediaItem = isVideo
                ? {
                    id: out.mediaId, title: displayName, description: null,
                    thumbnail: out.thumbnailUrl || null, videoUrl: out.url || null,
                    storagePath: out.path, date: null, order: order, published: true
                  }
                : {
                    id: out.mediaId, image: out.displayUrl || out.url || null,
                    thumbnail: out.thumbnailUrl || null, storagePath: out.path,
                    caption: displayName, order: order, published: true
                  };
              project[mediaKey].push(mediaItem);
              if (!project.coverPhotoId) project.coverPhotoId = mediaItem.id;
            });
        });

        Promise.all(uploads)
          .then(function () {
            persistStore();
            showToast("Uploaded " + remaining + " file" + (remaining === 1 ? "" : "s"));
            render();
          })
          .catch(function (err) {
            persistStore();
            showToast("Some files could not be uploaded.");
            if (window.console) console.error(err);
            render();
          });
      }

      zone.querySelector('[data-f="file"]').addEventListener("change", function (e) {
        handleFiles(e.target.files);
        e.target.value = "";
      });
      zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("gm-dropzone--drag"); });
      zone.addEventListener("dragleave", function () { zone.classList.remove("gm-dropzone--drag"); });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        zone.classList.remove("gm-dropzone--drag");
        if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
      });

      return zone;
    }

    function buildUploaderPhotoCard(project, photo, idx, sortedList) {
      var card = el("div", "photo-card");
      card.style.position = "relative";
      var isCover = project.coverPhotoId === photo.id;
      card.innerHTML =
        (isCover ? '<span class="gm-cover-star" title="Cover photo">\u2605</span>' : "") +
        '<div class="photo-thumb" style="width:100%;"><img src="' + photo.image + '" alt=""></div>' +
        '<div class="gm-card-actions">' +
          '<span class="gm-reorder">' +
            '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + ">\u25B2</button>" +
            '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + ">\u25BC</button>" +
          "</span>" +
        "</div>" +
        (photo.caption ? '<p class="video-card__desc" style="padding:4px 8px 8px;margin:0;font-size:0.72rem;">' + escapeHtml(photo.caption) + "</p>" : "");

      card.querySelector('[data-f="up"]').addEventListener("click", function () {
        if (!can("upload")) return;
        if (moveItemOrder(sortedList, photo.id, -1)) { persistStore(); render(); }
      });
      card.querySelector('[data-f="down"]').addEventListener("click", function () {
        if (!can("upload")) return;
        if (moveItemOrder(sortedList, photo.id, 1)) { persistStore(); render(); }
      });
      return card;
    }

    function buildUploaderVideoCard(project, video, idx, sortedList) {
      var card = el("div", "video-card");
      var isCover = project.coverPhotoId === video.id;
      card.innerHTML =
        '<div style="position:relative;">' +
          (isCover ? '<span class="gm-cover-star" title="Cover video">\u2605</span>' : "") +
          '<div class="video-card__thumb">' +
            (video.thumbnail ? '<img src="' + escapeAttr(safeMediaUrl(video.thumbnail)) + '" alt="">' : '<span class="video-card__no-preview">No preview</span>') +
          "</div>" +
        "</div>" +
        '<div class="video-card__body"><p class="video-card__title">' + escapeHtml(video.title) + "</p></div>" +
        '<div class="gm-card-actions">' +
          '<span class="gm-reorder">' +
            '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + ">\u25B2</button>" +
            '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + ">\u25BC</button>" +
          "</span>" +
        "</div>";

      card.querySelector('[data-f="up"]').addEventListener("click", function () {
        if (!can("upload")) return;
        if (moveItemOrder(sortedList, video.id, -1)) { persistStore(); render(); }
      });
      card.querySelector('[data-f="down"]').addEventListener("click", function () {
        if (!can("upload")) return;
        if (moveItemOrder(sortedList, video.id, 1)) { persistStore(); render(); }
      });
      return card;
    }

    render();
    return container;
  }



  /* ============================================================
   * REVIEWS (Phase 10 correction)
   * ============================================================
   * A SIMPLE FLAT LIST — deliberately NOT part of the Gallery
   * category/project hierarchy. Field names match the real
   * js/data.js "reviews.items" shape exactly (customerName,
   * customerPhoto, text, date, project, location, video, published,
   * order); nothing invented. Starts empty — no fake reviews.
   */

  function buildReviewsPanel() {
    if (!can("edit")) return buildAccessDeniedPanel();

    var wrap = document.createElement("div");
    wrap.appendChild(buildReviewsIntro());
    wrap.appendChild(buildReviewsListCard());
    return wrap;
  }

  function buildReviewsIntro() {
    var panel = el("section", "panel");
    panel.innerHTML =
      '<h2 class="panel__title">Reviews</h2>' +
      '<div class="panel__body"><p>A simple flat list of customer reviews \u2014 there are no folders, categories, or ' +
      "projects here, unlike the 5 photo/video galleries. Each review is its own independent item.</p></div>";
    return panel;
  }

  function buildReviewsListCard() {
    var panel = el("section", "panel edit-card");
    var addFormOpen = false;

    function render() {
      var reviews = STORE.reviews.items.slice().sort(function (a, b) { return a.order - b.order; });

      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">All Reviews <span class="db-count">(' + reviews.length + ')</span></h2>' +
          '<button type="button" class="btn btn--primary btn--sm" data-f="add">' + (addFormOpen ? "Close" : "+ Add Review") + "</button>" +
        "</div>";

      var formHolder = el("div");
      panel.appendChild(formHolder);
      if (addFormOpen) formHolder.appendChild(buildReviewForm(null, function () { addFormOpen = false; render(); }));

      panel.querySelector('[data-f="add"]').addEventListener("click", function () {
        addFormOpen = !addFormOpen;
        render();
      });

      if (!reviews.length) {
        var empty = el("div");
        empty.innerHTML = '<h3 class="empty-state__title">No reviews yet.</h3><p class="empty-state__body">Use \u201c+ Add Review\u201d above to add the first one.</p>';
        panel.appendChild(empty);
      } else {
        var grid = el("div", "album-grid");
        reviews.forEach(function (review, idx) { grid.appendChild(buildReviewCard(review, idx, reviews)); });
        panel.appendChild(grid);
      }
    }

    function buildReviewCard(review, idx, sortedList) {
      var card = el("div", "album-card" + (review.published === false ? " album-card--hidden" : ""));

      function renderView() {
        var preview = (review.text || "").length > 90 ? review.text.slice(0, 87) + "\u2026" : (review.text || "");
        card.innerHTML =
          '<span class="album-card__thumb">' +
            (review.customerPhoto ? '<img src="' + escapeAttr(safeMediaUrl(review.customerPhoto)) + '" alt="">' : '<span class="album-card__thumb--empty">' + ICONS.star + "</span>") +
          "</span>" +
          '<span class="album-card__body">' +
            '<span class="album-card__name">' + escapeHtml(review.customerName || "(no name)") + (review.published === false ? ' <span class="hidden-tag">Hidden</span>' : "") + "</span>" +
            (preview ? '<span class="album-card__desc"></span>' : "") +
            (review.date ? '<span class="album-card__meta">' + formatDateSignedUp(review.date) + "</span>" : "") +
          "</span>" +
          '<div class="gm-card-actions">' +
            '<span class="gm-reorder">' +
              '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + ">\u25B2</button>" +
              '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + ">\u25BC</button>" +
            "</span>" +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="edit">Edit</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">' + (review.published === false ? "Show" : "Hide") + "</button>" +
            '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
          "</div>";
        if (preview) card.querySelector(".album-card__desc").textContent = preview;

        card.querySelector('[data-f="up"]').addEventListener("click", function () {
          if (!can("edit")) return;
          if (moveItemOrder(sortedList, review.id, -1)) { persistStore(); render(); }
        });
        card.querySelector('[data-f="down"]').addEventListener("click", function () {
          if (!can("edit")) return;
          if (moveItemOrder(sortedList, review.id, 1)) { persistStore(); render(); }
        });
        card.querySelector('[data-f="edit"]').addEventListener("click", function () {
          card.innerHTML = "";
          card.appendChild(buildReviewForm(review, function (changed) {
            if (changed) render(); else renderView();
          }));
        });
        card.querySelector('[data-f="toggle"]').addEventListener("click", function () {
          if (!can("edit")) return;
          review.published = review.published === false ? true : false;
          persistStore();
          render();
          showToast(review.published ? "Review shown" : "Review hidden");
        });
        card.querySelector('[data-f="delete"]').addEventListener("click", function () {
          if (!can("delete")) return;
          showConfirmDialog({
            title: "Delete this review permanently?",
            body: "This permanently removes this review only \u2014 no other reviews, clients, gallery media, or messages are affected. This cannot be undone.",
            confirmLabel: "Delete Permanently",
            onConfirm: function () {
              STORE.reviews.items = STORE.reviews.items.filter(function (r) { return r.id !== review.id; });
              persistStore();
              render();
              showToast("Review deleted permanently");
            }
          });
        });
      }

      renderView();
      return card;
    }

    render();
    return panel;
  }

  // Shared Add/Edit form for a single review. onDone(changed) is
  // called after Save (changed=true) or Cancel (changed=false).
  function buildReviewForm(existingReview, onDone) {
    var isNew = !existingReview;
    var draft = isNew
      ? { customerName: "", customerPhoto: null, text: "", date: "", project: "", location: "", video: "" }
      : {
          customerName: existingReview.customerName || "",
          customerPhoto: existingReview.customerPhoto || null,
          text: existingReview.text || "",
          date: existingReview.date || "",
          project: existingReview.project || "",
          location: existingReview.location || "",
          video: existingReview.video || ""
        };

    var form = el("div", "gm-inline-form");
    form.innerHTML =
      '<label class="field">Customer / Reviewer Name<input type="text" data-f="customerName"></label>' +
      '<label class="field">Review Text<textarea data-f="text" rows="3"></textarea></label>' +
      '<label class="field">Photo (optional)<input type="file" accept="image/*" data-f="photo"></label>' +
      '<div class="photo-preview-row" data-f="photo-preview-row" style="' + (draft.customerPhoto ? "" : "display:none;") + '">' +
        '<div class="photo-preview-frame photo-preview-frame--profile"><img data-f="photo-preview" alt=""></div>' +
      "</div>" +
      '<label class="field">Date (optional)<input type="date" data-f="date"></label>' +
      '<label class="field">Project (optional)<input type="text" data-f="project" placeholder="e.g. Bungalow, Batangas"></label>' +
      '<label class="field">Location (optional)<input type="text" data-f="location"></label>' +
      '<label class="field">Video URL (optional)<input type="text" data-f="video" placeholder="https:\u2026"></label>' +
      '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Save</button>' +
      '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>';

    form.querySelector('[data-f="customerName"]').value = draft.customerName;
    form.querySelector('[data-f="text"]').value = draft.text;
    form.querySelector('[data-f="date"]').value = draft.date;
    form.querySelector('[data-f="project"]').value = draft.project;
    form.querySelector('[data-f="location"]').value = draft.location;
    form.querySelector('[data-f="video"]').value = draft.video;
    if (draft.customerPhoto) form.querySelector('[data-f="photo-preview"]').src = draft.customerPhoto;

    form.querySelector('[data-f="customerName"]').addEventListener("input", function (e) { draft.customerName = e.target.value; });
    form.querySelector('[data-f="text"]').addEventListener("input", function (e) { draft.text = e.target.value; });
    form.querySelector('[data-f="date"]').addEventListener("input", function (e) { draft.date = e.target.value; });
    form.querySelector('[data-f="project"]').addEventListener("input", function (e) { draft.project = e.target.value; });
    form.querySelector('[data-f="location"]').addEventListener("input", function (e) { draft.location = e.target.value; });
    form.querySelector('[data-f="video"]').addEventListener("input", function (e) { draft.video = e.target.value; });
    form.querySelector('[data-f="photo"]').addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      /* D17: review photos display at ~500px, so they are stored at
         that size rather than at camera resolution. */
      var row = form.querySelector('[data-f="photo-preview-row"]');
      row.style.display = "";
      form.querySelector('[data-f="photo-preview"]').src = URL.createObjectURL(file);
      window.LLCMedia.uploadDisplayAsset(file, "review-photo")
        .then(function (out) { draft.customerPhoto = out.path; })
        .catch(function (err) {
          showToast("That photo could not be prepared.");
          if (window.console) console.error(err);
        });
    });

    form.querySelector('[data-f="cancel"]').addEventListener("click", function () { onDone(false); });
    form.querySelector('[data-f="save"]').addEventListener("click", function () {
      if (!can("edit")) return;
      if (!draft.customerName.trim() && !draft.text.trim()) {
        showToast("Enter at least a name or review text.");
        return;
      }
      if (isNew) {
        STORE.reviews.items.push({
          id: genId("review"),
          customerName: draft.customerName.trim() || null,
          customerPhoto: draft.customerPhoto,
          text: draft.text.trim() || null,
          date: draft.date || null,
          project: draft.project.trim() || null,
          location: draft.location.trim() || null,
          video: draft.video.trim() || null,
          published: true,
          order: nextOrder(STORE.reviews.items)
        });
      } else {
        existingReview.customerName = draft.customerName.trim() || null;
        existingReview.customerPhoto = draft.customerPhoto;
        existingReview.text = draft.text.trim() || null;
        existingReview.date = draft.date || null;
        existingReview.project = draft.project.trim() || null;
        existingReview.location = draft.location.trim() || null;
        existingReview.video = draft.video.trim() || null;
      }
      persistStore();
      showToast("Changes saved");
      onDone(true);
    });

    return form;
  }

  /* ============================================================
   * TESTIMONIAL VIDEOS (Phase 10 correction)
   * ============================================================
   * A SIMPLE FLAT LIST of video testimonials — NOT one of the 5
   * hierarchical Gallery managers, and stored completely separately
   * (STORE.videoTestimonials, matching the real js/data.js shape:
   * title, description, thumbnail, videoUrl, customerName, project,
   * date, published, order). A Testimonial Video can never end up
   * inside STORE.galleries, and Gallery videos can never end up here
   * — the two collections are entirely independent arrays.
   */

  function buildTestimonialVideosPanel() {
    if (!can("edit")) return buildAccessDeniedPanel();

    var wrap = document.createElement("div");
    wrap.appendChild(buildTestimonialIntro());
    wrap.appendChild(buildTestimonialUploadCard());
    wrap.appendChild(buildTestimonialListCard());
    return wrap;
  }

  function buildTestimonialIntro() {
    var panel = el("section", "panel");
    panel.innerHTML =
      '<h2 class="panel__title">Testimonial Videos</h2>' +
      '<div class="panel__body"><p>A simple flat list of video testimonials \u2014 no folders, categories, or projects, ' +
      "and completely separate storage from the 5 photo/video galleries. Uploading here can never affect, or be affected " +
      "by, Gallery media.</p></div>";
    return panel;
  }

  function buildTestimonialUploadCard() {
    var panel = el("section", "panel edit-card");
    panel.innerHTML = '<div class="card-head"><h2 class="panel__title" style="margin:0;">Upload a Testimonial Video</h2></div>';

    var zone = el("div", "gm-dropzone");
    zone.innerHTML =
      '<p>Drag videos here or Select Videos</p>' +
      '<input type="file" accept="video/*" multiple data-f="file">' +
      '<p class="gm-storage-note">Videos are stored in Supabase Storage at full quality and are not compressed. ' +
      "They remain available after closing this page. " +
      "</p>";

    zone.querySelector('[data-f="file"]').addEventListener("change", function (e) {
      handleTestimonialFiles(e.target.files);
      e.target.value = "";
    });
    zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.classList.add("gm-dropzone--drag"); });
    zone.addEventListener("dragleave", function () { zone.classList.remove("gm-dropzone--drag"); });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      zone.classList.remove("gm-dropzone--drag");
      if (e.dataTransfer && e.dataTransfer.files) handleTestimonialFiles(e.dataTransfer.files);
    });

    function handleTestimonialFiles(fileList) {
      if (!can("edit")) return;
      var files = Array.prototype.slice.call(fileList);
      /* Testimonial videos go to their OWN bucket, never gallery-media.
         They are a flat collection with no folders — the separation from
         Completed Project Videos is kept in Storage as well as in the
         database. HD preserved, no browser compression (D17). */
      files.forEach(function (file) {
        showToast("Uploading video\u2026");
        window.LLCMedia.uploadTestimonialVideo(file)
          .then(function (out) {
            STORE.videoTestimonials.items.push({
              id: out.mediaId,
              title: file.name.replace(/\.[a-zA-Z0-9]+$/, "") || "Untitled testimonial",
              description: null,
              thumbnail: out.thumbnailUrl || null,
              videoUrl: out.url || null,
              storagePath: out.path,
              customerName: null, project: null, date: null,
              published: true, order: nextOrder(STORE.videoTestimonials.items)
            });
            persistStore();
            showToast("Video uploaded");
            rerenderTestimonialsSection();
          })
          .catch(function (err) {
            showToast("That video could not be uploaded.");
            if (window.console) console.error(err);
          });
      });
    }

    panel.appendChild(zone);
    return panel;
  }

  // The list card re-renders itself; the upload card above calls this
  // shared trigger (via renderMain) so a freshly uploaded video shows
  // up immediately without a full page navigation.
  function rerenderTestimonialsSection() {
    if (activeSection === "testimonial-videos") renderMain();
  }

  function buildTestimonialListCard() {
    var panel = el("section", "panel edit-card");

    function render() {
      var videos = STORE.videoTestimonials.items.slice().sort(function (a, b) { return a.order - b.order; });
      panel.innerHTML = '<div class="card-head"><h2 class="panel__title">All Testimonial Videos <span class="db-count">(' + videos.length + ')</span></h2></div>';

      if (!videos.length) {
        var empty = el("div");
        empty.innerHTML = '<h3 class="empty-state__title">No videos yet.</h3><p class="empty-state__body">Use the upload area above to add the first one.</p>';
        panel.appendChild(empty);
      } else {
        var grid = el("div", "video-grid");
        videos.forEach(function (v, idx) { grid.appendChild(buildTestimonialVideoCard(v, idx, videos)); });
        panel.appendChild(grid);
      }
    }

    function buildTestimonialVideoCard(video, idx, sortedList) {
      var card = el("div", "video-card" + (video.published === false ? " video-card--hidden" : ""));

      function renderView() {
        card.innerHTML =
          '<button type="button" class="video-card__thumb" data-f="preview">' +
            (video.thumbnail ? '<img src="' + escapeAttr(safeMediaUrl(video.thumbnail)) + '" alt="">' : '<span class="video-card__no-preview">No preview</span>') +
          "</button>" +
          '<div class="video-card__body">' +
            '<p class="video-card__title">' + escapeHtml(video.title) + (video.published === false ? ' <span class="hidden-tag">Hidden</span>' : "") + "</p>" +
            (video.customerName ? '<p class="video-card__desc">' + escapeHtml(video.customerName) + (video.project ? " \u2014 " + escapeHtml(video.project) : "") + "</p>" : "") +
          "</div>" +
          '<div class="gm-card-actions">' +
            '<span class="gm-reorder">' +
              '<button type="button" data-f="up"' + (idx === 0 ? " disabled" : "") + ">\u25B2</button>" +
              '<button type="button" data-f="down"' + (idx === sortedList.length - 1 ? " disabled" : "") + ">\u25BC</button>" +
            "</span>" +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="edit">Edit</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle">' + (video.published === false ? "Show" : "Hide") + "</button>" +
            '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' +
          "</div>";

        card.querySelector('[data-f="preview"]').addEventListener("click", function () { openTestimonialPreview(video); });
        card.querySelector('[data-f="up"]').addEventListener("click", function () {
          if (!can("edit")) return;
          if (moveItemOrder(sortedList, video.id, -1)) { persistStore(); render(); }
        });
        card.querySelector('[data-f="down"]').addEventListener("click", function () {
          if (!can("edit")) return;
          if (moveItemOrder(sortedList, video.id, 1)) { persistStore(); render(); }
        });
        card.querySelector('[data-f="edit"]').addEventListener("click", renderEdit);
        card.querySelector('[data-f="toggle"]').addEventListener("click", function () {
          if (!can("edit")) return;
          video.published = video.published === false ? true : false;
          persistStore();
          render();
        });
        card.querySelector('[data-f="delete"]').addEventListener("click", function () {
          if (!can("delete")) return;
          showConfirmDialog({
            title: "Delete this testimonial video permanently?",
            body: "This permanently removes only this testimonial video \u2014 Gallery videos, Reviews, clients, and messages are never affected. This cannot be undone.",
            confirmLabel: "Delete Permanently",
            onConfirm: function () {
              STORE.videoTestimonials.items = STORE.videoTestimonials.items.filter(function (v) { return v.id !== video.id; });
              persistStore();
              render();
              showToast("Testimonial video deleted permanently");
            }
          });
        });
      }

      function renderEdit() {
        card.innerHTML =
          '<div class="rename-row" style="flex-direction:column; align-items:stretch;">' +
            '<label class="field">Title<input type="text" data-f="title"></label>' +
            '<label class="field">Description (optional)<textarea data-f="description" rows="2"></textarea></label>' +
            '<label class="field">Customer Name (optional)<input type="text" data-f="customerName"></label>' +
            '<label class="field">Project (optional)<input type="text" data-f="project"></label>' +
            '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Save</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>' +
          "</div>";
        card.querySelector('[data-f="title"]').value = video.title || "";
        card.querySelector('[data-f="description"]').value = video.description || "";
        card.querySelector('[data-f="customerName"]').value = video.customerName || "";
        card.querySelector('[data-f="project"]').value = video.project || "";
        card.querySelector('[data-f="cancel"]').addEventListener("click", renderView);
        card.querySelector('[data-f="save"]').addEventListener("click", function () {
          if (!can("edit")) return;
          var newTitle = card.querySelector('[data-f="title"]').value.trim();
          if (!newTitle) { showToast("Enter a title first."); return; }
          video.title = newTitle;
          video.description = card.querySelector('[data-f="description"]').value.trim() || null;
          video.customerName = card.querySelector('[data-f="customerName"]').value.trim() || null;
          video.project = card.querySelector('[data-f="project"]').value.trim() || null;
          persistStore();
          showToast("Changes saved");
          renderView();
        });
      }

      renderView();
      return card;
    }

    render();
    return panel;
  }

  function openTestimonialPreview(video) {
    var overlay = el("div", "admin-photo-modal");
    overlay.innerHTML =
      '<div class="admin-photo-modal__panel">' +
        '<button type="button" class="admin-photo-modal__close" data-f="close">\u00D7</button>' +
        (video.videoUrl
          ? '<video data-f="player" controls style="width:100%;max-height:62vh;background:#000;border-radius:6px;display:block;"></video>'
          : '<p class="empty-state__body">No preview available for this video.</p>') +
        '<div class="admin-photo-modal__meta">' + escapeHtml(video.title) + "</div>" +
      "</div>";
    if (video.videoUrl) overlay.querySelector('[data-f="player"]').src = video.videoUrl;
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.querySelector('[data-f="close"]').addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
  }


  function buildDatabasePanel() {
    // Defense in depth: this is the FULL editable Database (Part 3).
    // Restricted roles get buildRestrictedClientMatrix() instead via
    // renderMain — this function itself refuses direct use by anyone
    // without edit permission.
    if (!can("edit")) return buildAccessDeniedPanel();
    var wrap = document.createElement("div");
    wrap.appendChild(buildDatabaseIntro());
    wrap.appendChild(buildDatabaseTableCard());
    return wrap;
  }

  function buildDatabaseIntro() {
    var panel = el("section", "panel");
    panel.innerHTML =
      '<span class="coming-soon__badge">Phase 10 — Part 3</span>' +
      '<h2 class="panel__title" style="margin-top:10px;">Client Database</h2>' +
      '<div class="panel__body"><p>Admin-only — Client visitors never see this. Because the Client site and this ' +
      'Admin app are currently two separate files with isolated browser storage, sign-ups made on the live Client ' +
      'site are not automatically synced here yet; that link is real backend work for a later phase. For now, ' +
      'records are entered here directly by the Admin — the same way Reviews are entered on a customer\u2019s ' +
      'behalf — and the whole matrix below (columns, editing, search, sort, archive) is fully built and ready for ' +
      'real sign-ups the moment that sync exists.</p></div>';
    return panel;
  }

  // Renders one clickable, tappable <th>. Shows a bold arrow on the
  // currently active sort column, a faint neutral icon on the rest (a
  // visual hint that they're clickable without shouting for attention).
  function sortableHeader(column, label) {
    var isActive = dbSortColumn === column;
    var arrow = isActive ? (dbSortDirection === "asc" ? "\u2191" : "\u2193") : "\u21C5";
    return (
      '<th class="db-th-sortable' + (isActive ? " db-th-sortable--active" : "") + '">' +
        '<button type="button" class="db-sort-btn" data-sort-col="' + column + '">' +
          label + ' <span class="db-sort-arrow">' + arrow + '</span>' +
        '</button>' +
      '</th>'
    );
  }

  function buildDatabaseTableCard() {
    var panel = el("section", "panel edit-card");
    var addFormOpen = false;
    var addDraft = null;

    function render() {
      var visible = getVisibleClients();
      var allSelected = visible.length > 0 && visible.every(function (c) { return selectedIds.has(c.id); });

      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Client Records <span class="db-count">(' + visible.length + (dbShowArchived ? " archived" : "") + ')</span></h2></div>' +
        '<div class="db-toolbar">' +
          '<div class="db-toolbar__search"><input type="text" data-f="search" placeholder="Search name, mobile, or email" value="' + escapeAttr(dbSearchTerm) + '"></div>' +
          '<div class="db-toolbar__right">' +
            '<label class="inline-check"><input type="checkbox" data-f="show-archived"' + (dbShowArchived ? " checked" : "") + '> Show archived</label>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="archive-selected"' + (selectedIds.size === 0 || dbShowArchived ? " disabled" : "") + '>Archive Selected</button>' +
            '<button type="button" class="btn btn--danger btn--sm" data-f="delete-selected"' + (selectedIds.size === 0 || dbShowArchived ? " disabled" : "") + '>Delete Selected</button>' +
            '<button type="button" class="btn btn--primary btn--sm" data-f="add-client">' + (addFormOpen ? "Close" : "+ Add Client") + '</button>' +
          '</div>' +
        '</div>' +
        (addFormOpen ? buildAddFormHtml() : "") +
        '<div class="table-scroll">' +
          '<table class="db-table">' +
            '<thead><tr>' +
              '<th><input type="checkbox" data-f="select-all"' + (allSelected ? " checked" : "") + (dbShowArchived ? " disabled" : "") + '></th>' +
              sortableHeader("name", "Name") +
              sortableHeader("mobile", "Mobile Number") +
              sortableHeader("email", "Email Address") +
              sortableHeader("date", "Date Signed Up") +
              (dbShowArchived
                ? '<th colspan="6">Archived Record</th>'
                : (
                    sortableHeader("remarks", "Remarks") +
                    sortableHeader("projectType", "Project Type") +
                    sortableHeader("bedrooms", "Bedrooms") +
                    sortableHeader("cr", "CR") +
                    sortableHeader("bestTimeToCall", "Best Time to Call") +
                    sortableHeader("budgetMax", "Budget Max")
                  )) +
            '</tr></thead>' +
            '<tbody data-f="tbody"></tbody>' +
          '</table>' +
        '</div>';

      if (addFormOpen) wireAddForm();

      var tbody = panel.querySelector('[data-f="tbody"]');
      if (!visible.length) {
        var emptyTr = document.createElement("tr");
        var emptyTd = document.createElement("td");
        emptyTd.setAttribute("colspan", "11");
        emptyTd.className = "db-empty-state";
        emptyTd.textContent = dbShowArchived
          ? "No archived client records."
          : (CLIENTS.list.length ? "No client records match your search." : "No client records yet. Use \u201c+ Add Client\u201d to add one.");
        emptyTr.appendChild(emptyTd);
        tbody.appendChild(emptyTr);
      } else if (dbShowArchived) {
        visible.forEach(function (c) { tbody.appendChild(buildArchivedRow(c, render)); });
      } else {
        visible.forEach(function (c) {
          var pair = buildClientRow(c, render);
          tbody.appendChild(pair.tr);
          tbody.appendChild(pair.detailTr);
        });
      }

      wireToolbar();
    }

    function wireToolbar() {
      var searchInput = panel.querySelector('[data-f="search"]');
      searchInput.addEventListener("input", function (e) {
        dbSearchTerm = e.target.value;
        var pos = e.target.selectionStart;
        render();
        var again = panel.querySelector('[data-f="search"]');
        again.focus();
        again.setSelectionRange(pos, pos);
      });
      var sortButtons = panel.querySelectorAll(".db-sort-btn");
      Array.prototype.forEach.call(sortButtons, function (btn) {
        btn.addEventListener("click", function () {
          var column = btn.getAttribute("data-sort-col");
          if (dbSortColumn === column) {
            // Same column clicked again — simple two-state toggle,
            // asc <-> desc, applied consistently everywhere. There is
            // no third "unsorted" state; this keeps behavior predictable.
            dbSortDirection = dbSortDirection === "asc" ? "desc" : "asc";
          } else {
            dbSortColumn = column;
            dbSortDirection = "asc";
          }
          render();
        });
      });
      panel.querySelector('[data-f="show-archived"]').addEventListener("change", function (e) {
        dbShowArchived = e.target.checked;
        selectedIds.clear();
        render();
      });
      var selectAll = panel.querySelector('[data-f="select-all"]');
      if (selectAll) {
        selectAll.addEventListener("change", function (e) {
          var checked = e.target.checked;
          getVisibleClients().forEach(function (c) {
            if (checked) selectedIds.add(c.id); else selectedIds.delete(c.id);
          });
          render();
        });
      }
      panel.querySelector('[data-f="archive-selected"]').addEventListener("click", function () {
        if (!selectedIds.size) return;
        var count = selectedIds.size;
        var ok = window.confirm(
          "Archive " + count + " selected client record" + (count === 1 ? "" : "s") + "? This removes " +
          (count === 1 ? "it" : "them") + " from the active list but keeps all data \u2014 restore anytime from " +
          "\u201cShow archived.\u201d Message history and gallery content are not affected."
        );
        if (!ok) return;
        CLIENTS.list.forEach(function (c) { if (selectedIds.has(c.id)) c.archived = true; });
        selectedIds.clear();
        persistClients();
        render();
        showToast("Archived " + count + " record" + (count === 1 ? "" : "s"));
      });
      panel.querySelector('[data-f="delete-selected"]').addEventListener("click", function () {
        if (!selectedIds.size) return;
        var count = selectedIds.size;
        showConfirmDialog({
          title: "Delete " + count + " client" + (count === 1 ? "" : "s") + " permanently?",
          body:
            "This permanently removes the selected client record" + (count === 1 ? "" : "s") + " from this Admin " +
            "prototype's database and cannot be undone \u2014 unlike Archive, there is no way to restore " +
            (count === 1 ? "it" : "them") + " afterward. This prototype does not currently link any conversation " +
            "or chat history to client records (that link is built in a later Phase 10 part), so no message data " +
            "is affected either way. No other client, company content, or gallery data is touched.",
          confirmLabel: "Delete Permanently",
          onConfirm: function () {
            // Filter OUT only the checked ids — every unchecked client's
            // record and ID is left completely untouched.
            CLIENTS.list = CLIENTS.list.filter(function (c) { return !selectedIds.has(c.id); });
            selectedIds.clear();
            persistClients();
            render();
            showToast("Deleted " + count + " client record" + (count === 1 ? "" : "s") + " permanently");
          }
        });
      });
      panel.querySelector('[data-f="add-client"]').addEventListener("click", function () {
        addFormOpen = !addFormOpen;
        if (addFormOpen) addDraft = { firstName: "", middleName: "", lastName: "", mobileNumber: "", email: "", locationAddress: "" };
        render();
      });
    }

    function buildAddFormHtml() {
      return (
        '<div class="db-add-form">' +
          '<h3 class="panel__title" style="font-size:1rem;">Add Client Record</h3>' +
          '<p class="hours-caption" style="margin:0 0 12px;">Admin-entered, exactly like Reviews \u2014 for a walk-in or phone inquiry.</p>' +
          '<label class="field">First Name<input type="text" data-f="add-first"></label>' +
          '<label class="field">Middle Name<input type="text" data-f="add-middle"></label>' +
          '<label class="field">Last Name<input type="text" data-f="add-last"></label>' +
          '<label class="field">Mobile Number<input type="tel" data-f="add-mobile"></label>' +
          '<label class="field">Email Address<input type="email" data-f="add-email"></label>' +
          '<label class="field">Location Address<input type="text" data-f="add-address"></label>' +
          '<p class="form-error" data-f="add-error" hidden></p>' +
          '<div class="card-actions">' +
            '<button type="button" class="btn btn--primary btn--sm" data-f="add-save">Save</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="add-cancel">Cancel</button>' +
          '</div>' +
        '</div>'
      );
    }

    function wireAddForm() {
      var fieldMap = { first: "firstName", middle: "middleName", last: "lastName", mobile: "mobileNumber", email: "email", address: "locationAddress" };
      Object.keys(fieldMap).forEach(function (key) {
        panel.querySelector('[data-f="add-' + key + '"]').addEventListener("input", function (e) {
          addDraft[fieldMap[key]] = e.target.value;
        });
      });
      panel.querySelector('[data-f="add-cancel"]').addEventListener("click", function () {
        addFormOpen = false;
        addDraft = null;
        render();
      });
      panel.querySelector('[data-f="add-save"]').addEventListener("click", function () {
        var errEl = panel.querySelector('[data-f="add-error"]');
        var first = (addDraft.firstName || "").trim();
        var last = (addDraft.lastName || "").trim();
        if (!first || !last) {
          errEl.textContent = "First Name and Last Name are required.";
          errEl.hidden = false;
          return;
        }
        var client = {
          id: makeClientId(),
          firstName: first,
          middleName: (addDraft.middleName || "").trim() || null,
          lastName: last,
          email: (addDraft.email || "").trim() || null,
          mobileNumber: (addDraft.mobileNumber || "").trim() || null,
          locationAddress: (addDraft.locationAddress || "").trim() || null,
          createdAt: new Date().toISOString(),
          remarks: "",
          projectType: "",
          bedrooms: null,
          cr: null,
          bestTimeToCall: "",
          budgetMax: null,
          archived: false
        };
        CLIENTS.list.push(client);
        persistClients();
        addFormOpen = false;
        addDraft = null;
        render();
        showToast("Client added");
      });
    }

    render();
    return panel;
  }

  function buildArchivedRow(client, onChange) {
    var tr = document.createElement("tr");

    var selectTd = document.createElement("td");
    var nameTd = document.createElement("td");
    nameTd.className = "db-archived-name";
    nameTd.textContent = fullClientName(client);
    var mobileTd = document.createElement("td");
    mobileTd.textContent = client.mobileNumber || "—";
    var emailTd = document.createElement("td");
    emailTd.textContent = client.email || "—";
    var dateTd = document.createElement("td");
    dateTd.textContent = formatDateSignedUp(client.createdAt);

    var restoreTd = document.createElement("td");
    restoreTd.setAttribute("colspan", "6");
    var restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "btn btn--secondary btn--sm";
    restoreBtn.textContent = "Restore";
    restoreBtn.addEventListener("click", function () {
      client.archived = false;
      persistClients();
      showToast("Restored");
      onChange();
    });
    restoreTd.appendChild(restoreBtn);

    tr.appendChild(selectTd);
    tr.appendChild(nameTd);
    tr.appendChild(mobileTd);
    tr.appendChild(emailTd);
    tr.appendChild(dateTd);
    tr.appendChild(restoreTd);
    return tr;
  }

  function buildClientRow(client, onSelectionChange) {
    var tr = document.createElement("tr");
    tr.className = "db-row";

    var detailTr = document.createElement("tr");
    detailTr.className = "db-detail-row";
    detailTr.hidden = true;
    var detailTd = document.createElement("td");
    detailTd.setAttribute("colspan", "11");
    detailTr.appendChild(detailTd);

    function renderDetail() {
      var hasLogin = !!client.authUserId;

      detailTd.innerHTML =
        '<div class="db-detail-grid">' +
          '<div><b>Client ID</b>' + escapeHtml(client.id) + '</div>' +
          '<div><b>First Name</b>' + escapeHtml(client.firstName || "—") + '</div>' +
          '<div><b>Middle Name</b>' + escapeHtml(client.middleName || "—") + '</div>' +
          '<div><b>Last Name</b>' + escapeHtml(client.lastName || "—") + '</div>' +
          '<div><b>Location Address</b>' + escapeHtml(client.locationAddress || "—") + '</div>' +
          '<div><b>Signed Up (exact)</b>' + escapeHtml(new Date(client.createdAt).toLocaleString()) + '</div>' +
        '</div>' +

        /* ---- Account management (D19 + email-drift fix) ----
           A client's email lives in TWO places: auth.users.email, which
           is what they log in with, and clients.email, which is what
           staff see. Editing only the second would leave them logging in
           with the old address AND send password resets there — quietly.
           The database now refuses that edit for anyone with a login, so
           identity changes go through the Edge Function, which updates
           both together and reverts if either half fails. */
        (hasLogin && can("edit")
          ? '<div class="db-account-box">' +
              '<p class="hours-caption" style="margin:0 0 8px;">This client signs in with ' +
                escapeHtml(client.email || "\u2014") + ' or ' +
                escapeHtml(client.mobileNumber || "\u2014") + '.</p>' +
              '<button type="button" class="btn btn--secondary btn--sm" data-f="send-reset">Send Password Reset</button> ' +
              '<button type="button" class="btn btn--secondary btn--sm" data-f="edit-identity">Update Login Details</button>' +
              '<div data-f="identity-form" hidden style="margin-top:10px;">' +
                '<label class="field">Login Email<input type="email" data-f="new-email" value="' + escapeAttr(client.email || "") + '"></label>' +
                '<label class="field">Login Mobile<input type="tel" data-f="new-mobile" value="' + escapeAttr(client.mobileNumber || "") + '"></label>' +
                '<button type="button" class="btn btn--primary btn--sm" data-f="save-identity">Save Login Details</button> ' +
                '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel-identity">Cancel</button>' +
              '</div>' +
            '</div>'
          : "") +
        '<div class="db-extract-box">' +
          '<label class="field" style="margin-bottom:6px;">Paste a client chat message to try deterministic BR / CR / Project Type extraction (no AI \u2014 exact patterns only)' +
            '<textarea data-f="extract-text" rows="2" placeholder="e.g. 3 BR, CR 2, Bungalow"></textarea>' +
          '</label>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="extract-btn">Extract &amp; Fill Empty Fields</button>' +
          '<p class="db-extract-result" data-f="extract-result"></p>' +
        '</div>';

      var resetBtn = detailTd.querySelector('[data-f="send-reset"]');
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          showConfirmDialog({
            title: "Send a password reset email?",
            body: "Supabase will email " + (client.email || "this client") +
                  " a link to set a new password. You will not see or set the password yourself.",
            confirmLabel: "Send Reset Email",
            onConfirm: function () {
              window.LLCAdminBackend.sendClientPasswordReset(client.id)
                .then(function () { showToast("Password reset email sent"); })
                .catch(function (err) {
                  showToast("Could not send the reset email.");
                  if (window.console) console.error(err);
                });
            }
          });
        });
      }

      var identityBtn = detailTd.querySelector('[data-f="edit-identity"]');
      if (identityBtn) {
        var identityForm = detailTd.querySelector('[data-f="identity-form"]');
        identityBtn.addEventListener("click", function () {
          identityForm.hidden = !identityForm.hidden;
        });
        detailTd.querySelector('[data-f="cancel-identity"]').addEventListener("click", function () {
          identityForm.hidden = true;
        });
        detailTd.querySelector('[data-f="save-identity"]').addEventListener("click", function () {
          var newEmail = detailTd.querySelector('[data-f="new-email"]').value.trim();
          var newMobile = detailTd.querySelector('[data-f="new-mobile"]').value.trim();
          window.LLCAdminBackend.updateClientIdentity(client.id, newEmail, newMobile)
            .then(function () {
              client.email = newEmail;
              client.mobileNumber = newMobile;
              showToast("Login details updated");
              onSelectionChange();
            })
            .catch(function (err) {
              var code = err && err.code;
              showToast(
                code === "email_already_in_use" ? "That email is already in use." :
                code === "mobile_already_in_use" ? "That mobile number is already in use." :
                "Could not update the login details."
              );
              if (window.console) console.error(err);
            });
        });
      }

      detailTd.querySelector('[data-f="extract-btn"]').addEventListener("click", function () {
        var text = detailTd.querySelector('[data-f="extract-text"]').value;
        var extraction = extractFieldsFromMessage(text);
        var outcome = applyExtraction(client, extraction);

        if (outcome.applied.length) {
          persistClients();
          // A field that may affect the active sort column just
          // changed — re-render the whole table so the row moves to
          // its correct position, exactly like a manual Save does.
          onSelectionChange();
          showToast("Changes saved");
        } else {
          var resultEl = detailTd.querySelector('[data-f="extract-result"]');
          resultEl.textContent = outcome.skipped.length
            ? "Left unchanged: " + outcome.skipped.join(", ")
            : "No recognizable BR / CR / Project Type pattern found \u2014 nothing changed.";
        }
      });
    }

    function editableCell(field, displayFn, cellOptions) {
      var td = document.createElement("td");
      cellOptions = cellOptions || {};

      function view() {
        var val = client[field];
        var text = displayFn ? displayFn(val) : (val === null || val === undefined || val === "" ? "—" : val);
        td.innerHTML =
          '<span class="db-cell-value"><span data-f="text"></span>' +
          '<button type="button" class="db-edit-icon" data-f="edit" title="Edit">\u270E</button></span>';
        td.querySelector('[data-f="text"]').textContent = text;
        td.querySelector('[data-f="edit"]').addEventListener("click", edit);
      }

      function edit() {
        var current = client[field];
        var inputHtml;
        if (cellOptions.type === "select") {
          inputHtml = '<select data-f="input">' + cellOptions.options.map(function (o) {
            return '<option value="' + o + '"' + (o === (current || "") ? " selected" : "") + '>' + (o || "\u2014") + '</option>';
          }).join("") + '</select>';
        } else {
          inputHtml = '<input type="' + (cellOptions.type || "text") + '" data-f="input" value="' + escapeAttr(current === null || current === undefined ? "" : current) + '">';
        }
        td.innerHTML =
          '<span class="db-cell-editing">' + inputHtml +
          '<span class="db-cell-actions">' +
            '<button type="button" class="db-save" data-f="save" title="Save">\u2713</button>' +
            '<button type="button" class="db-cancel" data-f="cancel" title="Cancel">\u2715</button>' +
          '</span></span>';

        td.querySelector('[data-f="save"]').addEventListener("click", function () {
          var inputEl = td.querySelector('[data-f="input"]');
          var newVal = inputEl.value;
          if (cellOptions.type === "number") newVal = newVal === "" ? null : Number(newVal);
          client[field] = newVal;
          persistClients();
          // Full re-render (not just this cell) so the row moves to its
          // correct position immediately if this field is the active
          // sort column — e.g. editing Budget Max while sorted by
          // Budget Max moves the row right away, per spec section 6.
          onSelectionChange();
          showToast("Changes saved");
        });
        td.querySelector('[data-f="cancel"]').addEventListener("click", view); // discards the in-progress edit — original value untouched
      }

      view();
      return { td: td, refresh: view };
    }

    var remarksCell = editableCell("remarks", null, { type: "text" });
    var projectCell = editableCell("projectType", function (v) { return v || "—"; }, { type: "select", options: ["", "Bungalow", "2 Storey", "3 Storey", "Others"] });
    var bedroomsCell = editableCell("bedrooms", function (v) { return v === null || v === undefined ? "—" : v; }, { type: "number" });
    var crCell = editableCell("cr", function (v) { return v === null || v === undefined ? "—" : v; }, { type: "number" });
    var timeCell = editableCell("bestTimeToCall", null, { type: "text" });
    var budgetCell = editableCell("budgetMax", function (v) { return v === null || v === undefined ? "—" : formatPeso(v); }, { type: "number" });

    var selectTd = document.createElement("td");
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedIds.has(client.id);
    checkbox.addEventListener("change", function () {
      if (checkbox.checked) selectedIds.add(client.id); else selectedIds.delete(client.id);
      onSelectionChange();
    });
    selectTd.appendChild(checkbox);

    var nameTd = document.createElement("td");
    var nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.className = "db-name-btn";
    nameBtn.textContent = fullClientName(client);
    nameBtn.addEventListener("click", function () {
      detailTr.hidden = !detailTr.hidden;
      if (!detailTr.hidden) renderDetail();
    });
    nameTd.appendChild(nameBtn);

    var mobileTd = document.createElement("td");
    if (client.mobileNumber) {
      var mobileLink = document.createElement("a");
      mobileLink.className = "db-tel-link";
      mobileLink.href = "tel:" + client.mobileNumber.replace(/\s+/g, "");
      mobileLink.textContent = client.mobileNumber;
      mobileTd.appendChild(mobileLink);
    } else {
      mobileTd.textContent = "—";
    }

    var emailTd = document.createElement("td");
    if (client.email) {
      var emailLink = document.createElement("a");
      emailLink.className = "db-mail-link";
      /* MODIFICATION 7 (Prompt 2). No documentation anywhere in this
         package establishes Gmail specifically as a business
         requirement — changed to a standard mailto: link, which opens
         whichever mail client the signed-in staff member already has
         configured, rather than assuming everyone uses Gmail's web
         interface. A bare mailto: with no subject/body query string
         needs no percent-encoding of the address itself — the
         characters valid in an email address are already valid in
         this position per RFC 6068. */
      emailLink.href = "mailto:" + client.email;
      emailLink.target = "_blank";
      emailLink.rel = "noopener";
      emailLink.textContent = client.email;
      emailTd.appendChild(emailLink);
    } else {
      emailTd.textContent = "—";
    }

    var dateTd = document.createElement("td");
    dateTd.textContent = formatDateSignedUp(client.createdAt);

    tr.appendChild(selectTd);
    tr.appendChild(nameTd);
    tr.appendChild(mobileTd);
    tr.appendChild(emailTd);
    tr.appendChild(dateTd);
    tr.appendChild(remarksCell.td);
    tr.appendChild(projectCell.td);
    tr.appendChild(bedroomsCell.td);
    tr.appendChild(crCell.td);
    tr.appendChild(timeCell.td);
    tr.appendChild(budgetCell.td);

    return { tr: tr, detailTr: detailTr };
  }


  /* ============================================================
   * MESSAGES / CLIENT CHAT MANAGEMENT (Phase 10 Part 5)
   * ============================================================
   * Mirrors the real Phase 9 chat architecture (js/chat-service.js)
   * exactly in shape: ONE conversation per client, keyed by a stable
   * clientId, with a messages[] array of {messageId, conversationId,
   * senderId, senderRole, messageText, timestamp, readStatus}. Nothing
   * here ever creates a second conversation for the same client.
   *
   * HONEST LIMITATION: the real Client app stores its conversations in
   * that page's own sessionStorage, tied to that browser tab — exactly
   * like the real Client accounts Part 3 already explained the Admin
   * can't read live. So this is the Admin's OWN conversation snapshot
   * (own localStorage key, own list), not a live feed from the actual
   * Client site. Conversations here are created by the Admin — via
   * "+ New Conversation" against an existing Database client (or a
   * guest with no Database link) — the same honest pattern already
   * used for Database records in Part 3.
   *
   * Reuses Part 3's exact deterministic (non-AI) BR/CR/Project Type
   * extraction — extractFieldsFromMessage() / applyExtraction() —
   * so a simulated "Client" message updates the linked Database
   * record using the identical fill-empty-only rule already in place.
   */

  var CONVERSATIONS_STORAGE_KEY = "llc_admin_conversations_v1";

  function loadConversations() {
    try {
      var raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && Array.isArray(saved.list)) {
          return { list: saved.list, nextGuestNum: saved.nextGuestNum || 1 };
        }
      }
    } catch (e) {
      // Corrupt or inaccessible storage — start clean rather than crash.
    }
    return { list: [], nextGuestNum: 1 };
  }

  function persistConversations() {
    /* Messages themselves are inserted through sendStaffMessage(); this
       now persists only conversation-level state (read status, archive).
       Message text is never rewritten — there is no UPDATE policy on
       messages at all, deliberately. */
    if (useSupabase()) {
      window.LLCAdminBackend.persistConversationState(CONVERSATIONS).catch(function (e) {
        showToast("Could not save to the database. Please try again.");
        if (window.console) console.error(e);
      });
      return;
    }
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(CONVERSATIONS));
    } catch (e) {
      showToast("Could not save — browser storage is full or unavailable.");
    }
  }

  var CONVERSATIONS = loadConversations();
  var COMPANY_ID_FOR_CHAT = "luigi-lindell-construction";

  function genMessageId() {
    return "msg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // Matches the real ChatService's conversationId(clientId) naming when
  // there's a real linked client; guests (no Database link) get their
  // own stable, still-unique id.
  function makeConversationId(clientId) {
    if (clientId) return "conv-" + clientId;
    var id = "conv-guest-" + CONVERSATIONS.nextGuestNum;
    CONVERSATIONS.nextGuestNum += 1;
    return id;
  }

  function findClientRecord(clientId) {
    if (!clientId) return null;
    return CLIENTS.list.filter(function (c) { return c.id === clientId; })[0] || null;
  }

  function resolveConversationName(conv) {
    var client = findClientRecord(conv.clientId);
    if (client) return fullClientName(client);
    if (conv.clientId) return "Unknown Client (Database record removed)";
    return conv.manualName || "Guest";
  }

  function getLastMessage(conv) {
    return conv.messages.length ? conv.messages[conv.messages.length - 1] : null;
  }

  function formatConversationTime(iso) {
    if (!iso) return "\u2014";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "\u2014";
    var now = new Date();
    var timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (d.toDateString() === now.toDateString()) return "Today " + timeStr;
    var yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday " + timeStr;
    return MONTH_NAMES[d.getMonth()].slice(0, 3) + " " + d.getDate() + ", " + d.getFullYear();
  }

  function findConversationByClientId(clientId) {
    return CONVERSATIONS.list.filter(function (c) { return c.clientId === clientId; })[0] || null;
  }

  function createConversation(clientId, manualName) {
    var conv = {
      conversationId: makeConversationId(clientId),
      clientId: clientId || null,
      manualName: clientId ? null : (manualName || "Guest"),
      companyId: COMPANY_ID_FOR_CHAT,
      createdAt: new Date().toISOString(),
      lastMessageAt: null,
      messages: [],
      adminReadStatus: "unread",
      archived: false,
      // GROUP CONVERSATION (Part 6B): every conversation always includes
      // the client plus BOTH staff roles who can act on it — there is
      // still only ONE conversation per client, never a separate one
      // per staff member. This field is descriptive metadata for the
      // thread header, not an access-control list (permissions are
      // still decided by can("chat") etc., centrally).
      participants: ["client", "admin", "followup-operator"]
    };
    CONVERSATIONS.list.push(conv);
    return conv;
  }

  // senderRole: "client" | "staff" (legacy conversations may still have
  // the older "admin" value on already-stored messages; rendering below
  // treats that the same as "staff" for backward compatibility).
  // extra (optional): { attachment: {mediaId, image, caption}, link: {text, url} }
  function appendMessage(conv, senderRole, messageText, extra) {
    var now = new Date().toISOString();
    var user = getCurrentUser();
    var message = {
      messageId: genMessageId(),
      conversationId: conv.conversationId,
      senderId: senderRole === "staff" ? (user ? user.id : "staff") : (conv.clientId || conv.conversationId),
      senderRole: senderRole,
      // Real author identity (Part 6B "Message Author" requirement) —
      // whoever is actually the current signed-in user when Send is
      // clicked, never a fixed/faked label.
      senderName: senderRole === "staff" && user ? user.name : null,
      senderRoleLabel: senderRole === "staff" && user ? SHORT_ROLE_LABELS[user.role] : null,
      messageText: messageText || "",
      attachment: (extra && extra.attachment) || null,
      link: (extra && extra.link) || null,
      timestamp: now,
      readStatus: "sent"
    };
    conv.messages.push(message);
    conv.lastMessageAt = now;

    // Deterministic, non-AI extraction — ONLY for client-authored
    // messages, ONLY into an existing, still-present Database record,
    // and ONLY filling fields that are currently empty (Part 3's rule,
    // reused verbatim).
    if (senderRole === "client" && conv.clientId) {
      var client = findClientRecord(conv.clientId);
      if (client) {
        var extraction = extractFieldsFromMessage(messageText);
        var outcome = applyExtraction(client, extraction);
        if (outcome.applied.length) persistClients();
      }
    }
    return message;
  }

  var msgSearchTerm = "";
  var msgShowArchived = false;
  var msgSortColumn = "lastMessageAt";
  var msgSortDirection = "desc";
  var msgSelectedIds = new Set();
  var messagesViewState = { mode: "inbox", conversationId: null };

  /* The conversation currently open in the thread view. Chat photo
     uploads are scoped to it: storage paths are
     {conversation_id}/{uploader_uid}/{uuid}.jpg, so a photo can only be
     written into the conversation it belongs to. */
  function currentConversationId() {
    return messagesViewState.conversationId;
  }

  var READ_RANK = { unread: 0, read: 1 };

  function compareConversations(column, direction, a, b) {
    var cmp = 0;
    if (column === "name") {
      cmp = resolveConversationName(a).localeCompare(resolveConversationName(b), undefined, { sensitivity: "base" });
    } else if (column === "lastMessageAt") {
      var aEmpty = !a.lastMessageAt, bEmpty = !b.lastMessageAt;
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      cmp = new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime();
    } else if (column === "readStatus") {
      cmp = READ_RANK[a.adminReadStatus] - READ_RANK[b.adminReadStatus];
    }
    return direction === "asc" ? cmp : -cmp;
  }

  function getVisibleConversations() {
    var list = CONVERSATIONS.list.filter(function (c) { return msgShowArchived ? !!c.archived : !c.archived; });

    var term = msgSearchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(function (c) {
        var client = findClientRecord(c.clientId);
        var name = resolveConversationName(c).toLowerCase();
        var mobile = (client && client.mobileNumber || "").toLowerCase();
        var email = (client && client.email || "").toLowerCase();
        var textMatch = c.messages.some(function (m) { return m.messageText.toLowerCase().indexOf(term) !== -1; });
        return name.indexOf(term) !== -1 || mobile.indexOf(term) !== -1 || email.indexOf(term) !== -1 || textMatch;
      });
    }

    list = list.slice().sort(function (a, b) {
      var primary = compareConversations(msgSortColumn, msgSortDirection, a, b);
      if (primary !== 0) return primary;
      return a.conversationId.localeCompare(b.conversationId);
    });

    return list;
  }

  function messagesSortableHeader(column, label) {
    var isActive = msgSortColumn === column;
    var arrow = isActive ? (msgSortDirection === "asc" ? "\u2191" : "\u2193") : "\u21C5";
    return (
      '<th class="db-th-sortable' + (isActive ? " db-th-sortable--active" : "") + '">' +
        '<button type="button" class="db-sort-btn" data-msg-sort-col="' + column + '">' +
          label + ' <span class="db-sort-arrow">' + arrow + '</span>' +
        '</button>' +
      '</th>'
    );
  }


  /* ============================================================
   * ADMIN USERS, ACCOUNTS & PERMISSIONS FOUNDATION (Phase 10 Part 6A)
   * ============================================================
   * PROTOTYPE SECURITY NOTICE — read before relying on this for
   * anything real: usernames and passwords below are stored in plain
   * text in this browser's localStorage and checked entirely in the
   * browser. There is no server, no hashing, no real session token,
   * and no protection against someone reading this file's storage
   * directly. This is NOT production authentication. Before any real
   * deployment this needs server-side auth, hashed/salted passwords,
   * and backend-enforced authorization — the permission MODEL below
   * (the shape of what each role can/can't do) is designed to carry
   * over to that future backend without a redesign; only how it's
   * checked needs to change.
   *
   * WHY THERE IS STILL NO LOGIN GATE: Phase 10 Part 1 intentionally
   * removed the Admin login screen per an explicit later instruction.
   * This part does not reintroduce one. Instead, the current "logged
   * in" user is a simple switchable identity (see the picker in the
   * top bar) — appropriate for a single-device prototype where the
   * real boundary that matters right now is "does this role's UI
   * show/allow this," not "prove who you are." A production version
   * would gate the user switch itself behind real authentication.
   *
   * ONE CENTRAL PERMISSION MODEL: every section asks the same
   * question the same way — can("edit"), can("chat"), etc. — via the
   * can() function below. Nothing else in the app hardcodes "if role
   * is X". This is also why every major panel-building function
   * (buildAboutPanel, buildDatabasePanel, buildGalleryAdminPanel,
   * buildMessagesPanel, buildUsersPanel) re-checks permission for
   * itself at the top, regardless of whether the sidebar nav already
   * hid the button — so even a direct console call like
   * `buildUsersPanel()` from devtools still gets refused.
   */

  var USERS_STORAGE_KEY = "llc_admin_users_v1";
  var CURRENT_USER_KEY = "llc_admin_current_user_id";

  var ROLE_LABELS = {
    "admin": "Admin — Full Authority",
    "uploader": "Uploader",
    "followup-operator": "Follow-up Operator",
    "design-operator": "Conceptual Design Operator"
  };

  // Compact role label for message attribution ("Luigi Lindell — Admin"),
  // as opposed to ROLE_LABELS' longer form used in the Users list.
  var SHORT_ROLE_LABELS = {
    "admin": "Admin",
    "uploader": "Uploader",
    "followup-operator": "Follow-up Operator",
    "design-operator": "Conceptual Design Operator"
  };

  // The complete, centralized permission matrix. Admin has everything;
  // every other role starts with ONLY what's explicitly listed here —
  // nothing is granted by omission.
  var ROLE_PERMISSIONS = {
    "admin": {
      view: true, create: true, edit: true, delete: true, upload: true, chat: true,
      organize: true, "send-media": true,
      "view-client-contact": true, "view-client-financial": true, "view-client-design": true,
      "manage-users": true
    },
    "uploader": {
      view: false, create: true, edit: false, delete: false, upload: true, chat: false,
      organize: true, "send-media": false,
      "view-client-contact": false, "view-client-financial": false, "view-client-design": false,
      "manage-users": false
    },
    "followup-operator": {
      view: true, create: false, edit: false, delete: false, upload: false, chat: true,
      organize: false, "send-media": true,
      "view-client-contact": true, "view-client-financial": false, "view-client-design": false,
      "manage-users": false
    },
    "design-operator": {
      view: true, create: false, edit: false, delete: false, upload: false, chat: false,
      organize: false, "send-media": false,
      "view-client-contact": false, "view-client-financial": false, "view-client-design": true,
      "manage-users": false
    }
  };

  // THE single permission check used everywhere in the app. A missing
  // or falsy action is treated as "no restriction for this button"
  // (used for sections open to any signed-in user); every real
  // restriction is an explicit named permission checked here.
  function can(action) {
    if (!action) return true;
    var user = getCurrentUser();
    if (!user || !user.enabled) return false;
    var perms = ROLE_PERMISSIONS[user.role];
    return !!(perms && perms[action] === true);
  }

  function genUserId() {
    return "user_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function defaultUsers() {
    var now = new Date().toISOString();
    return [
      { id: "user_admin_seed", name: "Luigi Lindell", username: "luigi", password: "admin123", role: "admin", enabled: true, createdAt: now },
      { id: "user_uploader_seed", name: "Uploader", username: "uploader", password: "upload123", role: "uploader", enabled: true, createdAt: now },
      { id: "user_followup_seed", name: "Follow-up Operator", username: "followup", password: "followup123", role: "followup-operator", enabled: true, createdAt: now },
      { id: "user_design_seed", name: "Conceptual Design Operator", username: "design", password: "design123", role: "design-operator", enabled: true, createdAt: now }
    ];
  }

  function loadUsers() {
    try {
      var raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && Array.isArray(saved.list) && saved.list.length) return saved;
      }
    } catch (e) {
      // Corrupt or inaccessible storage — fall back to the 4 seed accounts.
    }
    return { list: defaultUsers() };
  }

  function persistUsers() {
    /* staff_profiles has NO password column and never will — Supabase
       Auth owns credentials. The prototype stored plaintext passwords in
       localStorage; that field is not carried over. Creating a login is
       a separate step in the Supabase dashboard. */
    if (useSupabase()) {
      window.LLCAdminBackend.persistUsers(USERS).catch(function (e) {
        showToast("Could not save users to the database. Please try again.");
        if (window.console) console.error(e);
      });
      return;
    }
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(USERS));
    } catch (e) {
      showToast("Could not save users — browser storage is full or unavailable.");
    }
  }

  var USERS = loadUsers();

  function countEnabledAdmins() {
    return USERS.list.filter(function (u) { return u.role === "admin" && u.enabled; }).length;
  }

  /* ============================================================
   * AUTH SERVICE — Database-Ready Architecture
   * ============================================================
   *
   *   Login UI  --->  AuthService  --->  API Adapter  --->  Backend  --->  Database
   *
   * AuthService is the ONLY thing the rest of this app talks to for
   * identity. It contains NO fetch calls and NO credential checks
   * itself — it only calls into `apiAdapter` below. That is the
   * clean separation point: swap `apiAdapter` for a real
   * implementation and nothing else in this file needs to change.
   *
   *   AuthService.login(username, password) -> Promise<user>
   *   AuthService.logout()                   -> Promise<void>
   *   AuthService.getCurrentUser()           -> user | null   (sync, cached)
   *   AuthService.isAuthenticated()          -> boolean
   *   AuthService.checkSession()             -> Promise<user | null>
   *
   * SECURITY — READ BEFORE CONNECTING A REAL BACKEND:
   *   - Authentication MUST be performed server-side. This frontend
   *     never decides whether a password is correct in production.
   *   - Passwords MUST be verified server-side and MUST NEVER be
   *     returned to the frontend in any response, ever.
   *   - Passwords MUST NEVER be stored in localStorage, sessionStorage,
   *     or anywhere else in the browser.
   *   - Authorization (what a role is allowed to do) MUST ALSO be
   *     enforced server-side. The can()/ROLE_PERMISSIONS checks
   *     elsewhere in this file are for UI behavior only — hiding a
   *     button here does not stop a malicious direct API call; only a
   *     real backend authorization check can do that.
   *   - Prefer a secure, httpOnly session cookie for the real backend
   *     (credentials: "include" on every request) over a token the
   *     frontend can read — that is why the mock below stores only an
   *     opaque token, standing in for what that cookie would do, and
   *     never a password.
   */

  /**
   * ---- REAL API ADAPTER (integration point — NOT implemented) ----
   * This is what a real adapter looks like once a backend exists.
   * Left commented out on purpose: calling a URL that doesn't exist
   * would be worse than being explicit that it isn't built yet.
   *
   * var realApiAdapter = {
   *   login: function (username, password) {
   *     return fetch("/api/auth/login", {
   *       method: "POST",
   *       headers: { "Content-Type": "application/json" },
   *       credentials: "include", // send/receive the httpOnly session cookie
   *       body: JSON.stringify({ username: username, password: password })
   *     }).then(function (res) {
   *       if (!res.ok) throw new Error("Invalid username or password");
   *       return res.json(); // expected shape: { user: { id, name, username, role } }
   *     }).then(function (data) { return data.user; });
   *   },
   *   logout: function () {
   *     return fetch("/api/auth/logout", { method: "POST", credentials: "include" })
   *       .then(function () { return null; });
   *   },
   *   checkSession: function () {
   *     return fetch("/api/auth/me", { credentials: "include" }).then(function (res) {
   *       if (!res.ok) return null;
   *       return res.json().then(function (data) { return data.user; });
   *     });
   *   }
   * };
   */

  /**
   * ---- DEVELOPMENT MOCK ADAPTER — PROTOTYPE ONLY ----
   * Exists only so this standalone HTML can demonstrate the login
   * flow and role-based UI with no backend available. This is NOT
   * production authentication and must be replaced (see
   * `apiAdapter` assignment below) before any real deployment.
   *
   * - The credential list here is demo-only scaffolding, not a
   *   security boundary — anyone can read this file's source.
   * - No password is ever written to localStorage or sessionStorage.
   *   Only an opaque, meaningless mock session token is kept, purely
   *   to let a page refresh stay "logged in" during a demo — exactly
   *   the role a real httpOnly cookie would play, just simulated.
   */
  /* =====================================================================
     MODIFICATION 2 (Prompt 2/2) — explicit, code-level guarantee.
     =====================================================================
     These are LOCAL-DEVELOPMENT-ONLY credentials, used exclusively by
     mockApiAdapter below, which is itself only ever selected when
     useSupabase() is false (see the apiAdapter assignment further down
     this file). They are not read, referenced, or reachable from any
     other code path.

     They remain deliberately present, not deleted: Section 1's own
     requirement is "Supabase not configured -> intentional local
     development fallback only" — a working local login IS that
     fallback, and there is no way to offer one without some credential
     for it to check against. Removing this array would remove the
     pre-Supabase mode the rest of this file is built to preserve.

     What actually protects production is not secrecy of these four
     strings (they are already published in README.txt, and this file
     itself is headed to a public repository) — it is that the
     ARCHITECTURE makes them structurally unreachable the moment
     Supabase is configured. That is enforced below by useSupabase(),
     and reconfirmed defensively inside mockApiAdapter.login() itself:
     even if something upstream ever selected this adapter by mistake
     while Supabase was configured, the login call refuses outright
     rather than silently falling back to checking these values. */
  var MOCK_BACKEND_USERS = [
    { id: "u_admin", name: "Luigi Lindell", username: "luigi", password: "admin123", role: "admin" },
    { id: "u_uploader", name: "Uploader", username: "uploader", password: "upload123", role: "uploader" },
    { id: "u_followup", name: "Follow-up Operator", username: "followup", password: "followup123", role: "followup-operator" },
    { id: "u_design", name: "Conceptual Design Operator", username: "design", password: "design123", role: "design-operator" }
  ];
  var MOCK_SESSION_TOKEN_KEY = "llc_admin_mock_session"; // opaque token + non-secret profile only — never a password

  var mockApiAdapter = {
    login: function (username, password) {
      /* Defensive guard, independent of the apiAdapter selection
         above. If this function is ever reached while Supabase IS
         configured — a future refactor accidentally calling it
         directly, for instance — it refuses outright rather than
         silently checking a plaintext password against a real
         production login attempt. */
      if (useSupabase()) {
        return Promise.reject(new Error(
          "Local development login is disabled while Supabase is configured."));
      }
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var match = MOCK_BACKEND_USERS.filter(function (u) {
            return u.username === username && u.password === password;
          })[0];
          if (!match) { reject(new Error("Invalid username or password")); return; }
          var token = "mock_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
          var user = { id: match.id, name: match.name, username: match.username, role: match.role, enabled: true };
          // A real backend would keep this association server-side and
          // only ever hand the browser an opaque token (or better, an
          // httpOnly cookie the browser can't even read). Since this
          // mock has no server, the non-secret user profile is stored
          // alongside the token so a page refresh can still recover it —
          // note that NO password is part of this blob.
          try { sessionStorage.setItem(MOCK_SESSION_TOKEN_KEY, JSON.stringify({ token: token, user: user })); } catch (e) { /* ignore */ }
          resolve(user);
        }, 350); // simulated network delay
      });
    },
    logout: function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          try { sessionStorage.removeItem(MOCK_SESSION_TOKEN_KEY); } catch (e) { /* ignore */ }
          resolve(null);
        }, 150);
      });
    },
    checkSession: function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var stored = null;
          try { stored = JSON.parse(sessionStorage.getItem(MOCK_SESSION_TOKEN_KEY)); } catch (e) { /* ignore */ }
          resolve(stored && stored.token && stored.user ? stored.user : null);
        }, 80);
      });
    }
  };

  /* MODIFICATION 1 — the swap point, actually connected.
     Was: var apiAdapter = mockApiAdapter;  (unconditional — the mock
     credentials remained the only working login even once Supabase
     was fully configured, since nothing here ever checked).

     "Configured" means the two values in js/supabase-client.js have
     been filled in — checked via the SAME LLCSupabase.isConfigured()
     every other part of this system already uses, not merely whether
     window.LLCAdminBackend exists as an object (it always does, since
     admin-supabase.js always loads regardless of configuration state —
     that distinction is exactly what Modification 3 below depends on
     too). */
  function useSupabase() {
    return !!(window.LLCSupabase && window.LLCSupabase.isConfigured() &&
              window.LLCAdminBackend);
  }

  var apiAdapter = useSupabase() ? window.LLCAdminBackend.apiAdapter : mockApiAdapter;

  var AuthService = (function () {
    var cachedUser = null;
    return {
      login: function (username, password) {
        return apiAdapter.login(username, password).then(function (user) {
          cachedUser = user;
          return user;
        });
      },
      logout: function () {
        return apiAdapter.logout().then(function () { cachedUser = null; });
      },
      checkSession: function () {
        return apiAdapter.checkSession().then(function (user) {
          cachedUser = user;
          return user;
        });
      },
      getCurrentUser: function () { return cachedUser; },
      isAuthenticated: function () { return !!cachedUser; }
    };
  })();

  // Thin wrapper so every existing can()/permission call site in this
  // file (unchanged from the presentation version) keeps working
  // exactly as before — identity now comes from AuthService instead
  // of a local role switcher.
  function getCurrentUser() {
    return AuthService.getCurrentUser();
  }

  // Which permission a nav section requires to even be shown. A value
  // can be a single permission string, or an array meaning "any of
  // these" (used where more than one role legitimately gets some
  // version of that section, like the 5 galleries below).
  var NAV_PERMISSION = {
    "about": "edit",
    "database": "view",
    "reviews": "edit",
    "testimonial-videos": "edit",
    "completed-project-photos": ["edit", "upload"],
    "completed-project-videos": ["edit", "upload"],
    "ground-breaking": ["edit", "upload"],
    "exterior-design": ["edit", "upload"],
    "interior-design": ["edit", "upload"],
    "messages": "chat",
    "users": "manage-users"
  };

  function navAllowed(permSpec) {
    if (!permSpec) return true;
    if (Array.isArray(permSpec)) return permSpec.some(function (p) { return can(p); });
    return can(permSpec);
  }

  function getVisibleNavItems() {
    return ADMIN_NAV.filter(function (item) { return navAllowed(NAV_PERMISSION[item.id]); });
  }

  // Keeps activeSection valid for whoever is currently signed in —
  // e.g. switching from Admin to Uploader must not leave activeSection
  // pointed at "about", which Uploader can't see.
  function ensureActiveSectionVisible() {
    var visible = getVisibleNavItems();
    var stillVisible = visible.some(function (item) { return item.id === activeSection; });
    if (!stillVisible) {
      activeSection = visible.length ? visible[0].id : null;
    }
  }

  function buildAccessDeniedPanel(message) {
    var panel = el("section", "panel");
    panel.innerHTML =
      '<h2 class="panel__title">Access Restricted</h2>' +
      '<p class="panel__body-text">' + (message || "Your current role does not have permission to view this section.") + "</p>";
    return panel;
  }

  function buildRoleLandingPanel() {
    var user = getCurrentUser();
    var panel = el("section", "panel");
    panel.innerHTML =
      '<span class="coming-soon__badge">Phase 10 — Part 6A</span>' +
      '<h2 class="panel__title" style="margin-top:10px;">Welcome, ' + (user ? user.name : "") + "</h2>" +
      '<p class="panel__body-text">Your role (' + (user ? ROLE_LABELS[user.role] : "") + ") doesn\u2019t have a dedicated " +
      "workspace here yet \u2014 the restricted Uploader workflow arrives in Phase 10 Part 6B. This part only sets up your " +
      "account, role, and permission boundaries; screens for your specific day-to-day tasks are built next.</p>";
    return panel;
  }

  var restrictedMatrixState = {}; // per-role: { searchTerm, sortColumn, sortDirection }
  function getRestrictedMatrixState(role) {
    if (!restrictedMatrixState[role]) {
      restrictedMatrixState[role] = { searchTerm: "", sortColumn: "name", sortDirection: "asc" };
    }
    return restrictedMatrixState[role];
  }

  // Read-only Client Matrix for roles that can view Database but can't
  // use the full Admin Database (Part 3). The permitted column set is
  // decided HERE, in code, before anything is rendered — never by
  // hiding columns with CSS after the fact. Search and sort only ever
  // operate on the values already in this permitted column set, so a
  // restricted field can never leak through either one.
  function buildRestrictedClientMatrix(role) {
    // Defense in depth — matches the pattern used by every other major
    // panel-builder in this app.
    if (!can("view-client-contact") && !can("view-client-design")) return buildAccessDeniedPanel();

    var columns = {
      name: { label: "Name", get: function (c) { return fullClientName(c); } },
      mobile: { label: "Mobile Number", get: function (c) { return c.mobileNumber || "\u2014"; } },
      email: { label: "Email Address", get: function (c) { return c.email || "\u2014"; } },
      dateSignedUp: { label: "Date Signed Up", get: function (c) { return formatDateSignedUp(c.createdAt); } },
      projectType: { label: "Project Type", get: function (c) { return c.projectType || "\u2014"; } },
      bedrooms: { label: "Bedrooms", get: function (c) { return c.bedrooms === null || c.bedrooms === undefined ? "\u2014" : c.bedrooms; } },
      cr: { label: "CR", get: function (c) { return c.cr === null || c.cr === undefined ? "\u2014" : c.cr; } },
      bestTimeToCall: { label: "Best Time to Call", get: function (c) { return c.bestTimeToCall || "\u2014"; } },
      location: { label: "Location / Address", get: function (c) { return c.locationAddress || "\u2014"; } },
      remarks: { label: "Design Requirements / Remarks", get: function (c) { return c.remarks || "\u2014"; } }
    };

    // Exactly what each role is allowed to see — nothing more. Search
    // and sort below can only ever touch these fields.
    var colKeys = role === "followup-operator"
      ? ["name", "mobile", "email", "dateSignedUp", "projectType", "bedrooms", "cr", "bestTimeToCall", "location", "remarks"]
      : ["name", "location", "projectType", "bedrooms", "cr", "bestTimeToCall", "remarks"]; // design-operator: no mobile, no email, no budget

    var matrixTitle = role === "design-operator" ? "Design Client Matrix" : "Client Matrix";
    var state = getRestrictedMatrixState(role);
    var panel = el("section", "panel edit-card");

    function render() {
      var term = state.searchTerm.trim().toLowerCase();
      var list = CLIENTS.list.filter(function (c) { return !c.archived; });
      if (term) {
        list = list.filter(function (c) {
          return colKeys.some(function (k) { return String(columns[k].get(c)).toLowerCase().indexOf(term) !== -1; });
        });
      }
      list = list.slice().sort(function (a, b) {
        var av = columns[state.sortColumn].get(a);
        var bv = columns[state.sortColumn].get(b);
        var aEmpty = av === "\u2014" || av === "" || av === null || av === undefined;
        var bEmpty = bv === "\u2014" || bv === "" || bv === null || bv === undefined;
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
        var cmp;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base", numeric: true });
        return state.sortDirection === "asc" ? cmp : -cmp;
      });

      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">' + matrixTitle + ' <span class="hidden-tag" style="background:var(--steel-dark);">View Only</span> ' +
          '<span class="db-count">(' + list.length + ')</span></h2></div>' +
        '<p class="hours-caption">You have view access appropriate to your role (' + ROLE_LABELS[role] + "). These are client " +
        "design records \u2014 you can view them, but editing, deleting, archiving, and adding clients all require Admin access.</p>" +
        '<div class="db-toolbar"><div class="db-toolbar__search"><input type="text" data-f="search" placeholder="Search ' +
        (role === "design-operator" ? "name, location, or project type" : "name, mobile, or email") + '" value="' + escapeAttr(state.searchTerm) + '"></div></div>' +
        '<div class="table-scroll"><table class="db-table"><thead><tr data-f="headrow"></tr></thead><tbody data-f="tbody"></tbody></table></div>';

      var headRow = panel.querySelector('[data-f="headrow"]');
      colKeys.forEach(function (k) {
        var isActive = state.sortColumn === k;
        var arrow = isActive ? (state.sortDirection === "asc" ? "\u2191" : "\u2193") : "\u21C5";
        var th = document.createElement("th");
        th.className = "db-th-sortable" + (isActive ? " db-th-sortable--active" : "");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "db-sort-btn";
        btn.innerHTML = columns[k].label + ' <span class="db-sort-arrow">' + arrow + "</span>";
        btn.addEventListener("click", function () {
          if (state.sortColumn === k) state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
          else { state.sortColumn = k; state.sortDirection = "asc"; }
          render();
        });
        th.appendChild(btn);
        headRow.appendChild(th);
      });

      var tbody = panel.querySelector('[data-f="tbody"]');
      if (!list.length) {
        var etr = document.createElement("tr");
        var etd = document.createElement("td");
        etd.colSpan = colKeys.length;
        etd.className = "db-empty-state";
        etd.textContent = CLIENTS.list.length ? "No clients match your search." : "No client records yet.";
        etr.appendChild(etd);
        tbody.appendChild(etr);
      } else {
        list.forEach(function (c) {
          var tr = document.createElement("tr");
          tr.className = "db-row";
          colKeys.forEach(function (k) {
            var td = document.createElement("td");
            td.textContent = String(columns[k].get(c));
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
      }

      var searchInput = panel.querySelector('[data-f="search"]');
      searchInput.addEventListener("input", function (e) {
        state.searchTerm = e.target.value;
        var pos = e.target.selectionStart;
        render();
        var again = panel.querySelector('[data-f="search"]');
        again.focus();
        again.setSelectionRange(pos, pos);
      });
    }

    render();
    return panel;
  }

  /* ---------------- Users management (Admin only) ---------------- */
  function buildUsersPanel() {
    if (!can("manage-users")) return buildAccessDeniedPanel("Only Admin can manage users.");

    var panel = el("section", "panel edit-card");
    var addFormOpen = false;

    function render() {
      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Admin Users <span class="db-count">(' + USERS.list.length + ')</span></h2>' +
          '<button type="button" class="btn btn--primary btn--sm" data-f="add-user">' + (addFormOpen ? "Close" : "+ Add User") + "</button>" +
        "</div>" +
        '<p class="hours-caption">Four roles are supported: Admin (full authority), Uploader, Follow-up Operator, and ' +
        "Conceptual Design Operator. IMPORTANT (database-ready build): this list is a local prototype directory only " +
        "\u2014 it does NOT control who can log in. Real sign-in now goes through AuthService (see the code comments near " +
        "the top of the script), which in production would call a real backend Users/Auth API. Passwords are never " +
        "displayed once set.</p>";

      if (addFormOpen) panel.appendChild(buildAddUserForm());

      var list = el("div", "album-grid");
      USERS.list.forEach(function (u) { list.appendChild(buildUserCard(u)); });
      panel.appendChild(list);

      panel.querySelector('[data-f="add-user"]').addEventListener("click", function () {
        addFormOpen = !addFormOpen;
        render();
      });
    }

    function roleOptionsHtml(selected) {
      return ["admin", "uploader", "followup-operator", "design-operator"].map(function (r) {
        return '<option value="' + r + '"' + (r === selected ? " selected" : "") + ">" + ROLE_LABELS[r] + "</option>";
      }).join("");
    }

    function buildAddUserForm() {
      var form = el("div", "gm-inline-form");
      form.innerHTML =
        '<label class="field">Full Name<input type="text" data-f="name"></label>' +
        '<label class="field">Username<input type="text" data-f="username"></label>' +
        '<label class="field">Password<input type="text" data-f="password" placeholder="Set an initial password"></label>' +
        '<label class="field">Role<select data-f="role">' + roleOptionsHtml("uploader") + "</select></label>" +
        '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Add User</button>' +
        '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>';

      form.querySelector('[data-f="cancel"]').addEventListener("click", function () { addFormOpen = false; render(); });
      form.querySelector('[data-f="save"]').addEventListener("click", function () {
        if (!can("manage-users")) return;
        var name = form.querySelector('[data-f="name"]').value.trim();
        var username = form.querySelector('[data-f="username"]').value.trim();
        var password = form.querySelector('[data-f="password"]').value;
        var role = form.querySelector('[data-f="role"]').value;
        if (!name || !username || !password) { showToast("Name, username, and password are all required."); return; }
        var taken = USERS.list.some(function (u) { return u.username.toLowerCase() === username.toLowerCase(); });
        if (taken) { showToast("That username is already taken."); return; }
        USERS.list.push({ id: genUserId(), name: name, username: username, password: password, role: role, enabled: true, createdAt: new Date().toISOString() });
        persistUsers();
        renderAuthArea();
        addFormOpen = false;
        render();
        showToast("User added");
      });
      return form;
    }

    function buildUserCard(u) {
      var card = el("div", "album-card");

      function renderView() {
        var onlyEnabledAdmin = u.role === "admin" && u.enabled && countEnabledAdmins() <= 1;
        card.innerHTML =
          '<div class="album-card__body">' +
            '<span class="album-card__name">' + u.name +
              (u.role === "admin" ? ' <span class="hidden-tag" style="background:var(--steel-dark);">FULL AUTHORITY</span>' : "") +
              (!u.enabled ? ' <span class="hidden-tag">Disabled</span>' : "") +
            "</span>" +
            '<span class="album-card__meta">Username: ' + u.username + "</span>" +
            '<span class="album-card__meta">Role: ' + ROLE_LABELS[u.role] + "</span>" +
          "</div>" +
          '<div class="gm-card-actions">' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="edit">Edit</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="password">Set Password</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle"' + (onlyEnabledAdmin ? ' disabled title="The only enabled Admin can\u2019t be disabled"' : "") + ">" + (u.enabled ? "Disable" : "Enable") + "</button>" +
            (u.role !== "admin" ? '<button type="button" class="btn btn--danger btn--sm" data-f="delete">Delete</button>' : "") +
          "</div>";

        card.querySelector('[data-f="edit"]').addEventListener("click", renderEditForm);
        card.querySelector('[data-f="password"]').addEventListener("click", renderPasswordForm);
        card.querySelector('[data-f="toggle"]').addEventListener("click", function () {
          if (!can("manage-users")) return;
          if (u.role === "admin" && u.enabled && countEnabledAdmins() <= 1) {
            showToast("At least one enabled Admin account is required.");
            return;
          }
          u.enabled = !u.enabled;
          persistUsers();
          renderAuthArea();
          render();
          showToast(u.enabled ? "User enabled" : "User disabled");
        });
        var deleteBtn = card.querySelector('[data-f="delete"]');
        if (deleteBtn) {
          deleteBtn.addEventListener("click", function () {
            if (!can("manage-users")) return;
            if (u.role === "admin") { showToast("Admin accounts can\u2019t be deleted here."); return; }
            showConfirmDialog({
              title: "Delete this user permanently?",
              body: "This removes " + u.name + "\u2019s account and login access. This cannot be undone.",
              confirmLabel: "Delete Permanently",
              onConfirm: function () {
                USERS.list = USERS.list.filter(function (x) { return x.id !== u.id; });
                persistUsers();
                renderAuthArea();
                render();
                showToast("User deleted");
              }
            });
          });
        }
      }

      function renderEditForm() {
        card.innerHTML =
          '<div class="rename-row" style="flex-direction:column; align-items:stretch;">' +
            '<label class="field">Full Name<input type="text" data-f="name"></label>' +
            '<label class="field">Username<input type="text" data-f="username"></label>' +
            '<label class="field">Role<select data-f="role">' + roleOptionsHtml(u.role) + "</select></label>" +
            '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Save</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>' +
          "</div>";
        card.querySelector('[data-f="name"]').value = u.name;
        card.querySelector('[data-f="username"]').value = u.username;
        card.querySelector('[data-f="cancel"]').addEventListener("click", renderView);
        card.querySelector('[data-f="save"]').addEventListener("click", function () {
          if (!can("manage-users")) return;
          var newName = card.querySelector('[data-f="name"]').value.trim();
          var newUsername = card.querySelector('[data-f="username"]').value.trim();
          var newRole = card.querySelector('[data-f="role"]').value;
          if (!newName || !newUsername) { showToast("Name and username are required."); return; }
          if (u.role === "admin" && newRole !== "admin" && u.enabled && countEnabledAdmins() <= 1) {
            showToast("At least one enabled Admin account is required \u2014 promote another user to Admin first.");
            return;
          }
          var dup = USERS.list.some(function (x) { return x.id !== u.id && x.username.toLowerCase() === newUsername.toLowerCase(); });
          if (dup) { showToast("That username is already taken."); return; }
          u.name = newName;
          u.username = newUsername;
          u.role = newRole;
          persistUsers();
          renderAuthArea();
          showToast("Changes saved");
          renderView();
        });
      }

      function renderPasswordForm() {
        card.innerHTML =
          '<div class="rename-row" style="flex-direction:column; align-items:stretch;">' +
            '<label class="field">New Password<input type="text" data-f="password" placeholder="Enter a new password"></label>' +
            '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="save">Set Password</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>' +
          "</div>";
        card.querySelector('[data-f="cancel"]').addEventListener("click", renderView);
        card.querySelector('[data-f="save"]').addEventListener("click", function () {
          if (!can("manage-users")) return;
          var pw = card.querySelector('[data-f="password"]').value;
          if (!pw) { showToast("Enter a password first."); return; }
          u.password = pw;
          persistUsers();
          showToast("Password updated");
          renderView();
        });
      }

      renderView();
      return card;
    }

    render();
    return panel;
  }


  function buildMessagesPanel() {
    // Defense in depth: Messages requires chat permission (Admin and
    // Follow-up Operator only in Part 6A's role set).
    if (!can("chat")) return buildAccessDeniedPanel();
    var wrap = document.createElement("div");
    wrap.appendChild(buildMessagesIntro());
    wrap.appendChild(buildMessagesCard());
    return wrap;
  }

  function buildMessagesIntro() {
    var panel = el("section", "panel");
    panel.innerHTML =
      '<span class="coming-soon__badge">Phase 10 — Part 5</span>' +
      '<h2 class="panel__title" style="margin-top:10px;">Messages</h2>' +
      '<div class="panel__body"><p>Your complete inbox of client conversations. Because the Client site stores its ' +
      'chats in that page\u2019s own browser storage (the same separation already explained for Database records), ' +
      'this Admin keeps its own conversation snapshot rather than pretending to receive live messages from a ' +
      'separate file. Use \u201c+ New Conversation\u201d to link a conversation to an existing Database client (or a ' +
      'guest) and try the full inbox \u2014 search, sort, read/unread, archive, and delete all work fully.</p></div>';
    return panel;
  }

  function buildMessagesCard() {
    var panel = el("section", "panel edit-card");
    var addFormOpen = false;

    function render() {
      if (messagesViewState.mode === "thread") {
        panel.innerHTML = "";
        panel.appendChild(buildConversationThread(messagesViewState.conversationId, render));
        return;
      }

      var visible = getVisibleConversations();
      var allSelected = visible.length > 0 && visible.every(function (c) { return msgSelectedIds.has(c.conversationId); });

      panel.innerHTML =
        '<div class="card-head"><h2 class="panel__title">Inbox <span class="db-count">(' + visible.length + (msgShowArchived ? " archived" : "") + ')</span></h2></div>' +
        '<div class="db-toolbar">' +
          '<div class="db-toolbar__search"><input type="text" data-f="search" placeholder="Search name, mobile, email, or message text" value="' + escapeAttr(msgSearchTerm) + '"></div>' +
          '<div class="db-toolbar__right">' +
            '<label class="inline-check"><input type="checkbox" data-f="show-archived"' + (msgShowArchived ? " checked" : "") + '> Show archived</label>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="mark-read"' + (msgSelectedIds.size === 0 ? " disabled" : "") + '>Mark Read</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="mark-unread"' + (msgSelectedIds.size === 0 ? " disabled" : "") + '>Mark Unread</button>' +
            (can("delete") ? '<button type="button" class="btn btn--secondary btn--sm" data-f="archive-selected"' + (msgSelectedIds.size === 0 ? " disabled" : "") + '>' + (msgShowArchived ? "Restore Selected" : "Archive Selected") + '</button>' : "") +
            (can("delete") ? '<button type="button" class="btn btn--danger btn--sm" data-f="delete-selected"' + (msgSelectedIds.size === 0 ? " disabled" : "") + '>Delete Selected</button>' : "") +
            '<button type="button" class="btn btn--primary btn--sm" data-f="new-conv">' + (addFormOpen ? "Close" : "+ New Conversation") + '</button>' +
          '</div>' +
        '</div>' +
        (addFormOpen ? buildNewConversationFormHtml() : "") +
        '<div class="table-scroll">' +
          '<table class="db-table">' +
            '<thead><tr>' +
              '<th><input type="checkbox" data-f="select-all"' + (allSelected ? " checked" : "") + '></th>' +
              messagesSortableHeader("name", "Client Name") +
              '<th>Last Message</th>' +
              messagesSortableHeader("lastMessageAt", "Date / Time") +
              messagesSortableHeader("readStatus", "Status") +
              '<th>Mobile</th><th>Email</th><th># Msgs</th>' +
            '</tr></thead>' +
            '<tbody data-f="tbody"></tbody>' +
          '</table>' +
        '</div>';

      if (addFormOpen) wireNewConversationForm();

      var tbody = panel.querySelector('[data-f="tbody"]');
      if (!visible.length) {
        var emptyTr = document.createElement("tr");
        var emptyTd = document.createElement("td");
        emptyTd.setAttribute("colspan", "8");
        emptyTd.className = "db-empty-state";
        emptyTd.textContent = msgShowArchived
          ? "No archived conversations."
          : (CONVERSATIONS.list.length ? "No conversations match your search." : "No conversations yet. Use \u201c+ New Conversation\u201d to start one.");
        emptyTr.appendChild(emptyTd);
        tbody.appendChild(emptyTr);
      } else {
        visible.forEach(function (conv) { tbody.appendChild(buildInboxRow(conv, render, openConversation)); });
      }

      wireToolbar();
    }

    function buildNewConversationFormHtml() {
      var options = CLIENTS.list.map(function (c) {
        /* XSS FIX. Was: '<option value="' + c.id + '">' + fullClientName(c) + '</option>'
           Once clients register themselves, a crafted name would run
           inside the Admin's browser, with the Admin's session. */
        return '<option value="' + escapeAttr(c.id) + '">' +
               escapeHtml(fullClientName(c)) + '</option>';
      }).join("");
      return (
        '<div class="gm-inline-form">' +
          '<label class="field">Link to Database Client (optional)' +
            '<select data-f="client-select"><option value="">\u2014 No Database link (guest) \u2014</option>' + options + '</select>' +
          '</label>' +
          '<label class="field" data-f="guest-name-field">Guest Name<input type="text" data-f="guest-name" placeholder="Used only if no Database client is linked"></label>' +
          '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="create">Create</button>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-f="cancel-new">Cancel</button></div>' +
        '</div>'
      );
    }

    function wireNewConversationForm() {
      panel.querySelector('[data-f="cancel-new"]').addEventListener("click", function () {
        addFormOpen = false;
        render();
      });
      panel.querySelector('[data-f="create"]').addEventListener("click", function () {
        var clientId = panel.querySelector('[data-f="client-select"]').value || null;
        var guestName = panel.querySelector('[data-f="guest-name"]').value.trim();

        if (clientId && findConversationByClientId(clientId)) {
          showToast("This client already has a conversation \u2014 opening it instead.");
          addFormOpen = false;
          openConversation(findConversationByClientId(clientId).conversationId);
          return;
        }

        var conv = createConversation(clientId, guestName);
        persistConversations();
        addFormOpen = false;
        showToast("Conversation created");
        openConversation(conv.conversationId);
      });
    }

    function wireToolbar() {
      var searchInput = panel.querySelector('[data-f="search"]');
      searchInput.addEventListener("input", function (e) {
        msgSearchTerm = e.target.value;
        var pos = e.target.selectionStart;
        render();
        var again = panel.querySelector('[data-f="search"]');
        again.focus();
        again.setSelectionRange(pos, pos);
      });

      Array.prototype.forEach.call(panel.querySelectorAll("[data-msg-sort-col]"), function (btn) {
        btn.addEventListener("click", function () {
          var column = btn.getAttribute("data-msg-sort-col");
          if (msgSortColumn === column) {
            msgSortDirection = msgSortDirection === "asc" ? "desc" : "asc";
          } else {
            msgSortColumn = column;
            msgSortDirection = "asc";
          }
          render();
        });
      });

      panel.querySelector('[data-f="show-archived"]').addEventListener("change", function (e) {
        msgShowArchived = e.target.checked;
        msgSelectedIds.clear();
        render();
      });

      var selectAll = panel.querySelector('[data-f="select-all"]');
      selectAll.addEventListener("change", function (e) {
        var checked = e.target.checked;
        getVisibleConversations().forEach(function (c) {
          if (checked) msgSelectedIds.add(c.conversationId); else msgSelectedIds.delete(c.conversationId);
        });
        render();
      });

      panel.querySelector('[data-f="mark-read"]').addEventListener("click", function () {
        if (!msgSelectedIds.size) return;
        CONVERSATIONS.list.forEach(function (c) { if (msgSelectedIds.has(c.conversationId)) c.adminReadStatus = "read"; });
        persistConversations();
        render();
        showToast("Marked as read");
      });
      panel.querySelector('[data-f="mark-unread"]').addEventListener("click", function () {
        if (!msgSelectedIds.size) return;
        CONVERSATIONS.list.forEach(function (c) { if (msgSelectedIds.has(c.conversationId)) c.adminReadStatus = "unread"; });
        persistConversations();
        render();
        showToast("Marked as unread");
      });

      var archiveBtn = panel.querySelector('[data-f="archive-selected"]');
      if (archiveBtn) {
        archiveBtn.addEventListener("click", function () {
          if (!can("delete")) return; // defense in depth — Follow-up Operator cannot archive/delete conversations
          if (!msgSelectedIds.size) return;
          var count = msgSelectedIds.size;
          var toArchive = !msgShowArchived;
          var ok = window.confirm(
            (toArchive ? "Archive " : "Restore ") + count + " selected conversation" + (count === 1 ? "" : "s") +
            "? " + (toArchive
              ? "This removes " + (count === 1 ? "it" : "them") + " from the active Inbox but keeps every message \u2014 restore anytime from \u201cShow archived.\u201d"
              : "This returns " + (count === 1 ? "it" : "them") + " to the active Inbox.")
          );
          if (!ok) return;
          CONVERSATIONS.list.forEach(function (c) { if (msgSelectedIds.has(c.conversationId)) c.archived = toArchive; });
          msgSelectedIds.clear();
          persistConversations();
          render();
          showToast(toArchive ? "Archived " + count + " conversation" + (count === 1 ? "" : "s") : "Restored " + count + " conversation" + (count === 1 ? "" : "s"));
        });
      }

      var deleteBtn = panel.querySelector('[data-f="delete-selected"]');
      if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
          if (!can("delete")) return; // defense in depth
          if (!msgSelectedIds.size) return;
          var count = msgSelectedIds.size;
          showConfirmDialog({
            title: "Delete " + count + " conversation" + (count === 1 ? "" : "s") + " permanently?",
            body:
              "This permanently removes the selected conversation" + (count === 1 ? "" : "s") + " and all of its messages " +
              "from this Admin prototype and cannot be undone. Unrelated conversations and Client Records are never " +
              "affected \u2014 only the conversation itself is removed, never the underlying Database client record.",
            confirmLabel: "Delete Permanently",
            onConfirm: function () {
              CONVERSATIONS.list = CONVERSATIONS.list.filter(function (c) { return !msgSelectedIds.has(c.conversationId); });
              msgSelectedIds.clear();
              persistConversations();
              render();
              showToast("Deleted " + count + " conversation" + (count === 1 ? "" : "s") + " permanently");
            }
          });
        });
      }

      panel.querySelector('[data-f="new-conv"]').addEventListener("click", function () {
        addFormOpen = !addFormOpen;
        render();
      });
    }

    function openConversation(conversationId) {
      messagesViewState = { mode: "thread", conversationId: conversationId };
      var conv = CONVERSATIONS.list.filter(function (c) { return c.conversationId === conversationId; })[0];
      if (conv && conv.adminReadStatus !== "read") {
        conv.adminReadStatus = "read";
        persistConversations();
      }
      render();
    }

    render();
    return panel;
  }

  function buildInboxRow(conv, rerender, openConversation) {
    var tr = document.createElement("tr");
    tr.className = "db-row" + (conv.adminReadStatus === "unread" ? " msg-row--unread" : "");

    var client = findClientRecord(conv.clientId);
    var last = getLastMessage(conv);
    var preview = "(no messages yet)";
    if (last) {
      if (last.messageText) preview = last.messageText;
      else if (last.attachment) preview = "\uD83D\uDCF7 Photo";
      else if (last.link) preview = "\uD83D\uDD17 " + last.link.text;
      else preview = "";
    }
    if (preview.length > 60) preview = preview.slice(0, 57) + "\u2026";

    var selectTd = document.createElement("td");
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = msgSelectedIds.has(conv.conversationId);
    checkbox.addEventListener("change", function () {
      if (checkbox.checked) msgSelectedIds.add(conv.conversationId); else msgSelectedIds.delete(conv.conversationId);
      rerender();
    });
    selectTd.appendChild(checkbox);

    var nameTd = document.createElement("td");
    var nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.className = "db-name-btn";
    nameBtn.textContent = resolveConversationName(conv) + (conv.adminReadStatus === "unread" ? " \u25CF" : "");
    nameBtn.addEventListener("click", function () { openConversation(conv.conversationId); });
    nameTd.appendChild(nameBtn);

    var previewTd = document.createElement("td");
    previewTd.textContent = preview;

    var dateTd = document.createElement("td");
    dateTd.textContent = formatConversationTime(conv.lastMessageAt);

    var statusTd = document.createElement("td");
    statusTd.innerHTML = conv.adminReadStatus === "unread" ? '<span class="hidden-tag" style="background:var(--steel-dark);">Unread</span>' : "Read";

    var mobileTd = document.createElement("td");
    mobileTd.textContent = (client && client.mobileNumber) || "\u2014";
    var emailTd = document.createElement("td");
    emailTd.textContent = (client && client.email) || "\u2014";
    var countTd = document.createElement("td");
    countTd.textContent = String(conv.messages.length);

    tr.appendChild(selectTd);
    tr.appendChild(nameTd);
    tr.appendChild(previewTd);
    tr.appendChild(dateTd);
    tr.appendChild(statusTd);
    tr.appendChild(mobileTd);
    tr.appendChild(emailTd);
    tr.appendChild(countTd);
    return tr;
  }

  // Every published photo across the 4 photo-type galleries, so the
  // chat composer can reference an EXISTING media item by its real
  // stable ID rather than creating a duplicate media store.
  function getAllLibraryPhotos() {
    var out = [];
    Object.keys(GALLERY_CONFIG).forEach(function (sectionId) {
      if (GALLERY_CONFIG[sectionId].mediaType !== "photos") return;
      galleryData(sectionId).projects.forEach(function (p) {
        (p.photos || []).forEach(function (ph) {
          if (ph.published) out.push({ mediaId: ph.id, image: ph.image, caption: ph.caption || p.name });
        });
      });
    });
    return out;
  }

  function openMediaPickerModal(onPick) {
    var overlay = el("div", "confirm-overlay");
    var library = getAllLibraryPhotos();
    overlay.innerHTML =
      '<div class="confirm-dialog" style="max-width:540px;">' +
        '<h3 class="confirm-dialog__title">Send a Photo</h3>' +
        (library.length
          ? '<p class="confirm-dialog__body">Choose an existing gallery photo, or upload a new one below.</p><div class="photo-grid" data-f="grid" style="max-height:280px; overflow-y:auto;"></div>'
          : '<p class="confirm-dialog__body">No published gallery photos yet \u2014 upload a new one below.</p>') +
        '<label class="field" style="margin-top:14px;">Or upload a new photo<input type="file" accept="image/*" data-f="upload"></label>' +
        '<div class="card-actions"><button type="button" class="btn btn--secondary btn--sm" data-f="cancel">Cancel</button></div>' +
      '</div>';

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }

    var grid = overlay.querySelector('[data-f="grid"]');
    if (grid) {
      library.forEach(function (entry) {
        var thumbBtn = document.createElement("button");
        thumbBtn.type = "button";
        thumbBtn.className = "photo-thumb";
        thumbBtn.style.cssText = "width:100%; border:none; padding:0; cursor:pointer;";
        thumbBtn.innerHTML = '<img src="' + escapeAttr(safeMediaUrl(entry.image)) + '" alt="" style="width:100%; aspect-ratio:1/1; object-fit:cover; display:block;">';
        thumbBtn.title = entry.caption || "";
        thumbBtn.addEventListener("click", function () {
          close();
          onPick({ mediaId: entry.mediaId, image: entry.image, caption: entry.caption });
        });
        grid.appendChild(thumbBtn);
      });
    }

    overlay.querySelector('[data-f="upload"]').addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      /* D17: staff chat photos are COMMUNICATION media, so they take the
         optimized path — the same one client photos take. The gallery is
         the archive; a photo worth keeping at full quality belongs in a
         project album. HEIC is converted on the device first (D16).

         The attachment still lives on the message rather than in
         gallery_media: sending a chat photo must not file it into an
         unrelated gallery folder. */
      if (!window.LLCMedia.isSupportedChatImage(file)) {
        showToast("Photos only \u2014 videos can't be sent in chat.");
        return;
      }
      showToast("Preparing photo\u2026");
      window.LLCMedia.uploadCommunicationMedia(file, currentConversationId())
        .then(function (out) {
          close();
          onPick({
            mediaId: null,
            bucket: out.bucket,
            path: out.path,
            image: out.signedUrl || "",
            caption: file.name.replace(/\.[a-zA-Z0-9]+$/, "")
          });
        })
        .catch(function (err) {
          showToast("That photo could not be sent.");
          if (window.console) console.error(err);
        });
    });

    overlay.querySelector('[data-f="cancel"]').addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
  }

  // Deterministic (non-AI) validation for links inserted into chat:
  // must be a well-formed http(s) URL, and must not point at anything
  // that looks like Admin-only content (this file, or an "admin" path)
  // — only client-facing links belong in a client conversation.
  function validateClientFacingUrl(raw) {
    if (!raw) return { ok: false, reason: "Enter a URL first." };
    var parsed;
    try {
      parsed = new URL(raw);
    } catch (e) {
      return { ok: false, reason: "That doesn\u2019t look like a valid URL. Include https:// at the start." };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, reason: "Only http:// or https:// links are allowed." };
    }
    var lower = raw.toLowerCase();
    if (lower.indexOf("admin") !== -1) {
      return { ok: false, reason: "Links to Admin-only pages can\u2019t be sent to a client." };
    }
    return { ok: true, reason: "" };
  }

  function buildConversationThread(conversationId, backToInbox) {
    var wrap = document.createElement("div");
    var conv = CONVERSATIONS.list.filter(function (c) { return c.conversationId === conversationId; })[0];

    if (!conv) {
      wrap.innerHTML = '<h2 class="panel__title">Conversation not found</h2>';
      var back0 = buildBackLink("Messages", function () { messagesViewState = { mode: "inbox", conversationId: null }; backToInbox(); });
      wrap.insertBefore(back0, wrap.firstChild);
      return wrap;
    }

    var client = findClientRecord(conv.clientId);
    var name = resolveConversationName(conv);

    var backRow = el("div", "back-row");
    backRow.appendChild(buildBackLink("Messages", function () { messagesViewState = { mode: "inbox", conversationId: null }; backToInbox(); }));
    wrap.appendChild(backRow);

    var head = el("div", "gm-toolbar");
    head.innerHTML =
      '<div class="gm-toolbar__title"><h2 class="panel__title" style="margin:0;">' + name + '</h2>' +
        '<p class="hours-caption" style="margin:4px 0 0;">Group conversation \u2014 participants: Client, Admin, Follow-up Operator</p>' +
      '</div>' +
      '<div>' +
        '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle-read">' + (conv.adminReadStatus === "unread" ? "Mark Read" : "Mark Unread") + '</button> ' +
        (can("delete") ? '<button type="button" class="btn btn--secondary btn--sm" data-f="toggle-archive">' + (conv.archived ? "Restore" : "Archive") + '</button> ' : "") +
        (can("delete") ? '<button type="button" class="btn btn--danger btn--sm" data-f="delete-conv">Delete</button>' : "") +
      '</div>';
    wrap.appendChild(head);

    // Compact Database info — read live from CLIENTS.list every render,
    // so an Admin edit to the Database record is reflected immediately
    // the next time this thread is opened (never a second, stale copy).
    var infoPanel = el("div", "gm-inline-form");
    if (client) {
      infoPanel.innerHTML =
        '<div class="msg-client-info-grid">' +
          '<div><b>Name</b>' + fullClientName(client) + '</div>' +
          '<div><b>Mobile</b>' + (client.mobileNumber || "\u2014") + '</div>' +
          '<div><b>Email</b>' + (client.email || "\u2014") + '</div>' +
          '<div><b>Project Type</b>' + (client.projectType || "\u2014") + '</div>' +
          '<div><b>Bedrooms</b>' + (client.bedrooms === null || client.bedrooms === undefined ? "\u2014" : client.bedrooms) + '</div>' +
          '<div><b>CR</b>' + (client.cr === null || client.cr === undefined ? "\u2014" : client.cr) + '</div>' +
          '<div><b>Budget Max</b>' + formatPeso(client.budgetMax) + '</div>' +
          '<div><b>Best Time to Call</b>' + (client.bestTimeToCall || "\u2014") + '</div>' +
        '</div>';
    } else if (conv.clientId) {
      infoPanel.innerHTML = '<p class="hours-caption" style="margin:0;">This conversation\u2019s linked Database record (id: ' + conv.clientId + ') was not found \u2014 it may have been deleted from Database. The conversation and its messages are preserved regardless.</p>';
    } else {
      infoPanel.innerHTML = '<p class="hours-caption" style="margin:0;">No Database client is linked to this conversation (guest).</p>';
    }
    wrap.appendChild(infoPanel);

    var thread = el("div", "msg-thread");
    if (!conv.messages.length) {
      thread.innerHTML = '<h3 class="empty-state__title">No messages yet.</h3>';
    } else {
      conv.messages.forEach(function (m) {
        var isStaff = m.senderRole === "staff" || m.senderRole === "admin"; // "admin" = legacy Part 5 messages
        var bubble = el("div", "msg-bubble msg-bubble--" + (isStaff ? "admin" : "client"));
        var authorLabel = isStaff
          ? (m.senderName ? (m.senderName + " \u2014 " + (m.senderRoleLabel || "Admin")) : "Admin")
          : "Client";

        var innerHtml = '<div class="msg-bubble__meta">' + authorLabel + " \u00B7 " + new Date(m.timestamp).toLocaleString() + "</div>";
        if (m.messageText) {
          innerHtml += '<div class="msg-bubble__text" data-f="text"></div>';
        }
        if (m.attachment) {
          /* XSS FIX. The src was interpolated unescaped; a path
             containing a quote could break out of the attribute. Clients
             supply these files now (D8), so it is no longer trusted. */
          innerHtml += '<img class="msg-bubble__photo" src="' +
                       escapeAttr(safeMediaUrl(m.attachment.image)) + '" alt="' +
                       escapeAttr(m.attachment.caption || "Shared photo") + '">';
          if (m.attachment.caption) innerHtml += '<div class="msg-bubble__caption">' + escapeHtml(m.attachment.caption) + "</div>";
        }
        if (m.link) {
          innerHtml += '<a class="msg-bubble__link" data-f="link" target="_blank" rel="noopener noreferrer"></a>';
        }
        bubble.innerHTML = innerHtml;

        if (m.messageText) bubble.querySelector('[data-f="text"]').textContent = m.messageText;
        if (m.link) {
          var linkEl = bubble.querySelector('[data-f="link"]');
          linkEl.href = m.link.url;
          linkEl.textContent = m.link.text;
        }
        thread.appendChild(bubble);
      });
    }
    wrap.appendChild(thread);

    var composer = el("div", "msg-composer");
    var currentUser = getCurrentUser();
    var composerHtml =
      '<p class="hours-caption" style="margin:0 0 8px;">Prototype composer \u2014 messages typed here are stored in this ' +
      'Admin browser only; there is no live connection to deliver them to an actual Client session.</p>' +
      '<div style="display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap;">' +
        '<textarea data-f="text" rows="2" style="flex:1; min-width:200px; padding:8px; border:1px solid var(--concrete-line); border-radius:var(--radius); font-family:inherit;" placeholder="Reply as ' + (currentUser ? escapeAttr(currentUser.name) : "") + '\u2026"></textarea>' +
        '<button type="button" class="btn btn--primary btn--sm" data-f="send">Send</button>' +
      '</div>' +
      '<div class="card-actions" style="margin-top:10px;">' +
        (can("send-media") ? '<button type="button" class="btn btn--secondary btn--sm" data-f="attach-photo">\uD83D\uDCF7 Photo</button>' : "") +
        (can("send-media") ? '<button type="button" class="btn btn--secondary btn--sm" data-f="insert-link">\uD83D\uDD17 Link</button>' : "") +
      '</div>' +
      '<div data-f="link-form-holder"></div>';

    /* REMOVED: the "simulate an incoming client message" testing tool.
       It fabricated a client-role message from a staff session. Against
       the real database no policy permits that — a client message must
       carry the client's own id — so it could only ever fail. Removed
       rather than left to error, since a real client message now comes
       from the client. */
    composer.innerHTML = composerHtml;
    wrap.appendChild(composer);

    head.querySelector('[data-f="toggle-read"]').addEventListener("click", function () {
      conv.adminReadStatus = conv.adminReadStatus === "unread" ? "read" : "unread";
      persistConversations();
      backToInbox();
    });
    var toggleArchiveBtn = head.querySelector('[data-f="toggle-archive"]');
    if (toggleArchiveBtn) {
      toggleArchiveBtn.addEventListener("click", function () {
        if (!can("delete")) return; // defense in depth
        conv.archived = !conv.archived;
        persistConversations();
        showToast(conv.archived ? "Archived" : "Restored");
        backToInbox();
      });
    }
    var deleteConvBtn = head.querySelector('[data-f="delete-conv"]');
    if (deleteConvBtn) {
      deleteConvBtn.addEventListener("click", function () {
        if (!can("delete")) return; // defense in depth
        showConfirmDialog({
          title: "Delete this conversation permanently?",
          body: "This permanently deletes the entire conversation with " + name + " and cannot be undone. The linked Database client record is never affected.",
          confirmLabel: "Delete Permanently",
          onConfirm: function () {
            CONVERSATIONS.list = CONVERSATIONS.list.filter(function (c) { return c.conversationId !== conv.conversationId; });
            persistConversations();
            messagesViewState = { mode: "inbox", conversationId: null };
            backToInbox();
            showToast("Conversation deleted permanently");
          }
        });
      });
    }

    composer.querySelector('[data-f="send"]').addEventListener("click", function () {
      if (!can("chat")) return; // defense in depth
      var textEl = composer.querySelector('[data-f="text"]');
      var text = textEl.value.trim();
      if (!text) return;
      appendMessage(conv, "staff", text);
      persistConversations();
      textEl.value = "";
      backToInbox();
    });

    var attachBtn = composer.querySelector('[data-f="attach-photo"]');
    if (attachBtn) {
      attachBtn.addEventListener("click", function () {
        if (!can("send-media")) return; // defense in depth
        openMediaPickerModal(function (chosen) {
          appendMessage(conv, "staff", "", { attachment: chosen });
          persistConversations();
          backToInbox();
        });
      });
    }

    var linkBtn = composer.querySelector('[data-f="insert-link"]');
    var linkFormHolder = composer.querySelector('[data-f="link-form-holder"]');
    if (linkBtn) {
      linkBtn.addEventListener("click", function () {
        if (!can("send-media")) return; // defense in depth
        linkFormHolder.innerHTML =
          '<div class="gm-inline-form">' +
            '<label class="field">Link Text<input type="text" data-f="link-text" placeholder="e.g. Here is our completed project"></label>' +
            '<label class="field">URL<input type="text" data-f="link-url" placeholder="https://\u2026"></label>' +
            '<p class="hours-caption" data-f="link-error" hidden style="color:#9a2f21;background:#fbe9e7;"></p>' +
            '<div class="card-actions"><button type="button" class="btn btn--primary btn--sm" data-f="link-send">Send Link</button>' +
            '<button type="button" class="btn btn--secondary btn--sm" data-f="link-cancel">Cancel</button></div>' +
          '</div>';
        linkFormHolder.querySelector('[data-f="link-cancel"]').addEventListener("click", function () { linkFormHolder.innerHTML = ""; });
        linkFormHolder.querySelector('[data-f="link-send"]').addEventListener("click", function () {
          if (!can("send-media")) return;
          var linkText = linkFormHolder.querySelector('[data-f="link-text"]').value.trim();
          var linkUrl = linkFormHolder.querySelector('[data-f="link-url"]').value.trim();
          var errorEl = linkFormHolder.querySelector('[data-f="link-error"]');
          var validation = validateClientFacingUrl(linkUrl);
          if (!linkText || !validation.ok) {
            errorEl.textContent = !linkText ? "Enter link text first." : validation.reason;
            errorEl.hidden = false;
            return;
          }
          appendMessage(conv, "staff", "", { link: { text: linkText, url: linkUrl } });
          persistConversations();
          backToInbox();
        });
      });
    }

    return wrap;
  }


  function renderMain() {
    var main = document.getElementById("admin-main-content");
    main.innerHTML = "";

    ensureActiveSectionVisible();

    if (!activeSection) {
      main.appendChild(buildRoleLandingPanel());
      return;
    }

    if (activeSection === "about") {
      main.appendChild(can("edit") ? buildAboutPanel() : buildAccessDeniedPanel());
      return;
    }

    if (activeSection === "reviews") {
      main.appendChild(can("edit") ? buildReviewsPanel() : buildAccessDeniedPanel());
      return;
    }

    if (activeSection === "testimonial-videos") {
      main.appendChild(can("edit") ? buildTestimonialVideosPanel() : buildAccessDeniedPanel());
      return;
    }

    if (activeSection === "database") {
      if (can("edit")) {
        main.appendChild(buildDatabasePanel());
      } else if (can("view-client-contact") || can("view-client-design")) {
        main.appendChild(buildRestrictedClientMatrix(getCurrentUser().role));
      } else {
        main.appendChild(buildAccessDeniedPanel());
      }
      return;
    }

    if (MANAGED_GALLERY_SECTIONS[activeSection]) {
      if (can("edit")) {
        main.appendChild(buildGalleryAdminPanel(activeSection));
      } else if (can("upload")) {
        main.appendChild(buildUploaderGalleryPanel(activeSection));
      } else {
        main.appendChild(buildAccessDeniedPanel());
      }
      return;
    }

    if (activeSection === "messages") {
      main.appendChild(can("chat") ? buildMessagesPanel() : buildAccessDeniedPanel());
      return;
    }

    if (activeSection === "users") {
      main.appendChild(buildUsersPanel());
      return;
    }

    if (!can("edit")) {
      main.appendChild(buildAccessDeniedPanel());
      return;
    }

    var item = ADMIN_NAV.find(function (n) { return n.id === activeSection; });
    var label = item ? item.label : "";
    var message = PLACEHOLDER_MESSAGES[activeSection] || "This section will be available in a later part of Phase 10.";
    main.appendChild(buildPlaceholderPanel(label, message));
  }

  /* ---------- Render + Log Out ---------- */
  function renderApp() {
    renderHeader();
    renderNav();
    renderMain();
    renderAuthArea();
  }

  function renderAuthArea() {
    var area = document.getElementById("admin-auth-area");
    area.innerHTML = "";

    var user = getCurrentUser();
    if (!user) return;

    var label = document.createElement("span");
    label.className = "auth-welcome";
    label.textContent = user.name + " \u2014 " + ROLE_LABELS[user.role];
    area.appendChild(label);

    // NOTE: no role switcher here. In this database-ready version the
    // role comes from the authenticated backend response only — the
    // browser user can never choose or change it from the UI.

    var logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "auth-link";
    logoutBtn.textContent = "Log Out";
    logoutBtn.addEventListener("click", handleLogout);

    area.appendChild(logoutBtn);
  }

  function handleLogout() {
    showToast("Logging out\u2026");
    AuthService.logout().then(function () {
      showLoginGate();
    });
  }

  /* ---------- Login gate / dashboard switching ---------- */
  function showLoginGate() {
    document.getElementById("admin-app-shell").hidden = true;
    document.getElementById("admin-login-gate").hidden = false;
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
    hideLoginError();
  }

  /* MODIFICATION 2 + 4. Both call sites below (login success, and the
     page-load session restore) already funnel through this one
     function — it stays the single choke point, so the async reload
     added here cannot race between two different init paths. A brief
     loading state covers the network round trip; the dashboard itself
     is not shown with stale/local data if Supabase is configured. */
  function showDashboard() {
    document.getElementById("admin-login-gate").hidden = true;
    document.getElementById("admin-app-shell").hidden = false;

    /* Target the existing content container rather than the whole
       shell — admin-app-shell's other children (admin-auth-area,
       admin-nav-list) are fixed containers renderApp()'s own
       sub-functions expect to already exist. Replacing the whole
       shell's markup here would delete them and break every
       document.getElementById() call inside renderApp() on the very
       next line. */
    var main = document.getElementById("admin-main-content");
    if (main) main.innerHTML = '<p class="db-loading-note" style="padding:24px;">Loading\u2026</p>';

    refreshFromBackendIfConfigured()
      .then(function () { renderApp(); })
      .catch(function () {
        /* Already reported to the person via showToast() inside
           refreshFromBackendIfConfigured(). Render anyway with
           whatever local data exists, rather than leaving a dead
           "Loading…" screen with no way forward. */
        renderApp();
      });
  }

  function hideLoginError() {
    var el2 = document.getElementById("login-error");
    el2.hidden = true;
    el2.textContent = "";
  }

  function showLoginError(message) {
    var el2 = document.getElementById("login-error");
    el2.textContent = message;
    el2.hidden = false;
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    /* MODIFICATION 1 correction. The prior fix for the missing config
       guard disabled the login form entirely when Supabase was not
       configured — which also silently broke the requirement that a
       working local/prototype login must remain available until a
       real backend exists. Blocking the form was the wrong mechanism:
       the real fix is that apiAdapter (above) already selects the
       correct backend on its own. Here we only INFORM, never block. */
    if (!window.LLCSupabase || !window.LLCSupabase.isConfigured()) {
      showLoginError(
        "Running in local/demo mode — Supabase is not configured yet. " +
        "Sign-in and content are local to this browser until " +
        "SUPABASE_URL and SUPABASE_ANON_KEY are set in js/supabase-client.js."
      );
    }

    var form = document.getElementById("admin-login-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideLoginError();
      var username = document.getElementById("login-username").value.trim();
      var password = document.getElementById("login-password").value;
      var submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      var originalText = submitBtn.textContent;
      submitBtn.textContent = "Signing in\u2026";
      AuthService.login(username, password)
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showDashboard();
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          // Deliberately generic — never reveals which field was wrong.
          showLoginError("Incorrect email or password.");
        });
    });

    /* Staff password reset (D19). Uses Supabase's own reset email; no
       password is chosen, seen, or handled here. */
    var forgotBtn = document.getElementById("btn-admin-forgot");
    if (forgotBtn) {
      forgotBtn.addEventListener("click", function () {
        var email = document.getElementById("login-username").value.trim();
        if (!email) {
          showLoginError("Enter your email address first, then choose Forgot your password.");
          return;
        }
        window.LLCAdminBackend.requestStaffPasswordReset(email)
          .then(function () {
            hideLoginError();
            showToast("If that email is registered, a reset link is on its way.");
          })
          .catch(function () {
            /* Same message either way — otherwise this becomes a way to
               test which staff addresses exist. */
            showToast("If that email is registered, a reset link is on its way.");
          });
      });
    }

    // Equivalent of a real app calling GET /api/auth/me on load, to
    // find out whether an existing (server) session is still valid —
    // here backed by the mock adapter's opaque session token instead.
    /* MODIFICATION 7 — password recovery return.
       A staff member who clicked the reset link arrives here with a
       Supabase recovery session already established in the URL
       (detectSessionInUrl in supabase-client.js handles that part).
       Checked BEFORE the normal session check below, exactly the way
       the Client site's bootstrap.js checks first — an incoming
       recovery link should always win over "just log in normally". */
    if (window.location.hash.indexOf("reset") !== -1 &&
        document.getElementById("admin-reset-gate")) {
      document.getElementById("admin-login-gate").hidden = true;
      document.getElementById("admin-app-shell").hidden = true;
      document.getElementById("admin-reset-gate").hidden = false;

      var resetForm = document.getElementById("admin-set-password-form");
      resetForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var errEl = document.getElementById("admin-set-password-error");
        errEl.hidden = true;

        var pw = document.getElementById("admin-set-password").value;
        var pw2 = document.getElementById("admin-set-password-confirm").value;
        if (pw !== pw2) {
          errEl.textContent = "Passwords don't match. Please re-enter them.";
          errEl.hidden = false;
          return;
        }

        var saveBtn = resetForm.querySelector("button[type=submit]");
        saveBtn.disabled = true;
        var originalLabel = saveBtn.textContent;
        saveBtn.textContent = "Saving\u2026";

        /* Uses whichever backend is actually configured — mirrors
           apiAdapter's own selection rather than assuming Supabase is
           necessarily present (Modification 1's architecture applied
           here too, not just to login). */
        var completeReset = useSupabase()
          ? window.LLCAdminBackend.completeStaffPasswordReset
          : function () {
              return Promise.reject(new Error(
                "Password reset requires Supabase to be configured."));
            };

        completeReset(pw)
          .then(function () {
            showToast("Password updated. Please log in with your new password.");
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, "", window.location.pathname);
            }
            document.getElementById("admin-reset-gate").hidden = true;
            /* Returns to the NORMAL authentication/session state, per
               the requirement — not straight into the dashboard, since
               a password change is not the same event as a login and
               should not be treated as an implicit one. */
            showLoginGate();
          })
          .catch(function (err) {
            errEl.textContent = (err && err.message) ||
              "Could not update the password. The link may have expired — request a new one.";
            errEl.hidden = false;
          })
          .then(function () {
            saveBtn.disabled = false;
            saveBtn.textContent = originalLabel;
          });
      });

      return;   // do not also run the normal login-gate wiring below
    }

    AuthService.checkSession().then(function (user) {
      if (user) showDashboard();
      else showLoginGate();
    });
  });
})();
