require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const { Pool } = require("pg");
const slugify = require("slugify");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
// MailerSend SDK
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const PORT = process.env.PORT || 5000;

/* -------------------- Supabase Storage -------------------- */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "product-images";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Image upload will not work until set."
  );
}
const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY || ""
);

/* -------------------- Postgres Pool -------------------- */
let poolConfig = {};
if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  poolConfig.ssl = { rejectUnauthorized: false }; // Railway/Supabase require SSL
} else {
  poolConfig = {
    host: process.env.PGHOST || "localhost",
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE || "joesbakery",
    user: process.env.PGUSER || "joe",
    password: process.env.PGPASSWORD || "",
  };
}
const pool = new Pool(poolConfig);
// Prevent uncaught pool errors from crashing the process (e.g., :shutdown, :db_termination)
pool.on("error", (err) => {
  console.error("[PG] Unexpected pool error (process kept alive):", err);
});

// Optional: initial connectivity probe (non-fatal)
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("[PG] Initial database connectivity OK");
  } catch (e) {
    console.error("[PG] Initial database connectivity FAILED:", e.message);
  }
})();

/* -------------------- Multer (Memory Storage) -------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* -------------------- Express App -------------------- */
const app = express();

/* -------------------- Dynamic CORS Configuration -------------------- */
function buildAllowedOrigins(raw) {
  if (!raw || raw.trim() === "") return ["*"]; // allow all
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return ["*"];
  return parts.map(normalizeOrigin);
}

function normalizeOrigin(origin) {
  if (!origin) return origin;
  try {
    if (origin === "*") return origin;
    return origin.replace(/\/$/, "");
  } catch {
    return origin;
  }
}

const allowedOrigins = buildAllowedOrigins(process.env.CORS_ORIGIN || "");
const allowAll = allowedOrigins.includes("*");
const logCors = /^true$/i.test(process.env.CORS_LOG || "");

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      if (logCors) console.log("[CORS] No Origin header -> allowed (non-browser or same-origin)");
      return callback(null, true);
    }
    const normalized = normalizeOrigin(origin);
    if (allowAll) {
      if (logCors) console.log(`[CORS] * matches ${normalized}`);
      return callback(null, true);
    }
    if (allowedOrigins.includes(normalized)) {
      if (logCors) console.log(`[CORS] Allowed ${normalized}`);
      return callback(null, true);
    }
    if (logCors) {
      console.warn(`[CORS] Blocked origin: ${normalized}. Allowed: ${allowedOrigins.join(", ")}`);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());

if (logCors) {
  console.log("[CORS] Allowed origins:", allowAll ? "* (all)" : allowedOrigins);
}

/* -------------------- Helper: Query Wrapper -------------------- */
async function query(sql, params) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

/* -------------------- Health Check -------------------- */
app.get("/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

/* -------------------- API: Create Product -------------------- */
app.post("/api/products", upload.array("images", 8), async (req, res) => {
  try {
    const {
      name,
      isVeg = "false",
      weight = "",
      type = "[]",
      description = "",
      ingredients = "",
      delivery_instructions = "",
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Missing product name" });
    }
    const normalizedName = String(name).trim();
    const slug = slugify(normalizedName, { lower: true, strict: true });

    // Check duplicates
    const dup = await query(
      "SELECT id FROM products WHERE slug = $1 OR lower(name) = lower($2) LIMIT 1",
      [slug, normalizedName]
    );
    if (dup.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Product with same name already exists" });
    }

    // Parse type
    let typesParsed = [];
    try {
      const t = String(type || "[]");
      typesParsed = t.trim().startsWith("[")
        ? JSON.parse(t)
        : t.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      typesParsed = [];
    }

    // Insert product
    const insertRes = await query(
      `INSERT INTO products
       (name, slug, is_veg, weight, type, description, ingredients, delivery_instructions, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [
        normalizedName,
        slug,
        isVeg === "true" || isVeg === true,
        weight || null,
        JSON.stringify(typesParsed),
        description || null,
        ingredients || null,
        delivery_instructions || null,
      ]
    );
    const product = insertRes.rows[0];
    const images = [];

    // Upload files to Supabase
    if (Array.isArray(req.files) && req.files.length) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname) || ".jpg";
        const filename = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${ext}`;
        const objectPath = `product-${product.id}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(objectPath, file.buffer, { contentType: file.mimetype });
        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          continue;
        }

        const { data: publicData, error: publicError } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(objectPath);

        if (!publicError && publicData?.publicUrl) {
          await query(
            "INSERT INTO product_images (product_id, path, created_at) VALUES ($1,$2,NOW())",
            [product.id, publicData.publicUrl]
          );
          images.push(publicData.publicUrl);
        }
      }
    }

    // External image URLs
    if (req.body.imageUrls) {
      try {
        const arr =
          typeof req.body.imageUrls === "string"
            ? JSON.parse(req.body.imageUrls)
            : req.body.imageUrls;
        if (Array.isArray(arr)) {
          for (const u of arr) {
            if (typeof u !== "string") continue;
            await query(
              "INSERT INTO product_images (product_id, path, created_at) VALUES ($1,$2,NOW())",
              [product.id, u]
            );
            images.push(u);
          }
        }
      } catch {
        /* ignore */
      }
    }

    res.status(201).json({ product: { ...product, images } });
  } catch (err) {
    console.error("POST /api/products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -------------------- API: Delete Product -------------------- */
app.delete("/api/products/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  try {
    const imgs = await query(
      "SELECT path FROM product_images WHERE product_id = $1",
      [id]
    );
    for (const row of imgs.rows) {
      const url = row.path;
      if (
        url &&
        SUPABASE_URL &&
        SUPABASE_BUCKET &&
        url.includes("/storage/v1/object/public/")
      ) {
        const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          const objectPath = url.substring(idx + marker.length);
          await supabase.storage.from(SUPABASE_BUCKET).remove([objectPath]);
        }
      }
    }

    await query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/products/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -------------------- API: Update Product -------------------- */
app.put("/api/products/:id", upload.array("images", 8), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  try {
    const existingRes = await query("SELECT * FROM products WHERE id = $1 LIMIT 1", [id]);
    if (existingRes.rowCount === 0) return res.status(404).json({ error: "Not found" });
    const existing = existingRes.rows[0];

    const { name, isVeg, weight, type, description, ingredients, delivery_instructions } = req.body;

    let fields = [];
    let values = [];
    let paramIndex = 1;

    function pushField(column, value) {
      fields.push(`${column} = $${paramIndex++}`);
      values.push(value);
    }

    if (typeof name === "string" && name.trim()) {
      const normalizedName = name.trim();
      const newSlug = slugify(normalizedName, { lower: true, strict: true });
      const dup = await query(
        "SELECT id FROM products WHERE (slug = $1 OR lower(name)=lower($2)) AND id <> $3 LIMIT 1",
        [newSlug, normalizedName, id]
      );
      if (dup.rowCount > 0) {
        return res.status(409).json({ error: "Another product with that name exists" });
      }
      pushField("name", normalizedName);
      pushField("slug", newSlug);
    }

    if (typeof isVeg !== "undefined") {
      const boolVal = isVeg === "true" || isVeg === true || isVeg === 1 || isVeg === "1";
      pushField("is_veg", boolVal);
    }
    if (typeof weight !== "undefined") pushField("weight", weight || null);
    if (typeof description !== "undefined") pushField("description", description || null);
    if (typeof ingredients !== "undefined") pushField("ingredients", ingredients || null);
    if (typeof delivery_instructions !== "undefined") pushField("delivery_instructions", delivery_instructions || null);

    if (typeof type !== "undefined") {
      let typesParsed = [];
      try {
        const t = String(type || "[]");
        typesParsed = t.trim().startsWith("[")
          ? JSON.parse(t)
          : t.split(",").map((s) => s.trim()).filter(Boolean);
      } catch {
        typesParsed = [];
      }
      pushField("type", JSON.stringify(typesParsed));
    }

    const hasImageOps = !!(req.files?.length || req.body.imageUrls || req.body.removeImageUrls);
    if (!fields.length && !hasImageOps) {
      return res.status(400).json({ error: "No changes provided" });
    }

    if (fields.length) {
      const sql = `UPDATE products SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
      values.push(id);
      const updatedRes = await query(sql, values);
      Object.assign(existing, updatedRes.rows[0]);
    } else if (hasImageOps) {
      // Only images changed; nothing to update in products table since we have no updated_at column.
    }

    const newImages = [];

    // Remove specified image URLs
    if (req.body.removeImageUrls) {
      try {
        const arr =
          typeof req.body.removeImageUrls === "string"
            ? JSON.parse(req.body.removeImageUrls)
            : req.body.removeImageUrls;
        if (Array.isArray(arr)) {
          for (const url of arr) {
            if (typeof url !== "string") continue;
            await query("DELETE FROM product_images WHERE product_id=$1 AND path=$2", [id, url]);
            // Attempt physical removal if it's a Supabase-hosted file
            if (
              url &&
              SUPABASE_URL &&
              SUPABASE_BUCKET &&
              url.includes(`/storage/v1/object/public/${SUPABASE_BUCKET}/`)
            ) {
              const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
              const idx = url.indexOf(marker);
              if (idx !== -1) {
                const objectPath = url.substring(idx + marker.length);
                await supabase.storage.from(SUPABASE_BUCKET).remove([objectPath]);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed parsing removeImageUrls", e);
      }
    }

    // Add uploaded files
    if (Array.isArray(req.files) && req.files.length) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname) || ".jpg";
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const objectPath = `product-${id}/${filename}`;
        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(objectPath, file.buffer, { contentType: file.mimetype });
        if (uploadError) {
          console.error("Supabase upload error (update):", uploadError);
          continue;
        }
        const { data: publicData, error: publicError } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(objectPath);
        if (!publicError && publicData?.publicUrl) {
          await query(
            "INSERT INTO product_images (product_id, path, created_at) VALUES ($1,$2,NOW())",
            [id, publicData.publicUrl]
          );
          newImages.push(publicData.publicUrl);
        }
      }
    }

    // Add external image URLs
    if (req.body.imageUrls) {
      try {
        const arr =
          typeof req.body.imageUrls === "string" ? JSON.parse(req.body.imageUrls) : req.body.imageUrls;
        if (Array.isArray(arr)) {
          for (const u of arr) {
            if (typeof u !== "string") continue;
            await query(
              "INSERT INTO product_images (product_id, path, created_at) VALUES ($1,$2,NOW())",
              [id, u]
            );
            newImages.push(u);
          }
        }
      } catch (e) {
        console.warn("Failed parsing imageUrls", e);
      }
    }

    // Return composite product with all images
    const imgsRes = await query("SELECT path FROM product_images WHERE product_id = $1 ORDER BY id ASC", [id]);
    const images = imgsRes.rows.map((r) => r.path);

    res.json({ product: { ...existing, images } });
  } catch (err) {
    console.error("PUT /api/products/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -------------------- API: Get Products -------------------- */
app.get("/api/products", async (req, res) => {
  try {
    const pRes = await query(
      "SELECT * FROM products ORDER BY created_at DESC",
      []
    );
    const products = pRes.rows || [];
    if (!products.length) return res.json({ products: [] });

    const ids = products.map((p) => p.id);
    const imgsRes = await query(
      "SELECT product_id, path FROM product_images WHERE product_id = ANY($1::int[]) ORDER BY id ASC",
      [ids]
    );
    const imagesMap = {};
    for (const row of imgsRes.rows) {
      if (!imagesMap[row.product_id]) imagesMap[row.product_id] = [];
      imagesMap[row.product_id].push(row.path);
    }

    const out = products.map((p) => ({
      ...p,
      images: imagesMap[p.id] || [],
    }));
    res.json({ products: out });
  } catch (err) {
    console.error("GET /api/products err:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -------------------- API: Get Product by Slug -------------------- */
app.get("/api/products/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const pRes = await query(
      "SELECT * FROM products WHERE slug = $1 LIMIT 1",
      [slug]
    );
    if (pRes.rowCount === 0)
      return res.status(404).json({ error: "Not found" });
    const product = pRes.rows[0];

    const imgsRes = await query(
      "SELECT path FROM product_images WHERE product_id = $1 ORDER BY id ASC",
      [product.id]
    );
    product.images = imgsRes.rows.map((r) => r.path);

    res.json({ product });
  } catch (err) {
    console.error("GET /api/products/:slug", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -------------------- MailerSend (API) -------------------- */
let mailerSendClient = null;
if (process.env.MAILERSEND_API_KEY) {
  mailerSendClient = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
  console.log("[MAIL] MailerSend client configured");
} else {
  console.warn("[MAIL] MAILERSEND_API_KEY not set. Email sending disabled.");
}

// helper functions
function sanitize(s) {
  if (s === undefined || s === null) return "";
  return String(s).trim();
}
function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* -------------------- API: Contact / Order (MailerSend) -------------------- */
app.post("/api/contact", async (req, res) => {
  const {
    name,
    email,
    mobile = "",
    product,
    quantity,
    special,
    message,
    callMeBack,
    preferredTime,
  } = req.body || {};

  // Basic required checks
  if (!email || !String(email).trim() || !name || !String(name).trim()) {
    return res.status(400).json({ message: "Missing required fields: name and email are required." });
  }

  // Normalize booleanish callMeBack
  const wantsCall = !!(
    callMeBack === true ||
    callMeBack === "true" ||
    callMeBack === "1" ||
    callMeBack === 1
  );

  // Light phone validation: allow +, digits, spaces, hyphen, parentheses; length 7-20 chars
  const phone = String(mobile || "").trim();
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: "Invalid mobile number format." });
  }

  // If user requested a callback, ensure mobile is present
  if (wantsCall && !phone) {
    return res.status(400).json({ message: "Mobile number is required when requesting a callback." });
  }

  try {
    const sanitized = {
      name: sanitize(name),
      email: sanitize(email),
      phone: phone,
      product: sanitize(product),
      quantity: sanitize(quantity),
      special: sanitize(special),
      message: sanitize(message),
      wantsCall,
      preferredTime: sanitize(preferredTime),
    };

    const textFirstLine = `New order from ${sanitized.name}${sanitized.product ? ` — ${sanitized.product}` : ""}`;
    const mailText = `${textFirstLine}\n\n${[
      `Name: ${sanitized.name}`,
      `Email: ${sanitized.email}`,
      `Mobile: ${sanitized.phone || "(not provided)"}`,
      `Product: ${sanitized.product || "(none)"}`,
      `Quantity: ${sanitized.quantity || "(not provided)"}`,
      `Call me back: ${sanitized.wantsCall}`,
      `Preferred time: ${sanitized.preferredTime || "(not provided)"}`,
      `Special instructions: ${sanitized.special || "(none)"}`,
      `Message: ${sanitized.message || "(none)"}`,
      `Sent at: ${new Date().toISOString()}`,
    ].join("\n")}`;

    // MailerSend config
    const FROM_EMAIL = process.env.MAILERSEND_SENDER || process.env.RECEIVER_EMAIL || "no-reply@localhost";
    const FROM_NAME = process.env.MAILERSEND_FROM_NAME || "Your Bakery";
    const TO_EMAIL = process.env.RECEIVER_EMAIL || FROM_EMAIL;
    const subject = `New order from ${sanitized.name}${sanitized.phone ? " — " + sanitized.phone : ""}`;
    const htmlBody = `<h2>New order from ${escapeHtml(sanitized.name)}</h2>
      <p><strong>Email:</strong> ${escapeHtml(sanitized.email)}<br/><strong>Mobile:</strong> ${escapeHtml(sanitized.phone || "(not provided)")}</p>
      <p><strong>Product:</strong> ${escapeHtml(sanitized.product || "(none)")}</p>
      <pre style="white-space:pre-wrap">${escapeHtml(mailText)}</pre>`;

    console.log("[CONTACT] incoming request:", {
      name: sanitized.name,
      email: sanitized.email,
      mobile: sanitized.phone,
      product: sanitized.product,
      quantity: sanitized.quantity,
      callMeBack: sanitized.wantsCall,
      preferredTime: sanitized.preferredTime,
    });

    if (!mailerSendClient) {
      console.warn("[CONTACT] MailerSend not configured — skipping send (but returning success).");
      console.log("[CONTACT] would send:", { FROM_EMAIL, TO_EMAIL, subject, mailText });
      return res.json({ ok: true });
    }

    // Build and send email via MailerSend SDK
    const from = new Sender(FROM_EMAIL, FROM_NAME);
    const to = [ new Recipient(TO_EMAIL) ];
    const params = new EmailParams()
      .setFrom(from)
      .setTo(to)
      .setReplyTo(new Sender(sanitized.email || FROM_EMAIL, sanitized.name || FROM_NAME))
      .setSubject(subject)
      .setText(mailText)
      .setHtml(htmlBody);

    const resp = await mailerSendClient.email.send(params);
    console.log("[CONTACT] MailerSend send response:", resp && resp.data ? resp.data : resp);
    return res.json({ ok: true });
  } catch (err) {
    console.error("MailerSend send failed:", err && err.response ? err.response.data : err);
    return res.status(500).json({ ok: false, message: "Email failed" });
  }
});

/* -------------------- Frontend Removed -------------------- */
// This repository now serves only the JSON API. No static frontend build is delivered.

/* -------------------- Start Server -------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Global fallbacks (keep last – do not swallow, only log)
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});
