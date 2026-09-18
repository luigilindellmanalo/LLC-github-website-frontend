/* =====================================================================
   chat-service.js — SUPABASE VERSION
   =====================================================================
   Replaces the Phase 1-9 mock service.

   WHAT CHANGES MOST
   The prototype wrote messages into the client's own browser, where
   they went nowhere. No message ever reached the company, and no reply
   could ever come back. This connects both directions.

   NO clientId PARAMETER ANYWHERE
   The prototype passed clientId into every call, which is exactly how
   one client could end up reading another's thread after a refresh
   reset the ID counter. The database now derives identity from the
   authenticated session, so there is nothing to pass and nothing to
   get wrong.

   D8  — clients may send PHOTOS.
   D17 — client photos are optimized before upload; VIDEOS ARE NOT
         SUPPORTED at launch, and are refused here as well as by the
         bucket, the storage policy, and a database constraint.
   ===================================================================== */
(function () {
  "use strict";

  var sb = window.LLCSupabase;
  if (!sb) {
    console.error("supabase-client.js must load before chat-service.js");
    return;
  }
  var client = sb.client;

  var cached = null;          // { conversationId, messages: [...] }
  var channel = null;
  var subscribers = [];

  function mapMessage(row, attachmentUrl) {
    return {
      messageId: row.id,
      conversationId: row.conversation_id,
      senderRole: row.sender_role === "staff" ? "admin" : "client",
      /* The displayed name is written by a database trigger from the
         sender's real record — it is never taken from whoever sent the
         message. A client cannot make a message appear to come from
         the company. */
      senderName: row.sender_name_snapshot || null,
      senderRoleLabel: row.sender_role_label_snapshot || null,
      messageText: row.message_text || "",
      attachmentUrl: attachmentUrl || null,
      attachmentCaption: row.attachment_caption || null,
      linkUrl: row.link_url || null,
      linkText: row.link_text || null,
      timestamp: row.created_at,
      readStatus: row.read_at ? "read" : "sent"
    };
  }

  /* Signs any attachment paths in one batch rather than per message. */
  function signAttachments(rows) {
    var paths = rows
      .filter(function (r) { return r.attachment_path; })
      .map(function (r) { return r.attachment_path; });

    if (!paths.length) {
      return Promise.resolve(rows.map(function (r) { return mapMessage(r, null); }));
    }
    return window.LLCSignedUrls.getMany("chat-attachments", paths)
      .then(function (urls) {
        return rows.map(function (r) {
          return mapMessage(r, r.attachment_path ? urls[r.attachment_path] : null);
        });
      });
  }

  /* Finds the client's conversation, creating it on first use.
     A unique index in the database guarantees one conversation per
     client, so even a race between two tabs cannot produce a second. */
  function ensureConversation() {
    return client.from("conversations").select("id").maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        if (res.data) return res.data.id;

        return client.from("conversations")
          .insert({ admin_read_status: "unread", archived: false })
          .select("id").single()
          .then(function (ins) {
            if (ins.error) {
              /* Another tab won the race. Read the existing one. */
              return client.from("conversations").select("id").single()
                .then(function (again) {
                  if (again.error) throw again.error;
                  return again.data.id;
                });
            }
            return ins.data.id;
          });
      });
  }

  function loadConversation() {
    return ensureConversation().then(function (conversationId) {
      return client.from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .then(function (res) {
          if (res.error) throw res.error;
          return signAttachments(res.data || []).then(function (messages) {
            cached = { conversationId: conversationId, messages: messages };
            return cached;
          });
        });
    });
  }

  function notify() {
    subscribers.forEach(function (cb) {
      try { cb(cached); } catch (e) { console.error(e); }
    });
  }

  var ChatService = {
    getCachedConversation: function () { return cached; },

    loadConversation: loadConversation,

    sendMessage: function (text) {
      var body = String(text || "").trim();
      if (!body) return Promise.reject(new Error("Empty message"));

      var start = cached
        ? Promise.resolve(cached.conversationId)
        : ensureConversation();

      return start.then(function (conversationId) {
        return client.from("messages").insert({
          conversation_id: conversationId,
          sender_role: "client",
          message_text: body
          /* sender_client_id is set by RLS policy check against
             current_client_id(); the name shown is written by a
             trigger. Neither is supplied from here, and neither could
             be forged if it were. */
        }).select("*").single();
      }).then(function (res) {
        if (res.error) throw res.error;
        return loadConversation().then(function () {
          notify();
          return true;
        });
      });
    },

    /* D8 — photos only. */
    sendPhoto: function (file, onProgress) {
      if (!file) return Promise.reject(new Error("No file"));

      /* D17 — client chat video is NOT supported at launch. Refused
         here for a clear message; also refused by the bucket MIME list,
         the storage policy regex, and a database CHECK constraint. */
      if (/^video\//i.test(file.type) || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name)) {
        var e = new Error("Video not supported");
        e.friendlyMessage =
          "Videos can't be sent in chat. Please send a photo, or call us on 0975 526 6616.";
        return Promise.reject(e);
      }

      var start = cached
        ? Promise.resolve(cached.conversationId)
        : ensureConversation();

      return start.then(function (conversationId) {
        return window.LLCMedia.uploadCommunicationMedia(
          file, conversationId, onProgress
        ).then(function (uploaded) {
          return client.from("messages").insert({
            conversation_id: conversationId,
            sender_role: "client",
            message_text: "",
            attachment_bucket: uploaded.bucket,
            attachment_path: uploaded.path,
            attachment_mime_type: uploaded.mimeType,
            attachment_size_bytes: uploaded.sizeBytes
          }).select("*").single();
        });
      }).then(function (res) {
        if (res.error) throw res.error;
        return loadConversation().then(function () {
          notify();
          return true;
        });
      });
    },

    /* Realtime — how a staff reply arrives without a refresh.

       ⚠️ SECURITY, PENDING LIVE VERIFICATION:
       Realtime is a SEPARATE channel from ordinary queries. If the
       messages table is published without RLS enforcement, every
       subscribed client receives every message inserted anywhere —
       while all the query policies remain perfectly correct. A test
       with one account passes either way. This MUST be verified with
       two clients signed in simultaneously (live test group 2). */
    subscribeToMessages: function (cb) {
      if (typeof cb === "function") subscribers.push(cb);
      if (channel || !cached) return;

      channel = client
        .channel("client-conversation")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "conversation_id=eq." + cached.conversationId
        }, function () {
          loadConversation().then(notify).catch(function (e) {
            console.error("Realtime refresh failed:", e);
          });
        })
        .subscribe();
    },

    unsubscribe: function () {
      if (channel) { client.removeChannel(channel); channel = null; }
      subscribers = [];
    },

    markRead: function () {
      if (!cached) return Promise.resolve(false);
      return client.rpc("set_conversation_read_status", {
        conv_id: cached.conversationId,
        new_status: "read"
      }).then(function () { return true; })
        .catch(function () { return false; });
    },

    reset: function () {
      ChatService.unsubscribe();
      cached = null;
    }
  };

  window.ChatService = ChatService;
})();
