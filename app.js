/**
 * APP.JS
 * ------
 * Renders the page from window.SITE_DATA and wires up the Phase 1
 * interactions. No company text is hard-coded here — everything comes
 * from data.js so a later admin dashboard can change it without touching
 * this file.
 */

(function () {
  "use strict";

  const DATA = window.SITE_DATA;

  /* XSS AUDIT FIX. Every field below comes from the database, and every
     one of those fields is ordinary staff-typed text (a project name, a
     review, a caption) with no restriction on its characters. Handing
     any of it to innerHTML unescaped lets a stray "<" or a crafted
     string run as markup in every visitor's browser.
     esc()     — element content and quoted attribute values
     safeUrl() — anything landing in a src="" (checks the scheme, not
                 just the characters — javascript: is valid HTML and
                 still dangerous) */
  const esc = window.LLCEscape ? window.LLCEscape.esc : function (v) {
    return v === null || v === undefined ? "" : String(v);
  };
  const safeUrl = window.LLCEscape ? window.LLCEscape.safeUrl : function (v) {
    return v || "";
  };

  const ICONS = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.4"/><path d="M4 17l5-5 3 3 3.5-4L20 16"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.6 2.6L16.3 9"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><line x1="8" y1="4.5" x2="8" y2="19.5"/><line x1="16" y1="4.5" x2="16" y2="19.5"/><line x1="3.5" y1="9" x2="8" y2="9"/><line x1="16" y1="9" x2="20.5" y2="9"/><line x1="3.5" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="20.5" y2="15"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11.5L12 4l8 7.5"/><path d="M6 10v9.5h12V10"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><line x1="3.5" y1="10.5" x2="20.5" y2="10.5"/><line x1="11.5" y1="10.5" x2="11.5" y2="19.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3.5h3l1.4 4-2 1.3a11 11 0 0 0 4.8 4.8l1.3-2 4 1.4v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 5 5.1 1.5 1.5 0 0 1 6 3.5z" stroke-linejoin="round"/></svg>',
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5h16v11H9.5L5 20v-3.5H4z" stroke-linejoin="round" stroke-linecap="round"/></svg>'
  };

  let activeSection = "about";

  // "Category → Project/Album → Photos" sections share one gallery
  // engine (see buildGalleryPanel and friends below). Each entry maps a
  // stable nav id to the DATA property holding its categories/projects,
  // plus which media type that section's albums hold ("photos" opens
  // the photo lightbox; "videos" opens the shared video player). Adding
  // a future gallery-type section (Ground Breaking, Interior Design)
  // means adding one line here plus its data block in data.js — not
  // writing a new set of functions.
  const GALLERY_SECTIONS = {
    "exterior-design": {
      dataKey: "exteriorDesign",
      mediaType: "photos",
      mediaKey: "photos",
      mediaNoun: "photo",
      emptyProjectsTitle: "No projects yet"
    },
    "completed-project-photos": {
      dataKey: "completedProjectPhotos",
      mediaType: "photos",
      mediaKey: "photos",
      mediaNoun: "photo",
      emptyProjectsTitle: "No completed projects in this category yet."
    },
    "completed-project-videos": {
      dataKey: "completedProjectVideos",
      mediaType: "videos",
      mediaKey: "videos",
      mediaNoun: "video",
      emptyProjectsTitle: "No completed projects in this category yet."
    },
    "interior-design": {
      dataKey: "interiorDesign",
      mediaType: "photos",
      mediaKey: "photos",
      mediaNoun: "photo",
      emptyProjectsTitle: "No interior design projects in this category yet."
    },
    // "flat: true" (not used by any section currently) means a gallery
    // has no category level — it's supported by the engine below in
    // case a future section needs it, but Ground Breaking uses the
    // standard Category → Album → Photos shape like the others.
    "ground-breaking": {
      dataKey: "groundBreaking",
      mediaType: "photos",
      mediaKey: "photos",
      mediaNoun: "photo",
      emptyProjectsTitle: "No ground breaking projects in this category yet."
    }
  };

  // Where the visitor currently is inside each gallery section,
  // keyed by nav id, so browsing one doesn't disturb another.
  let galleryStates = {};

  function getGalleryState(sectionId) {
    if (!galleryStates[sectionId]) {
      const flat = GALLERY_SECTIONS[sectionId].flat;
      galleryStates[sectionId] = { level: flat ? "projects" : "categories", categoryId: null, projectId: null };
    }
    return galleryStates[sectionId];
  }

  function getNavLabel(id) {
    const item = navItems().find((n) => n.id === id);
    return item ? item.label : "";
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  /* ---------- Header / identity ---------- */

  function renderHeader() {
    const c = DATA.company;
    document.getElementById("cover-photo").src = c.coverImage;
    document.getElementById("cover-photo").alt = c.name + " project sites";
    document.getElementById("profile-photo").src = c.profileImage;
    document.getElementById("profile-photo").alt = c.name + " logo";
    document.getElementById("company-name").textContent = c.name;
    document.getElementById("company-tagline").textContent = c.description;
    document.title = c.name;
  }

  /* ---------- "See more / See less" description toggle ---------- */

  function debounce(fn, wait) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  function wireDescriptionToggle() {
    const text = document.getElementById("company-tagline");
    const toggle = document.getElementById("btn-desc-toggle");

    function evaluate() {
      const wasExpanded = text.classList.contains("is-expanded");
      text.classList.remove("is-expanded");
      const isTruncated = text.scrollHeight > text.clientHeight + 1;
      toggle.hidden = !isTruncated;
      if (wasExpanded && isTruncated) text.classList.add("is-expanded");
      toggle.textContent = text.classList.contains("is-expanded") ? "See less" : "See more";
    }

    toggle.addEventListener("click", () => {
      text.classList.toggle("is-expanded");
      toggle.textContent = text.classList.contains("is-expanded") ? "See less" : "See more";
    });

    window.addEventListener("resize", debounce(evaluate, 150));
    // Run after layout/fonts settle so the truncation check is accurate.
    requestAnimationFrame(() => requestAnimationFrame(evaluate));
  }

  /* ---------- Sidebar + mobile tab strip ---------- */

  /* The Admin has always had a per-item "visible" flag; the site
     ignored it, so hiding a section in the Admin changed nothing here.
     One shared database means the two can no longer disagree. */
  function navItems() {
    return (DATA.nav || []).filter((item) => item.visible !== false);
  }

  function renderNav() {
    const list = document.getElementById("nav-list");
    const strip = document.getElementById("tab-strip");
    list.innerHTML = "";
    strip.innerHTML = "";

    navItems().forEach((item) => {
      // Sidebar item
      const li = el("li");
      const btn = el(
        "button",
        "nav-item",
        `<span class="nav-item__icon">${ICONS[item.icon] || ""}</span><span>${item.label}</span>` +
          (item.status === "coming-soon" ? '<span class="nav-item__badge">Coming soon</span>' : "")
      );
      btn.setAttribute("aria-current", item.id === activeSection ? "true" : "false");
      btn.addEventListener("click", () => selectSection(item.id));
      li.appendChild(btn);
      list.appendChild(li);

      // Mobile tab
      const tab = el("button", "tab-strip__item", item.label);
      tab.setAttribute("aria-current", item.id === activeSection ? "true" : "false");
      tab.addEventListener("click", () => selectSection(item.id));
      strip.appendChild(tab);
    });
  }

  function selectSection(id) {
    activeSection = id;
    if (GALLERY_SECTIONS[id]) {
      // Re-entering a gallery section from the main nav always starts at
      // its top level, so the visitor never lands mid-album by surprise.
      const flat = GALLERY_SECTIONS[id].flat;
      galleryStates[id] = { level: flat ? "projects" : "categories", categoryId: null, projectId: null };
    }
    renderNav();
    renderMain();
    scrollToMain();
    pushNavIfChanged(null);
  }

  function scrollToMain() {
    document.getElementById("main-content").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Browser/Android Back support for gallery + modal navigation ----------
     A lightweight in-app "router" so the physical/Android Back button and a
     visible "← Back" link both move up exactly one level (viewer → album →
     category → company page) instead of leaving the site or doing nothing.
     This is entirely separate from login state: it only ever runs inside
     the already-authenticated app-shell, and popping back through it never
     touches AuthService or logs anyone out.

     How it works: every forward navigation (switching nav sections,
     drilling into a gallery, opening the photo/video/chat overlay) computes
     a small state object and calls history.pushState — but only if that
     state actually differs from the last one, so clicking the same thing
     twice, or stepping through Next/Previous inside an open photo, never
     creates extra history entries. The visible "← Back" link on gallery
     screens calls history.back() instead of navigating forward on its own,
     so it can never get out of sync with the physical Back button. */

  let currentNavState = null;

  function computeNavState(modal) {
    const gallery = GALLERY_SECTIONS[activeSection] ? getGalleryState(activeSection) : null;
    return {
      section: activeSection,
      gallery: gallery ? { level: gallery.level, categoryId: gallery.categoryId, projectId: gallery.projectId } : null,
      modal: modal || null
    };
  }

  function navStatesEqual(a, b) {
    if (!a || !b) return a === b;
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function pushNavIfChanged(modal) {
    const next = computeNavState(modal);
    if (navStatesEqual(next, currentNavState)) return;
    history.pushState(next, "");
    currentNavState = next;
  }

  // Resets the in-app history baseline to "just landed on the company
  // page" — used once on first login, and again on every subsequent
  // login, so a previous session's gallery position never lingers in
  // the back-stack after a logout/login.
  function resetNavHistory() {
    currentNavState = computeNavState(null);
    history.replaceState(currentNavState, "");
  }

  // Applies a state popped off history (Back button) WITHOUT pushing a
  // new entry — pushing here would re-add the very entry the user just
  // backed out of.
  function applyNavState(state) {
    const s = state || { section: "about", gallery: null, modal: null };

    if (s.modal !== "photo") hidePhotoModalDom();
    if (s.modal !== "video") hideVideoModalDom();
    if (s.modal !== "chat") hideChatModalDom();

    activeSection = s.section || "about";
    if (s.gallery && GALLERY_SECTIONS[activeSection]) {
      galleryStates[activeSection] = s.gallery;
    }
    currentNavState = s;
    renderNav();
    renderMain();

    if (s.modal === "photo" && photoModalState.photos.length) showPhotoModalDom();
    if (s.modal === "chat") showChatModalDom();
    // Video is intentionally not restored on Back-forward (history.forward()) —
    // resuming playback of a specific clip after Back/Forward isn't needed
    // for this prototype; Back always closes it, which is the common case.
  }

  window.addEventListener("popstate", (e) => {
    applyNavState(e.state);
  });

  /* ---------- Business hours helpers ---------- */

  function to12Hour(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }

  // Reads the current day/time in the business's own timezone (not the
  // visitor's), so the badge is accurate no matter where the visitor is.
  function getManilaNow(timezone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(new Date());

    const map = {};
    parts.forEach((p) => (map[p.type] = p.value));
    const hour = map.hour === "24" ? 0 : Number(map.hour);
    return { day: map.weekday, minutes: hour * 60 + Number(map.minute) };
  }

  function computeOpenStatus(hours) {
    const now = getManilaNow(hours.timezone);
    const today = hours.schedule.find((d) => d.day === now.day);
    if (!today || !today.open) return { open: false, today };

    const [oh, om] = today.open.split(":").map(Number);
    const [ch, cm] = today.close.split(":").map(Number);
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;
    return { open: now.minutes >= openMinutes && now.minutes < closeMinutes, today };
  }

  /* ---------- Main content ---------- */

  function renderMain() {
    const main = document.getElementById("main-content");
    main.innerHTML = "";

    const section = navItems().find((n) => n.id === activeSection);

    if (section.id === "about") {
      main.appendChild(buildAboutPanel());
      main.appendChild(buildLocationPanel());
      main.appendChild(buildHoursPanel());
      main.appendChild(buildContactPanel());
      return;
    }

    if (section.id === "reviews") {
      main.appendChild(buildReviewsPanel());
      return;
    }

    if (section.id === "testimonial-videos") {
      main.appendChild(buildVideoTestimonialsPanel());
      return;
    }

    if (GALLERY_SECTIONS[section.id]) {
      main.appendChild(buildGalleryPanel(section.id));
      return;
    }

    main.appendChild(buildComingSoonPanel(section.label));
  }

  function buildAboutPanel() {
    const c = DATA.company;
    const panel = el("section", "panel");
    panel.innerHTML = `
      <h2 class="panel__title">About ${esc(c.name)}</h2>
      <div class="panel__body">
        <p>${esc(c.description)}</p>
      </div>
    `;
    return panel;
  }

  function buildLocationPanel() {
    const c = DATA.company;
    const panel = el("section", "panel");
    panel.innerHTML = `
      <h2 class="panel__title">Location</h2>
      <div class="location-card">
        <div class="location-card__visual" aria-hidden="true">
          <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
            <rect width="200" height="120" fill="var(--concrete)"/>
            <g stroke="var(--concrete-line)" stroke-width="1">
              <line x1="0" y1="24" x2="200" y2="24"/>
              <line x1="0" y1="52" x2="200" y2="52"/>
              <line x1="0" y1="80" x2="200" y2="80"/>
              <line x1="0" y1="108" x2="200" y2="108"/>
              <line x1="34" y1="0" x2="34" y2="120"/>
              <line x1="80" y1="0" x2="80" y2="120"/>
              <line x1="130" y1="0" x2="130" y2="120"/>
              <line x1="170" y1="0" x2="170" y2="120"/>
            </g>
            <circle cx="100" cy="58" r="9" fill="var(--amber)"/>
            <path d="M100 58 L100 74" stroke="var(--amber)" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="location-card__text">
          <p class="location-card__place">${c.location}</p>
          <p class="location-card__note">General service area. An interactive map will be added once we confirm the exact business address.</p>
        </div>
      </div>
    `;
    return panel;
  }

  function buildHoursPanel() {
    const c = DATA.company;
    const status = computeOpenStatus(c.hours);
    const todayName = status.today ? status.today.day : "";

    const rows = c.hours.schedule
      .map((d) => {
        const isToday = d.day === todayName;
        const timeText = d.open ? `${to12Hour(d.open)} – ${to12Hour(d.close)}` : "Closed";
        // Chat availability is separate from office hours — the button
        // shows every day (including Sunday) unless a day is explicitly
        // marked chatAvailable: false.
        const chatOn = d.chatAvailable !== false;
        return `
          <li class="hours-row${isToday ? " hours-row--today" : ""}${!d.open ? " hours-row--closed" : ""}">
            <span class="hours-row__day">${d.day}${isToday ? " · Today" : ""}</span>
            <span class="hours-row__time">${timeText}</span>
            ${chatOn ? `<button type="button" class="hours-row__chat" data-hours-chat>Chat</button>` : ""}
          </li>
        `;
      })
      .join("");

    const panel = el("section", "panel");
    panel.innerHTML = `
      <div class="panel__title-row">
        <h2 class="panel__title">Business Hours</h2>
        <span class="status-badge ${status.open ? "status-badge--open" : "status-badge--closed"}">
          ${status.open ? "Open now" : "Closed now"}
        </span>
      </div>
      <ul class="hours-list">${rows}</ul>
      <p class="hours-caption">Based on Calaca City, Philippines time. Chat is available every day, even when the office is closed.</p>
    `;

    // Every one of these buttons opens the SAME client conversation —
    // there is no separate conversation per day.
    panel.querySelectorAll("[data-hours-chat]").forEach((btn) => {
      btn.addEventListener("click", openChatModal);
    });

    return panel;
  }

  function buildContactPanel() {
    const c = DATA.company;
    const panel = el("section", "panel");
    panel.innerHTML = `
      <h2 class="panel__title">Contact</h2>
      <div class="contact-list">
        <div class="contact-row">
          <span class="contact-row__icon" aria-hidden="true">${ICONS.phone || ""}</span>
          <span class="contact-row__label">Mobile</span>
          <span class="contact-row__value ${c.mobile ? "" : "contact-row__value--muted"}">${c.mobile || "Coming soon"}</span>
          ${c.mobile ? `<button type="button" class="contact-row__action" data-contact-call>Call</button>` : ""}
        </div>
      </div>
    `;

    const callBtn = panel.querySelector("[data-contact-call]");
    if (callBtn) {
      callBtn.addEventListener("click", () => {
        window.location.href = `tel:${c.mobile.replace(/\s+/g, "")}`;
      });
    }

    return panel;
  }

  /* ---------- Recommendations & Reviews ---------- */

  function getInitials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  // Only admin-published items are ever shown, sorted by the admin's
  // chosen display order. This filter/sort is the only "logic" the
  // public page applies — it never adds, edits, or publishes anything.
  function publishedInOrder(items) {
    return items
      .filter((item) => item.published)
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  function buildReviewCard(review, isSample) {
    const card = el("article", "review-card" + (isSample ? " review-card--sample" : ""));
    const meta = [review.project, review.location].filter(Boolean).join(" · ");
    const avatar = review.customerPhoto
      ? `<img class="review-card__avatar review-card__avatar--photo" src="${safeUrl(review.customerPhoto)}" alt="" />`
      : `<span class="review-card__avatar">${esc(getInitials(review.customerName || "C N"))}</span>`;

    card.innerHTML = `
      ${isSample ? '<span class="sample-badge">Sample — not a real review</span>' : ""}
      <div class="review-card__head">
        ${avatar}
        <div>
          <p class="review-card__name">${esc(review.customerName)}</p>
          ${meta ? `<p class="review-card__meta">${meta}</p>` : ""}
        </div>
      </div>
      <p class="review-card__text">“${esc(review.text)}”</p>
      ${review.date ? `<p class="review-card__date">${review.date}</p>` : ""}
    `;
    return card;
  }

  function buildReviewsPanel() {
    const data = DATA.reviews;
    const published = publishedInOrder(data.items);
    const wrap = el("div");

    const headPanel = el("section", "panel");
    headPanel.innerHTML = `
      <h2 class="panel__title">${getNavLabel("reviews")}</h2>
      <div class="recommend-badge">
        <span class="recommend-badge__figure">${data.recommendPercent}%</span>
        <span class="recommend-badge__label">Recommend<br>Based on customer recommendations</span>
      </div>
    `;
    wrap.appendChild(headPanel);

    const listPanel = el("section", "panel");

    if (published.length === 0) {
      listPanel.innerHTML = `
        <h3 class="empty-state__title">Customer Reviews</h3>
        <p class="empty-state__body">Customer testimonials will appear here.</p>
      `;
      const grid = el("div", "review-grid review-grid--preview");
      data.sampleItems.forEach((r) => grid.appendChild(buildReviewCard(r, true)));
      listPanel.appendChild(grid);
    } else {
      const grid = el("div", "review-grid");
      published.forEach((r) => grid.appendChild(buildReviewCard(r, false)));
      listPanel.appendChild(grid);
    }

    wrap.appendChild(listPanel);
    return wrap;
  }

  /* ---------- Testimonial Videos ---------- */

  function buildVideoCard(video, isSample, sampleLabel) {
    const card = el("article", "video-card" + (isSample ? " video-card--sample" : ""));
    card.innerHTML = `
      ${isSample ? `<span class="sample-badge">${sampleLabel || "Demo Video — Placeholder"}</span>` : ""}
      <button type="button" class="video-card__thumb" aria-label="Play ${esc(video.title)}">
        <img src="${safeUrl(video.thumbnail)}" alt="" />
        <span class="video-card__play">${ICONS.play}</span>
      </button>
      <div class="video-card__body">
        <p class="video-card__title">${esc(video.title)}</p>
        ${video.description ? `<p class="video-card__desc">${esc(video.description)}</p>` : ""}
      </div>
    `;
    card.querySelector(".video-card__thumb").addEventListener("click", () => openVideoModal(video));
    return card;
  }

  function buildVideoTestimonialsPanel() {
    const data = DATA.videoTestimonials;
    const published = publishedInOrder(data.items);
    const panel = el("section", "panel");

    if (published.length === 0) {
      panel.innerHTML = `
        <h2 class="panel__title">${getNavLabel("testimonial-videos")}</h2>
        <p class="empty-state__body">Customer testimonial videos will appear here.</p>
      `;
      const grid = el("div", "video-grid video-grid--preview");
      data.sampleItems.forEach((v) => grid.appendChild(buildVideoCard(v, true)));
      panel.appendChild(grid);
    } else {
      panel.innerHTML = `<h2 class="panel__title">${getNavLabel("testimonial-videos")}</h2>`;
      const grid = el("div", "video-grid");
      published.forEach((v) => grid.appendChild(buildVideoCard(v, false)));
      panel.appendChild(grid);
    }

    return panel;
  }

  function showVideoModalDom(video) {
    const modal = document.getElementById("video-modal");
    const player = document.getElementById("video-modal-player");
    const title = document.getElementById("video-modal-title");
    const desc = document.getElementById("video-modal-desc");

    title.textContent = video.title;
    desc.textContent = video.description || "";
    player.src = video.videoUrl;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    // Never autoplay with sound — the visitor presses the native play
    // control themselves.
  }

  function hideVideoModalDom() {
    const modal = document.getElementById("video-modal");
    const player = document.getElementById("video-modal-player");
    if (modal.hidden) return;
    player.pause();
    player.removeAttribute("src");
    player.load();
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function openVideoModal(video) {
    showVideoModalDom(video);
    pushNavIfChanged("video");
  }

  function closeVideoModal() {
    // Closing always goes through history.back() so the physical/Android
    // Back button and this button can never get out of sync — the actual
    // hide happens in applyNavState → hideVideoModalDom when the pop fires.
    if (currentNavState && currentNavState.modal === "video") {
      history.back();
    } else {
      hideVideoModalDom();
    }
  }

  function wireVideoModal() {
    const modal = document.getElementById("video-modal");
    modal.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-close")) closeVideoModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeVideoModal();
    });
  }

  /* ---------- Shared gallery engine: Category → Project/Album → Media ----------
     Powers every GALLERY_SECTIONS entry (Exterior Design, Completed
     Project Photos, Completed Project Videos). Every function here takes
     only the section's stable nav id and looks up its config
     (DATA property, media field name, media type) from GALLERY_SECTIONS
     — so adding a future gallery section (Ground Breaking, Interior
     Design) means adding one data block plus one GALLERY_SECTIONS entry,
     never copying these functions again. */

  function getPublishedSorted(list) {
    return list
      .filter((item) => item.published)
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  function getGalleryCategories(sectionId) {
    const dataKey = GALLERY_SECTIONS[sectionId].dataKey;
    return getPublishedSorted(DATA[dataKey].categories);
  }

  function getGalleryCategoryById(sectionId, id) {
    const dataKey = GALLERY_SECTIONS[sectionId].dataKey;
    return DATA[dataKey].categories.find((c) => c.id === id);
  }

  // Real projects win if any exist for that category; otherwise the
  // clearly-marked sample projects are shown so the album experience can
  // still be previewed. isSample travels with each project/media item so
  // the UI knows which badge to show. For "flat" sections (no category
  // level, e.g. Ground Breaking) categoryId is always null and every
  // project counts, regardless of category.
  function getGalleryProjectsForCategory(sectionId, categoryId) {
    const config = GALLERY_SECTIONS[sectionId];
    const dataKey = config.dataKey;
    const matches = (p) => (config.flat ? true : p.categoryId === categoryId);

    const real = getPublishedSorted(DATA[dataKey].projects.filter(matches));
    if (real.length > 0) return real.map((p) => Object.assign({ isSample: false }, p));

    const sample = getPublishedSorted(DATA[dataKey].sampleProjects.filter(matches));
    return sample.map((p) => Object.assign({ isSample: true }, p));
  }

  function getGalleryProjectById(sectionId, projectId) {
    const dataKey = GALLERY_SECTIONS[sectionId].dataKey;
    const real = DATA[dataKey].projects.find((p) => p.id === projectId);
    if (real) return Object.assign({ isSample: false }, real);
    const sample = DATA[dataKey].sampleProjects.find((p) => p.id === projectId);
    return sample ? Object.assign({ isSample: true }, sample) : null;
  }

  // The project's media list lives under different field names
  // depending on the section ("photos" or "videos") — this is the only
  // place that needs to know that.
  function getGalleryMedia(sectionId, project) {
    const mediaKey = GALLERY_SECTIONS[sectionId].mediaKey;
    return getPublishedSorted(project[mediaKey] || []);
  }

  // Resolves a project/album's thumbnail from its OWN media, by
  // coverPhotoId, rather than a separately duplicated image. Falls back
  // to the first available item (e.g. if the chosen cover was later
  // unpublished/deleted), and finally to a placeholder if the album has
  // no media at all yet.
  function resolveProjectCoverImage(sectionId, project) {
    const mediaKey = GALLERY_SECTIONS[sectionId].mediaKey;
    const allMedia = project[mediaKey] || [];
    const chosen = allMedia.find((m) => m.id === project.coverPhotoId) || allMedia[0];
    if (!chosen) return null;
    /* Covers appear in grids, so prefer the thumbnail (D17). */
    return chosen.thumbnail || chosen.image || null;
  }

  // Resets a section back to its top level: the category screen for a
  // normal gallery, or straight to the project list for a "flat" one
  // like Ground Breaking (which has no category screen to return to).
  function goGalleryRoot(sectionId) {
    const flat = GALLERY_SECTIONS[sectionId].flat;
    galleryStates[sectionId] = { level: flat ? "projects" : "categories", categoryId: null, projectId: null };
    renderMain();
    scrollToMain();
    pushNavIfChanged(null);
  }

  function goGalleryProjects(sectionId, categoryId) {
    galleryStates[sectionId] = { level: "projects", categoryId: categoryId, projectId: null };
    renderMain();
    scrollToMain();
    pushNavIfChanged(null);
  }

  function goGalleryMedia(sectionId, categoryId, projectId) {
    galleryStates[sectionId] = { level: "media", categoryId: categoryId, projectId: projectId };
    renderMain();
    scrollToMain();
    pushNavIfChanged(null);
  }

  function buildGalleryBreadcrumb(sectionId) {
    const state = getGalleryState(sectionId);
    const sectionLabel = getNavLabel(sectionId);
    const nav = el("nav", "breadcrumb", "");
    nav.setAttribute("aria-label", `${sectionLabel} location`);

    const root = el("button", "breadcrumb__item", sectionLabel);
    root.type = "button";
    const rootLevel = GALLERY_SECTIONS[sectionId].flat ? "projects" : "categories";
    if (state.level === rootLevel) root.setAttribute("aria-current", "true");
    root.addEventListener("click", () => goGalleryRoot(sectionId));
    nav.appendChild(root);

    if (state.categoryId) {
      const category = getGalleryCategoryById(sectionId, state.categoryId);
      nav.appendChild(el("span", "breadcrumb__sep", "/"));
      const catCrumb = el("button", "breadcrumb__item", category ? category.name : "");
      catCrumb.type = "button";
      if (state.level === "projects") catCrumb.setAttribute("aria-current", "true");
      catCrumb.addEventListener("click", () => goGalleryProjects(sectionId, state.categoryId));
      nav.appendChild(catCrumb);
    }

    if (state.projectId) {
      const project = getGalleryProjectById(sectionId, state.projectId);
      nav.appendChild(el("span", "breadcrumb__sep", "/"));
      const projCrumb = el("span", "breadcrumb__item breadcrumb__item--current", project ? project.name : "");
      projCrumb.setAttribute("aria-current", "true");
      nav.appendChild(projCrumb);
    }

    return nav;
  }

  function buildBackLink(text, onClick) {
    const back = el("button", "back-link", `<span aria-hidden="true">&larr;</span> ${text}`);
    back.type = "button";
    back.addEventListener("click", onClick);
    return back;
  }

  function buildGalleryPanel(sectionId) {
    const state = getGalleryState(sectionId);
    const wrap = el("div");
    wrap.appendChild(buildGalleryBreadcrumb(sectionId));

    if (state.level === "categories") wrap.appendChild(buildGalleryCategoryScreen(sectionId));
    else if (state.level === "projects") wrap.appendChild(buildGalleryProjectsScreen(sectionId));
    else wrap.appendChild(buildGalleryMediaScreen(sectionId));

    return wrap;
  }

  function buildGalleryCategoryScreen(sectionId) {
    const panel = el("section", "panel");
    const categories = getGalleryCategories(sectionId);

    const cards = categories
      .map((cat) => {
        const projects = getGalleryProjectsForCategory(sectionId, cat.id);
        const projectCount = projects.length;
        const isSample = projects.some((p) => p.isSample);
        const countLabel =
          projectCount === 0
            ? "Projects coming soon"
            : `${projectCount} project${projectCount === 1 ? "" : "s"}${isSample ? " (sample)" : ""}`;
        return `
          <button type="button" class="album-card" data-category="${cat.id}">
            <span class="album-card__thumb"><img src="${safeUrl(cat.coverImage)}" alt="" /></span>
            <span class="album-card__body">
              <span class="album-card__name">${esc(cat.name)}</span>
              <span class="album-card__meta">${countLabel}</span>
            </span>
          </button>
        `;
      })
      .join("");

    panel.innerHTML = `
      <h2 class="panel__title">${getNavLabel(sectionId)}</h2>
      <div class="album-grid">${cards}</div>
    `;

    panel.querySelectorAll("[data-category]").forEach((btn) => {
      btn.addEventListener("click", () => goGalleryProjects(sectionId, btn.getAttribute("data-category")));
    });

    return panel;
  }

  function buildGalleryProjectsScreen(sectionId) {
    const config = GALLERY_SECTIONS[sectionId];
    const state = getGalleryState(sectionId);
    const mediaNoun = config.mediaNoun;
    const emptyProjectsTitle = config.emptyProjectsTitle;
    const category = config.flat ? null : getGalleryCategoryById(sectionId, state.categoryId);
    const projects = getGalleryProjectsForCategory(sectionId, state.categoryId);
    const panel = el("section", "panel");
    const heading = config.flat ? getNavLabel(sectionId) : `${category ? category.name : ""} Projects`;

    // A "flat" section (Ground Breaking) has no category screen above
    // this one, so there's nothing to show a back link to.
    const backRow = el("div", "back-row");
    if (!config.flat) {
      backRow.appendChild(buildBackLink(getNavLabel(sectionId), () => history.back()));
    }

    if (projects.length === 0) {
      panel.innerHTML = `
        <h2 class="panel__title">${heading}</h2>
        <h3 class="empty-state__title">${emptyProjectsTitle}</h3>
        <p class="empty-state__body">Projects will appear here when they are published.</p>
      `;
      if (!config.flat) panel.insertBefore(backRow, panel.firstChild);
      return panel;
    }

    const isSample = projects[0].isSample;
    const cards = projects
      .map((p) => {
        const mediaCount = getGalleryMedia(sectionId, p).length;
        const coverSrc = resolveProjectCoverImage(sectionId, p);
        const thumb = coverSrc
          ? `<img src="${safeUrl(coverSrc)}" alt="" />`
          : `<span class="album-card__thumb--empty" aria-hidden="true">${ICONS[GALLERY_SECTIONS[sectionId].mediaType === "videos" ? "film" : "image"] || ""}</span>`;
        return `
          <button type="button" class="album-card" data-project="${p.id}">
            ${isSample ? '<span class="sample-badge sample-badge--card">SAMPLE — PROTOTYPE</span>' : ""}
            <span class="album-card__thumb">${thumb}</span>
            <span class="album-card__body">
              <span class="album-card__name">${esc(p.name)}</span>
              ${p.description ? `<span class="album-card__desc">${esc(p.description)}</span>` : ""}
              <span class="album-card__meta">${mediaCount} ${mediaNoun}${mediaCount === 1 ? "" : "s"}</span>
            </span>
          </button>
        `;
      })
      .join("");

    panel.innerHTML = `
      <h2 class="panel__title">${heading}</h2>
      <div class="album-grid">${cards}</div>
    `;
    if (!config.flat) panel.insertBefore(backRow, panel.firstChild);

    panel.querySelectorAll("[data-project]").forEach((btn) => {
      btn.addEventListener("click", () =>
        goGalleryMedia(sectionId, state.categoryId, btn.getAttribute("data-project"))
      );
    });

    return panel;
  }

  function buildGalleryMediaScreen(sectionId) {
    const config = GALLERY_SECTIONS[sectionId];
    const state = getGalleryState(sectionId);
    const mediaType = config.mediaType;
    const category = config.flat ? null : getGalleryCategoryById(sectionId, state.categoryId);
    const project = getGalleryProjectById(sectionId, state.projectId);
    const panel = el("section", "panel");

    const backLabel = config.flat ? getNavLabel(sectionId) : `${category ? category.name : ""} Projects`;
    const backRow = el("div", "back-row");
    backRow.appendChild(
      buildBackLink(backLabel, () => history.back())
    );
    panel.appendChild(backRow);

    if (!project) {
      panel.appendChild(el("h2", "panel__title", "Project not found"));
      return panel;
    }

    const titleRow = el("div", "panel__title-row");
    titleRow.innerHTML = `<h2 class="panel__title">${esc(project.name)}</h2>` +
      (project.isSample ? '<span class="sample-badge">SAMPLE — PROTOTYPE</span>' : "");
    panel.appendChild(titleRow);

    if (project.description) {
      panel.appendChild(el("p", "panel__body-text", project.description));
    }

    const media = getGalleryMedia(sectionId, project);

    if (media.length === 0) {
      const emptyText = mediaType === "videos" ? "No videos in this project yet." : "No photos in this project yet.";
      panel.appendChild(el("h3", "empty-state__title", emptyText));
      panel.appendChild(el("p", "empty-state__body", "Media for this project will appear here when it is published."));
      return panel;
    }

    if (mediaType === "videos") {
      const grid = el("div", "video-grid");
      media.forEach((video) => {
        grid.appendChild(buildVideoCard(video, project.isSample, "SAMPLE — PROTOTYPE"));
      });
      panel.appendChild(grid);
    } else {
      const crumbLabel = [getNavLabel(sectionId), category ? category.name : null, project.name]
        .filter(Boolean)
        .join(" › ");
      const grid = el("div", "photo-grid");
      media.forEach((photo, index) => {
        const thumb = el(
          "button",
          "photo-thumb",
          /* Grid tiles use the 600px thumbnail (D17/D15). Fetching HD
             originals here would cost ~180MB per category page, since
             private buckets get no CDN caching. */
          `<img src="${safeUrl(photo.thumbnail || photo.image)}" alt="${esc(photo.caption || "")}" loading="lazy" />` +
            (project.isSample ? '<span class="sample-badge sample-badge--thumb">SAMPLE</span>' : "")
        );
        thumb.type = "button";
        thumb.setAttribute("aria-label", `Open photo ${index + 1} of ${media.length}`);
        thumb.addEventListener("click", () => openPhotoModal(media, index, project.isSample, crumbLabel));
        grid.appendChild(thumb);
      });
      panel.appendChild(grid);
    }

    return panel;
  }

  /* ---------- Photo viewer (lightbox) ---------- */

  let photoModalState = { photos: [], index: 0, isSample: false, crumbLabel: "" };

  function renderPhotoModal() {
    const { photos, index, isSample, crumbLabel } = photoModalState;
    const photo = photos[index];
    const img = document.getElementById("photo-modal-img");
    const caption = document.getElementById("photo-modal-caption");
    const counter = document.getElementById("photo-modal-counter");
    const crumb = document.getElementById("photo-modal-crumb");
    const badge = document.getElementById("photo-modal-sample-badge");

    /* Viewer uses the 2048px display copy, not the HD original (D17). */
    img.src = photo.display || photo.image;
    img.alt = photo.caption || "";
    caption.textContent = photo.caption || "";
    caption.hidden = !photo.caption;
    counter.textContent = `Photo ${index + 1} / ${photos.length}`;
    crumb.textContent = crumbLabel || "";
    crumb.hidden = !crumbLabel;
    badge.hidden = !isSample;

    const multi = photos.length > 1;
    document.getElementById("photo-modal-prev").hidden = !multi;
    document.getElementById("photo-modal-next").hidden = !multi;
  }

  function showPhotoModalDom() {
    renderPhotoModal();
    const modal = document.getElementById("photo-modal");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function hidePhotoModalDom() {
    const modal = document.getElementById("photo-modal");
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function openPhotoModal(photos, index, isSample, crumbLabel) {
    photoModalState = { photos, index, isSample: !!isSample, crumbLabel: crumbLabel || "" };
    showPhotoModalDom();
    pushNavIfChanged("photo");
  }

  function closePhotoModal() {
    if (currentNavState && currentNavState.modal === "photo") {
      history.back();
    } else {
      hidePhotoModalDom();
    }
  }

  function stepPhotoModal(direction) {
    const total = photoModalState.photos.length;
    if (total === 0) return;
    photoModalState.index = (photoModalState.index + direction + total) % total;
    renderPhotoModal();
  }

  // Swipe-left-to-go-back on gallery hierarchy screens (category/album/
  // media grids) — completely separate from the photo viewer's own
  // swipe (which moves Previous/Next). This listens on #main-content,
  // which sits behind the photo/video/chat overlays, so it's never
  // active while one of those is open — no gesture conflict.
  function wireGallerySwipeBack() {
    const main = document.getElementById("main-content");
    let startX = null;
    let startY = null;

    main.addEventListener("touchstart", (e) => {
      if (!GALLERY_SECTIONS[activeSection]) return;
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    });

    main.addEventListener("touchend", (e) => {
      if (startX === null || !GALLERY_SECTIONS[activeSection]) {
        startX = null;
        return;
      }
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      startX = null;
      // Mostly-horizontal, clearly leftward, and long enough to be an
      // intentional gesture rather than a vertical scroll.
      if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        history.back();
      }
    });
  }

  function wirePhotoModal() {
    const modal = document.getElementById("photo-modal");
    modal.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-close")) closePhotoModal();
    });
    document.getElementById("photo-modal-prev").addEventListener("click", () => stepPhotoModal(-1));
    document.getElementById("photo-modal-next").addEventListener("click", () => stepPhotoModal(1));

    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") closePhotoModal();
      if (e.key === "ArrowLeft") stepPhotoModal(-1);
      if (e.key === "ArrowRight") stepPhotoModal(1);
    });

    // Simple touch swipe for mobile.
    let touchStartX = null;
    const viewer = document.getElementById("photo-modal-viewer");
    viewer.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
    });
    viewer.addEventListener("touchend", (e) => {
      if (touchStartX === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 40) stepPhotoModal(deltaX > 0 ? -1 : 1);
      touchStartX = null;
    });
  }

  function buildComingSoonPanel(label) {
    const panel = el("section", "panel coming-soon");
    panel.innerHTML = `
      <span class="coming-soon__badge">Coming in a later phase</span>
      <h2 class="coming-soon__title">${label}</h2>
      <p class="coming-soon__body">This section is part of the plan and will be built in an upcoming phase. For now it's here so you can see how the finished navigation will feel.</p>
    `;
    return panel;
  }

  /* ---------- Action buttons + floating button + toast ---------- */

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("toast--visible"), 3200);
  }
  // Shared with js/auth.js so login/logout messages use the same toast style.
  window.LLCShowToast = showToast;

  function wireActions() {
    const c = DATA.company;

    // Message and the floating Chat button both open the SAME
    // conversation — see js/chat-service.js. Neither ever creates a new
    // conversation; both just open openChatModal().
    document.getElementById("btn-message").addEventListener("click", openChatModal);
    document.getElementById("float-message").addEventListener("click", openChatModal);

    document.getElementById("btn-call").addEventListener("click", () => {
      if (c.mobile) {
        window.location.href = `tel:${c.mobile.replace(/\s+/g, "")}`;
      } else {
        showToast("Mobile number coming soon.");
      }
    });
    document.getElementById("btn-projects").addEventListener("click", () => {
      selectSection("completed-project-photos");
    });
  }

  /* ---------- Client conversation (Message / floating Chat / hours-row Chat) ---------- */
  // All three entry points call this same function, which always opens
  // the one conversation belonging to the current client — see
  // js/chat-service.js for why there is never more than one.

  function formatMessageTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function renderChatMessages() {
    const user = window.AuthService.getCurrentUserSync();
    const list = document.getElementById("chat-modal-messages");
    if (!user) {
      list.innerHTML = "";
      return;
    }

    /* Was a synchronous getConversation(user.clientId). The conversation
       now lives in the database, so the service caches it and this reads
       the cache; loading and Realtime updates both call back into here. */
    const conversation = window.ChatService.getCachedConversation();
    list.innerHTML = "";

    if (!conversation) {
      list.innerHTML = `<p class="chat-empty">Loading your conversation…</p>`;
      return;
    }

    if (conversation.messages.length === 0) {
      list.innerHTML = `<p class="chat-empty">Start a conversation with Luigi Lindell Construction.</p>`;
      return;
    }

    conversation.messages.forEach((msg) => {
      const row = el(
        "div",
        "chat-message " + (msg.senderRole === "client" ? "chat-message--client" : "chat-message--admin")
      );
      /* XSS FIX. Was: row.innerHTML = `...${msg.messageText}...`
         Message text is DATA, never markup. .textContent cannot execute
         anything, ever — the same pattern admin.js already uses. */
      const textEl = document.createElement("p");
      textEl.className = "chat-message__text";
      textEl.textContent = msg.messageText || "";

      const timeEl = document.createElement("p");
      timeEl.className = "chat-message__time";
      timeEl.textContent = formatMessageTime(msg.timestamp);

      row.textContent = "";
      if (msg.messageText) row.appendChild(textEl);

      /* Photo attachment (D8). src is set as a property, never
         interpolated into an HTML string. */
      if (msg.attachmentUrl) {
        const img = document.createElement("img");
        img.className = "chat-message__photo";
        img.alt = msg.attachmentCaption || "Photo";
        img.loading = "lazy";
        img.src = msg.attachmentUrl;
        row.appendChild(img);
      }

      /* Staff attribution — the real name recorded at send time, never
         a fixed "Admin" label. */
      if (msg.senderRole !== "client" && msg.senderName) {
        const who = document.createElement("p");
        who.className = "chat-message__sender";
        who.textContent = msg.senderRoleLabel
          ? msg.senderName + " · " + msg.senderRoleLabel
          : msg.senderName;
        row.insertBefore(who, row.firstChild);
      }

      row.appendChild(timeEl);
      list.appendChild(row);
    });

    list.scrollTop = list.scrollHeight;
  }

  function showChatModalDom() {
    const modal = document.getElementById("chat-modal");
    renderChatMessages();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("chat-input").focus();

    /* Load the thread, then subscribe so staff replies arrive without a
       refresh. Subscribing needs the conversation id, so it happens
       after the load resolves. */
    window.ChatService.loadConversation()
      .then(() => {
        renderChatMessages();
        window.ChatService.subscribeToMessages(renderChatMessages);
        return window.ChatService.markRead();
      })
      .catch((err) => {
        const list = document.getElementById("chat-modal-messages");
        list.innerHTML = "";
        const p = document.createElement("p");
        p.className = "chat-empty";
        p.textContent = "We couldn't load your messages. Please try again.";
        list.appendChild(p);
        console.error(err);
      });
  }

  function hideChatModalDom() {
    const modal = document.getElementById("chat-modal");
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function openChatModal() {
    showChatModalDom();
    pushNavIfChanged("chat");
  }

  function closeChatModal() {
    if (currentNavState && currentNavState.modal === "chat") {
      history.back();
    } else {
      hideChatModalDom();
    }
  }

  function wireChatModal() {
    const modal = document.getElementById("chat-modal");
    modal.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-close")) closeChatModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeChatModal();
    });
    /* ---- Photo attachment (D8) ----
       New capability: Phase 1-9 had no upload of any kind. Photos only —
       client chat video is not supported (D17). HEIC is converted and
       the image optimised on the device before it is sent (D16/D17). */
    let pendingPhoto = null;

    const photoInput = document.getElementById("chat-photo-input");
    const photoBtn = document.getElementById("btn-chat-photo");
    const preview = document.getElementById("chat-attach-preview");
    const previewImg = document.getElementById("chat-attach-thumb");
    const previewName = document.getElementById("chat-attach-name");
    const removeBtn = document.getElementById("chat-attach-remove");
    const status = document.getElementById("chat-attach-status");

    function setStatus(message) {
      if (!status) return;
      status.textContent = message || "";
      status.hidden = !message;
    }

    function clearPending() {
      pendingPhoto = null;
      if (photoInput) photoInput.value = "";
      if (preview) preview.hidden = true;
      if (previewImg && previewImg.src.startsWith("blob:")) {
        URL.revokeObjectURL(previewImg.src);
      }
      setStatus("");
    }

    if (photoBtn && photoInput) {
      photoBtn.addEventListener("click", () => photoInput.click());
      photoInput.addEventListener("change", () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;
        if (!window.LLCMedia.isSupportedChatImage(file)) {
          setStatus("Please choose a photo. Videos can't be sent in chat.");
          photoInput.value = "";
          return;
        }
        pendingPhoto = file;
        if (preview && previewImg && previewName) {
          previewImg.src = URL.createObjectURL(file);
          previewName.textContent = file.name;
          preview.hidden = false;
        }
        setStatus("");
      });
    }

    if (removeBtn) removeBtn.addEventListener("click", clearPending);

    document.getElementById("form-chat").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-input");
      const text = input.value.trim();
      if (!text && !pendingPhoto) return;

      const user = window.AuthService.getCurrentUserSync();
      if (!user) return;

      const submitBtn = e.target.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      const photo = pendingPhoto;
      const body = text;
      input.value = "";
      clearPending();

      const work = photo
        ? window.ChatService.sendPhoto(photo, (pct) =>
            setStatus(pct < 100 ? `Sending photo… ${pct}%` : "Finishing…"))
            .then(() => (body ? window.ChatService.sendMessage(body) : null))
        : window.ChatService.sendMessage(body);

      work
        .then(() => {
          setStatus("");
          renderChatMessages();
        })
        .catch((err) => {
          setStatus("That didn't send. Please try again.");
          input.value = body;
          console.error(err);
        })
        .then(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---------- App shell: shown only once a client is logged in ---------- */
  // window.AuthService.onAuthStateChanged (in auth.js) calls showApp/hideApp
  // whenever login state changes. The site is never rendered or revealed
  // before a successful login — there is no "browse as guest" path.

  let appInitialized = false;

  function showApp() {
    document.getElementById("app-shell").hidden = false;

    if (!appInitialized) {
      renderHeader();
      renderNav();
      renderMain();
      wireActions();
      wireVideoModal();
      wirePhotoModal();
      wireGallerySwipeBack();
      wireChatModal();
      wireDescriptionToggle();
      appInitialized = true;
    } else {
      // Returning after a logout/login within the same visit — start
      // back at a clean, predictable section.
      activeSection = "about";
      renderNav();
      renderMain();
    }
  }

  function hideApp() {
    const shell = document.getElementById("app-shell");
    if (shell) shell.hidden = true;
  }

  window.LLCApp = { showApp: showApp, hideApp: hideApp };
})();
