/* =====================================================================
   media-pipeline.js — HEIC conversion, optimization, uploads
   =====================================================================
   Implements D16 and D17.

   THREE SEPARATE FUNCTIONS, NEVER ONE WITH A ROLE FLAG
   ----------------------------------------------------
     uploadBusinessMedia()       gallery-media, testimonial-videos
                                 HD ORIGINAL PRESERVED + display + thumb
                                 videos never re-encoded
     uploadCommunicationMedia()  chat-attachments
                                 optimized, images only
     uploadDisplayAsset()        review-photos, company-assets
                                 sized to display dimensions

   Each targets ONE bucket and carries ONE profile. There is no shared
   "compress this" step with an if (role === 'admin') branch that could
   be inverted, so business media cannot travel the reduction path and
   client media cannot reach the HD path. A client also physically
   cannot write to a business bucket — the storage policy denies it.

   D16 — HEIC is converted to JPEG ON THE USER'S DEVICE. The library is
         loaded ONLY when a HEIC file is actually chosen, so ordinary
         visitors never download it.
   ===================================================================== */
(function () {
  "use strict";

  var sb = window.LLCSupabase;
  if (!sb) {
    console.error("supabase-client.js must load before media-pipeline.js");
    return;
  }
  var client = sb.client;

  /* ---------- Profiles (D17). One place to adjust. ---------- */
  var PROFILE = {
    galleryDisplay:  { maxEdge: 2048, quality: 0.85 },
    galleryThumb:    { maxEdge: 600,  quality: 0.80 },
    chatPhoto:       { maxEdge: 1600, quality: 0.80 },
    reviewPhoto:     { maxEdge: 500,  quality: 0.85 },
    companyCover:    { maxEdge: 2400, quality: 0.85 },
    companyLogo:     { maxEdge: 512,  quality: 0.90 }
  };

  var CHAT_MAX_BYTES = 10 * 1024 * 1024;      // matches the DB constraint
  var HEIC_LIB = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function isHeic(file) {
    return /image\/heic|image\/heif/i.test(file.type || "") ||
           /\.(heic|heif)$/i.test(file.name || "");
  }

  function isVideo(file) {
    return /^video\//i.test(file.type || "") ||
           /\.(mp4|mov|webm)$/i.test(file.name || "");
  }

  /* Loads the HEIC converter on demand (D16).
     Roughly 1 MB — real weight on Philippine mobile data — so it is
     never fetched unless someone actually picks a HEIC file. */
  var heicLoading = null;
  function loadHeicLibrary() {
    if (window.heic2any) return Promise.resolve(window.heic2any);
    if (heicLoading) return heicLoading;

    heicLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = HEIC_LIB;
      s.onload = function () { resolve(window.heic2any); };
      s.onerror = function () { reject(new Error("HEIC library failed to load")); };
      document.head.appendChild(s);
    });
    return heicLoading;
  }

  /* HEIC -> JPEG. Quality 1.0 for business media so nothing is lost
     before the HD original is stored. */
  function convertHeic(file, quality) {
    return loadHeicLibrary().then(function (heic2any) {
      return heic2any({ blob: file, toType: "image/jpeg", quality: quality });
    }).then(function (out) {
      var blob = Array.isArray(out) ? out[0] : out;
      return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"),
                      { type: "image/jpeg" });
    });
  }

  /* Reads a file into an <img>, applying EXIF orientation.

     ⚠️ createImageBitmap with imageOrientation:"from-image" is what
     stops portrait photos arriving rotated 90 degrees. iPhones store
     the image sideways with a "rotate this" instruction in the
     metadata; resize naively and strip the metadata, and every
     portrait photo comes out on its side. This is the single most
     common way image pipelines break, and it looks like a serious bug
     when it is one missing option. */
  function loadBitmap(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(function () { return loadViaImgTag(file); });
    }
    return loadViaImgTag(file);
  }

  function loadViaImgTag(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
      img.src = url;
    });
  }

  /* Resize + re-encode to JPEG. Re-encoding also drops all metadata,
     which removes GPS coordinates — a client photographing their lot
     embeds its exact location, and that should not travel with the
     file. HD business originals are uploaded untouched and therefore
     KEEP their EXIF, which is usually wanted for project records. */
  function resizeToJpeg(source, profile) {
    var w = source.width, h = source.height;
    var scale = Math.min(1, profile.maxEdge / Math.max(w, h));
    var tw = Math.round(w * scale), th = Math.round(h * scale);

    var canvas = document.createElement("canvas");
    canvas.width = tw; canvas.height = th;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, tw, th);

    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error("Image processing failed"));
        resolve(blob);
      }, "image/jpeg", profile.quality);
    });
  }

  function upload(bucket, path, blob, contentType) {
    return client.storage.from(bucket).upload(path, blob, {
      contentType: contentType || "image/jpeg",
      upsert: false            // never overwrite; a new photo is a new file
    }).then(function (res) {
      if (res.error) throw res.error;
      return path;
    });
  }

  /* Grabs a poster frame from a video for use as a thumbnail. The
     video itself is NEVER re-encoded (D17). */
  function videoPoster(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      var done = function (blob) { URL.revokeObjectURL(url); resolve(blob); };

      video.onloadeddata = function () {
        try { video.currentTime = Math.min(1, (video.duration || 2) / 4); }
        catch (e) { done(null); }
      };
      video.onseeked = function () {
        try {
          var canvas = document.createElement("canvas");
          var scale = Math.min(1, 600 / Math.max(video.videoWidth, video.videoHeight));
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (b) { done(b); }, "image/jpeg", 0.8);
        } catch (e) { done(null); }
      };
      video.onerror = function () { done(null); };
      video.src = url;
    });
  }

  var Media = {

    /* =================================================================
       BUSINESS MEDIA — HD PRESERVED (D17)
       =================================================================
       Photos: the original is uploaded UNTOUCHED, then a display copy
       and a thumbnail are generated alongside it. The original is never
       compressed and never discarded.

       Videos: uploaded untouched. No browser compression, ever — it is
       slow, unreliable, and would destroy quality you paid to capture.
       ================================================================= */
    uploadBusinessMedia: function (file, projectId, onProgress) {
      var report = onProgress || function () {};
      var id = uuid();
      var bucket = "gallery-media";
      var base = projectId + "/" + id;

      if (isVideo(file)) {
        report("Uploading video…");
        return upload(bucket, base + fileExt(file), file, file.type)
          .then(function (videoPath) {
            report("Creating thumbnail…");
            return videoPoster(file).then(function (poster) {
              if (!poster) {
                return { bucket: bucket, storagePath: videoPath,
                         displayPath: null, thumbnailPath: null,
                         mediaType: "video", sizeBytes: file.size };
              }
              return upload(bucket, base + ".thumb.jpg", poster)
                .then(function (thumbPath) {
                  return { bucket: bucket, storagePath: videoPath,
                           displayPath: null, thumbnailPath: thumbPath,
                           mediaType: "video", sizeBytes: file.size };
                });
            });
          });
      }

      /* Photo. HEIC converts at maximum quality so the stored original
         loses nothing (D16 + D17). */
      var prepare = isHeic(file)
        ? (report("Converting photo…"), convertHeic(file, 1.0))
        : Promise.resolve(file);

      return prepare.then(function (original) {
        report("Uploading original…");
        return upload(bucket, base + ".jpg", original, "image/jpeg")
          .then(function (originalPath) {
            report("Creating display copy…");
            return loadBitmap(original).then(function (bitmap) {
              return resizeToJpeg(bitmap, PROFILE.galleryDisplay)
                .then(function (displayBlob) {
                  return upload(bucket, base + ".web.jpg", displayBlob);
                })
                .then(function (displayPath) {
                  report("Creating thumbnail…");
                  return resizeToJpeg(bitmap, PROFILE.galleryThumb)
                    .then(function (thumbBlob) {
                      return upload(bucket, base + ".thumb.jpg", thumbBlob);
                    })
                    .then(function (thumbPath) {
                      return {
                        bucket: bucket,
                        storagePath: originalPath,   // HD, untouched
                        displayPath: displayPath,
                        thumbnailPath: thumbPath,
                        mediaType: "photo",
                        sizeBytes: original.size
                      };
                    });
                });
            });
          });
      });
    },

    /* Testimonial videos — own bucket, flat path, no folders. Kept
       structurally separate from the galleries so they can never be
       confused with Completed Project Videos. HD preserved. */
    uploadTestimonialVideo: function (file, onProgress) {
      var report = onProgress || function () {};
      var id = uuid();
      var bucket = "testimonial-videos";

      report("Uploading video…");
      return upload(bucket, id + fileExt(file), file, file.type)
        .then(function (videoPath) {
          report("Creating thumbnail…");
          return videoPoster(file).then(function (poster) {
            if (!poster) {
              return { bucket: bucket, videoPath: videoPath,
                       thumbnailPath: null, sizeBytes: file.size };
            }
            return upload(bucket, id + ".thumb.jpg", poster)
              .then(function (thumbPath) {
                return { bucket: bucket, videoPath: videoPath,
                         thumbnailPath: thumbPath, sizeBytes: file.size };
              });
          });
        });
    },

    /* =================================================================
       COMMUNICATION MEDIA — OPTIMIZED (D17)
       =================================================================
       Chat is a conversation; the gallery is the archive. These photos
       are sized for reading on a phone, not for keeping.
       ================================================================= */
    uploadCommunicationMedia: function (file, conversationId, onProgress) {
      var report = onProgress || function () {};

      if (isVideo(file)) {
        var e = new Error("Video not supported in chat");
        e.friendlyMessage = "Videos can't be sent in chat. Please send a photo.";
        return Promise.reject(e);
      }

      return client.auth.getUser().then(function (res) {
        var uid = res && res.data && res.data.user ? res.data.user.id : null;
        if (!uid) throw new Error("Not signed in");

        var prepare = isHeic(file)
          ? (report("Converting photo…"), convertHeic(file, 0.9))
          : Promise.resolve(file);

        return prepare.then(function (input) {
          report("Optimizing photo…");
          return loadBitmap(input)
            .then(function (bitmap) { return resizeToJpeg(bitmap, PROFILE.chatPhoto); })
            .then(function (blob) {
              /* Size is checked AFTER conversion, not before. A HEIC
                 often becomes a LARGER JPEG, so a file comfortably
                 under the cap beforehand can exceed it afterwards. */
              if (blob.size > CHAT_MAX_BYTES) {
                var err = new Error("Photo too large");
                err.friendlyMessage =
                  "That photo is too large to send. Please try a smaller one.";
                throw err;
              }

              /* Path: {conversation}/{own uid}/{uuid}.jpg
                 The uid folder is why a client cannot overwrite a photo
                 staff sent them, even inside their own conversation. */
              var path = conversationId + "/" + uid + "/" + uuid() + ".jpg";
              report("Sending…");
              return upload("chat-attachments", path, blob).then(function (p) {
                return { bucket: "chat-attachments", path: p,
                         mimeType: "image/jpeg", sizeBytes: blob.size };
              });
            });
        });
      });
    },

    /* =================================================================
       DISPLAY ASSETS — OPTIMIZED FOR THEIR DISPLAY SIZE (D17)
       ================================================================= */
    uploadDisplayAsset: function (file, kind, onProgress) {
      var report = onProgress || function () {};
      var config = {
        "review-photo": { bucket: "review-photos",   profile: PROFILE.reviewPhoto },
        "company-cover": { bucket: "company-assets", profile: PROFILE.companyCover },
        "company-logo":  { bucket: "company-assets", profile: PROFILE.companyLogo }
      }[kind];

      if (!config) return Promise.reject(new Error("Unknown asset kind: " + kind));
      if (isVideo(file)) return Promise.reject(new Error("Images only"));

      var prepare = isHeic(file)
        ? (report("Converting photo…"), convertHeic(file, 0.9))
        : Promise.resolve(file);

      return prepare.then(function (input) {
        report("Optimizing…");
        return loadBitmap(input)
          .then(function (bitmap) { return resizeToJpeg(bitmap, config.profile); })
          .then(function (blob) {
            report("Uploading…");
            var path = uuid() + ".jpg";
            return upload(config.bucket, path, blob).then(function (p) {
              return { bucket: config.bucket, path: p, sizeBytes: blob.size };
            });
          });
      });
    },

    /* Guard used by the chat composer. Photos only — client chat video
       is not supported at launch (D17), and refusing it here gives a
       clear message instead of a rejection from Storage. HEIC counts as
       supported because it is converted on the device (D16). */
    isSupportedChatImage: function (file) {
      if (!file) return false;
      if (isVideo(file)) return false;
      if (isHeic(file)) return true;
      return /^image\/(jpeg|png|webp)$/i.test(file.type || "");
    },

    isHeic: isHeic,
    isVideo: isVideo,
    PROFILE: PROFILE
  };

  function fileExt(file) {
    var m = String(file.name || "").match(/(\.[a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : ".mp4";
  }

  window.LLCMedia = Media;
})();
