/* =====================================================================
   db-service.js — replaces data.js
   =====================================================================
   Loads all public content from Supabase and assembles it into
   window.SITE_DATA in EXACTLY the shape data.js used.

   WHY THE SHAPE IS PRESERVED
   app.js line 13 is:   const DATA = window.SITE_DATA;
   captured at parse time. Keeping the shape identical means
   buildGalleryPanel, renderNav, the photo lightbox, the business-hours
   logic and the back-button router all keep working untouched.

   WHAT CHANGES INSIDE THE SHAPE
     - photo.image     -> the DISPLAY copy
     - photo.thumbnail -> the 600px grid copy
     - photo.original  -> the untouched HD original, never auto-fetched
     - sampleProjects / sampleItems come back EMPTY (D12)

   The HD original is preserved and never compressed (D17). It is
   simply not what the browser reaches for while someone scrolls.

   Content queries require an authenticated session. Everything is
   behind the login gate (D2).
   ===================================================================== */
(function () {
  "use strict";

  var sb = window.LLCSupabase;

  if (!sb || !sb.client) {
    console.error("supabase-client.js must load first");
    return;
  }

  var client = sb.client;

  var DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  /* app.js matches business hours against English day names produced by
     Intl.DateTimeFormat. The database stores 0-6 because the string
     comparison is locale-fragile, so it is converted back here. */
  function dayName(n) {
    return DAY_NAMES[n] || "Sunday";
  }

  function hhmm(t) {
    if (!t) return null;
    var m = String(t).match(/^(\d{2}):(\d{2})/);
    return m ? m[1] + ":" + m[2] : null;
  }

  /* Maps a gallery section_key to the SITE_DATA key app.js expects. */
  var SECTION_TO_DATA_KEY = {
    "completed-project-photos": "completedProjectPhotos",
    "completed-project-videos": "completedProjectVideos",
    "ground-breaking": "groundBreaking",
    "exterior-design": "exteriorDesign",
    "interior-design": "interiorDesign"
  };

  function emptyGalleryBlock() {
    return {
      categories: [],
      projects: [],
      sampleProjects: []
    };
  }

  /* -------------------------------------------------------------------
     SIGNED STORAGE URLS

     signed-urls.js is no longer used. The Supabase client already has
     authenticated access to Storage, so signing is performed directly
     through client.storage.createSignedUrls().

     The result is converted into the same lookup shape the old signer
     returned:
       {
         "path/to/file.jpg": "https://...signed-url..."
       }
     ------------------------------------------------------------------- */
  function signMany(bucket, paths) {
    var unique = [];

    (paths || []).forEach(function (path) {
      if (path && unique.indexOf(path) === -1) {
        unique.push(path);
      }
    });

    if (!unique.length) {
      return Promise.resolve({});
    }

    return client.storage
      .from(bucket)
      .createSignedUrls(unique, 3600)
      .then(function (res) {
        if (res.error) throw res.error;

        var map = {};

        (res.data || []).forEach(function (item) {
          if (item && item.path && item.signedUrl) {
            map[item.path] = item.signedUrl;
          }
        });

        return map;
      });
  }

  function load() {
    var data = {
      company: {},
      nav: [],
      reviews: {
        recommendPercent: 100,
        items: [],
        sampleItems: []
      },
      videoTestimonials: {
        items: [],
        sampleItems: []
      },
      completedProjectPhotos: emptyGalleryBlock(),
      completedProjectVideos: emptyGalleryBlock(),
      groundBreaking: emptyGalleryBlock(),
      exteriorDesign: emptyGalleryBlock(),
      interiorDesign: emptyGalleryBlock()
    };

    return Promise.all([
      client.from("company_profile").select("*").maybeSingle(),
      client.from("business_hours").select("*").order("day_of_week"),
      client
        .from("client_nav_items")
        .select("*")
        .eq("visible", true)
        .order("sort_order"),
      client
        .from("reviews")
        .select("*")
        .eq("published", true)
        .order("sort_order"),
      client
        .from("testimonial_videos")
        .select("*")
        .eq("published", true)
        .order("sort_order"),
      client.from("gallery_sections").select("*").order("sort_order"),
      client
        .from("gallery_categories")
        .select("*")
        .eq("published", true)
        .order("sort_order"),
      client
        .from("gallery_projects")
        .select("*")
        .eq("published", true)
        .order("sort_order"),
      client
        .from("gallery_media")
        .select("*")
        .eq("published", true)
        .order("sort_order")
    ]).then(function (r) {
      var company = r[0].data || {};
      var hours = r[1].data || [];
      var nav = r[2].data || [];
      var reviews = r[3].data || [];
      var testimonials = r[4].data || [];
      var sections = r[5].data || [];
      var categories = r[6].data || [];
      var projects = r[7].data || [];
      var media = r[8].data || [];

      /* ---------- Collect every storage path, then sign in batches
                    rather than one request per image. ---------- */
      var galleryPaths = [];

      media.forEach(function (m) {
        if (m.thumbnail_path) {
          galleryPaths.push(m.thumbnail_path);
        }

        if (m.display_path) {
          galleryPaths.push(m.display_path);
        }

        /* The HD original is deliberately NOT signed here. It is only
           fetched if something explicitly asks for it. */
        if (m.media_type === "video" && m.storage_path) {
          galleryPaths.push(m.storage_path);
        }
      });

      categories.forEach(function (c) {
        if (c.cover_image_path) {
          galleryPaths.push(c.cover_image_path);
        }
      });

      var companyPaths = [
        company.cover_image_path,
        company.profile_image_path
      ].filter(Boolean);

      var reviewPaths = reviews
        .map(function (x) {
          return x.customer_photo_path;
        })
        .filter(Boolean);

      var testimonialPaths = [];

      testimonials.forEach(function (t) {
        if (t.video_path) {
          testimonialPaths.push(t.video_path);
        }

        if (t.thumbnail_path) {
          testimonialPaths.push(t.thumbnail_path);
        }
      });

      return Promise.all([
        signMany("gallery-media", galleryPaths),
        signMany("company-assets", companyPaths),
        signMany("review-photos", reviewPaths),
        signMany("testimonial-videos", testimonialPaths)
      ]).then(function (signed) {
        var g = signed[0];
        var co = signed[1];
        var rp = signed[2];
        var tv = signed[3];

        /* ---------- company ---------- */
        data.company = {
          name: company.name || "",
          description: company.description || "",
          location: company.location || "",
          mobile: company.mobile || "",
          coverImage: co[company.cover_image_path] || null,
          profileImage: co[company.profile_image_path] || null,
          hours: {
            timezone: "Asia/Manila",
            schedule: hours.map(function (h) {
              return {
                day: dayName(h.day_of_week),
                open: hhmm(h.open_time),
                close: hhmm(h.close_time),
                chatAvailable: h.chat_available !== false
              };
            })
          }
        };

        /* ---------- nav ---------- */
        data.nav = nav.map(function (n) {
          return {
            id: n.nav_key,
            label: n.label,
            icon: n.icon,
            status: n.status
          };
        });

        /* ---------- reviews ---------- */
        data.reviews = {
          recommendPercent:
            company.recommend_percent != null
              ? company.recommend_percent
              : 100,

          items: reviews.map(function (x) {
            return {
              id: x.id,
              customerName: x.customer_name,
              customerPhoto: rp[x.customer_photo_path] || null,
              text: x.review_text,
              date: x.date_label,
              project: x.project_label,
              location: x.location,
              video: x.testimonial_video_id,
              published: true,
              order: x.sort_order
            };
          }),

          sampleItems: []
        };

        /* ---------- testimonial videos (flat, never a gallery) ------- */
        data.videoTestimonials = {
          items: testimonials.map(function (t) {
            return {
              id: t.id,
              title: t.title,
              description: t.description,
              thumbnail: tv[t.thumbnail_path] || null,
              videoUrl: tv[t.video_path] || null,
              customerName: t.customer_name,
              project: t.project_label,
              date: t.date_label,
              published: true,
              order: t.sort_order
            };
          }),

          sampleItems: []
        };

        /* ---------- galleries ---------- */
        var mediaByProject = {};

        media.forEach(function (m) {
          (mediaByProject[m.project_id] =
            mediaByProject[m.project_id] || []).push(m);
        });

        var projectsByCategory = {};

        projects.forEach(function (p) {
          (projectsByCategory[p.category_id] =
            projectsByCategory[p.category_id] || []).push(p);
        });

        var categoriesBySection = {};

        categories.forEach(function (c) {
          (categoriesBySection[c.section_id] =
            categoriesBySection[c.section_id] || []).push(c);
        });

        sections.forEach(function (section) {
          var dataKey = SECTION_TO_DATA_KEY[section.section_key];

          if (!dataKey) {
            return;
          }

          var isVideoSection = section.media_type === "videos";
          var cats = categoriesBySection[section.id] || [];

          var block = {
            categories: cats.map(function (c) {
              return {
                id: c.id,
                slug: c.slug,
                name: c.name,
                coverImage: g[c.cover_image_path] || null,
                published: true,
                order: c.sort_order
              };
            }),

            projects: [],
            sampleProjects: []
          };

          cats.forEach(function (c) {
            (projectsByCategory[c.id] || []).forEach(function (p) {
              var items = (mediaByProject[p.id] || []).map(function (m) {
                if (isVideoSection || m.media_type === "video") {
                  return {
                    id: m.id,
                    title: m.title,
                    description: m.caption,
                    thumbnail: g[m.thumbnail_path] || null,
                    videoUrl: g[m.storage_path] || null,
                    date: m.date_taken,
                    order: m.sort_order,
                    published: true
                  };
                }

                return {
                  id: m.id,

                  /* image = DISPLAY copy. The grid uses .thumbnail and
                     the viewer uses .display; .image stays as an alias
                     so nothing else breaks. */
                  image:
                    g[m.display_path] ||
                    g[m.thumbnail_path] ||
                    null,

                  display: g[m.display_path] || null,
                  thumbnail: g[m.thumbnail_path] || null,

                  /* HD original path is retained but NOT signed during
                     normal browsing. */
                  originalPath: m.storage_path,

                  caption: m.caption,
                  order: m.sort_order,
                  published: true
                };
              });

              var entry = {
                id: p.id,
                categoryId: p.category_id,
                name: p.name,
                description: p.description,
                coverPhotoId: p.cover_media_id,
                published: true,
                order: p.sort_order
              };

              entry[isVideoSection ? "videos" : "photos"] = items;
              block.projects.push(entry);
            });
          });

          data[dataKey] = block;
        });

        window.SITE_DATA = data;
        return data;
      });
    });
  }

  /* Fetches a signed URL for the untouched HD original. Called only
     when something explicitly asks for full quality — never during
     normal browsing. */
  function getOriginal(path) {
    if (!path) {
      return Promise.reject(new Error("Original path is required"));
    }

    return client.storage
      .from("gallery-media")
      .createSignedUrl(path, 3600)
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data && res.data.signedUrl
          ? res.data.signedUrl
          : null;
      });
  }

  window.LLCDataService = {
    load: load,
    getOriginal: getOriginal
  };
})();
