// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Pool } = require("pg");
const slugify = require("slugify");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 5000;

// ---------- Supabase storage client (server-side service role key) ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "product-images";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Image upload will not work until set.");
}
const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "");

// ---------- Postgres pool (use DATABASE_URL if provided) ----------
let poolConfig = {};
if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  // Cloud Postgres usually requires SSL. For many hosts we need to allow self-signed certs:
  poolConfig.ssl = { rejectUnauthorized: false };
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

// ---------- Multer memory storage (no local disk persistence) ----------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// (Optional) local temp folder for debugging - not used for persistent storage
const TEMP_UPLOAD_DIR = path.resolve(process.cwd(), "tmp_uploads");
if (!fs.existsSync(TEMP_UPLOAD_DIR)) fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });

const app = express();

// ---------- CORS ----------
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// ---------- Helper: run SQL queries ----------
async function query(sql, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

// Health check
app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/*
  POST /api/products
  - multipart/form-data with fields:
    name, isVeg (true/false), weight, type (JSON string or CSV), description, ingredients, delivery_instructions
    images[] (files, optional)
    imageUrls (optional) - JSON array of external URLs to save instead of upload
*/
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

    // Duplicate check
    const dup = await query("SELECT id FROM products WHERE slug = $1 OR lower(name) = lower($2) LIMIT 1", [slug, normalizedName]);
    if (dup.rowCount > 0) return res.status(409).json({ error: "Product with same name already exists" });

    // Parse type (JSON array or comma-separated)
    let typesParsed = [];
    try {
      const t = String(type || "[]");
      if (t.trim().startsWith("[")) typesParsed = JSON.parse(t);
      else typesParsed = t.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      typesParsed = [];
    }

    // Insert product (store type as JSONB string)
    const insertSql = `INSERT INTO products
      (name, slug, is_veg, weight, type, description, ingredients, delivery_instructions, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`;
    const insertParams = [
      normalizedName,
      slug,
      (isVeg === "true" || isVeg === true),
      weight || null,
      JSON.stringify(typesParsed),
      description || null,
      ingredients || null,
      delivery_instructions || null,
    ];
    const insertRes = await query(insertSql, insertParams);
    const product = insertRes.rows[0];

    // Collect image URLs to return
    const images = [];

    // 1) Upload files in memory to Supabase Storage
    if (Array.isArray(req.files) && req.files.length) {
      for (const file of req.files) {
        try {
          // unique path in bucket: product-<id>/<timestamp>-<random><ext>
          const ext = path.extname(file.originalname) || ".jpg";
          const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          const objectPath = `product-${product.id}/${filename}`;

          // upload buffer to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(objectPath, file.buffer, { contentType: file.mimetype });

          if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            continue; // skip this file but continue other files
          }

          // get public URL (works for public buckets)
          const { data: publicData, error: publicError } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(objectPath);

          if (publicError || !publicData || !publicData.publicUrl) {
            console.error("Supabase getPublicUrl error:", publicError);
            continue;
          }

          const publicUrl = publicData.publicUrl;

          // Save image row
          await query("INSERT INTO product_images (product_id, path, created_at) VALUES ($1,$2,NOW())", [product.id, publicUrl]);

          images.push(publicUrl);
        } catch (err) {
          console.error("Error uploading file to Supabase:", err);
        }
      }
    }

    // 2) Optional: client-provided external image URLs in field 'imageUrls' as JSON array
    if (req.body.imageUrls) {
      try {
        const arr = typeof req.body.imageUrls === "string" ? JSON.parse(req.body.imageUrls) : req.body.imageUrls;
        if (Array.isArray(arr)) {
          for (const u of arr) {
            // Basic validation for url
            if (typeof u !== "string") continue;
            // insert into DB
            await query("INSERT INTO product_images (product_id, path, created_at) VALUES ($1,$2,NOW())", [product.id, u]);
            images.push(u);
          }
        }
      } catch (e) {
        // ignore malformed imageUrls
      }
    }

    return res.status(201).json({ product: { ...product, images } });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET all products with images
app.get("/api/products", async (req, res) => {
  try {
    const pRes = await query("SELECT * FROM products ORDER BY created_at DESC", []);
    const products = pRes.rows || [];

    if (!products.length) return res.json({ products: [] });

    const ids = products.map((p) => p.id);
    const imgsRes = await query("SELECT product_id, path FROM product_images WHERE product_id = ANY($1::int[]) ORDER BY id ASC", [ids]);
    const imagesMap = {};
    for (const row of imgsRes.rows) {
      if (!imagesMap[row.product_id]) imagesMap[row.product_id] = [];
      imagesMap[row.product_id].push(row.path);
    }

    const out = products.map((p) => ({ ...p, images: imagesMap[p.id] || [] }));
    return res.json({ products: out });
  } catch (err) {
    console.error("GET /api/products err:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET single product by slug
app.get("/api/products/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const pRes = await query("SELECT * FROM products WHERE slug = $1 LIMIT 1", [slug]);
    if (pRes.rowCount === 0) return res.status(404).json({ error: "Not found" });
    const product = pRes.rows[0];

    const imgsRes = await query("SELECT path FROM product_images WHERE product_id = $1 ORDER BY id ASC", [product.id]);
    product.images = imgsRes.rows.map((r) => r.path);

    return res.json({ product });
  } catch (err) {
    console.error("GET /api/products/:slug", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Serve React build in production (if you deploy as one app)
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "build");
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get("*", (req, res) => res.sendFile(path.join(clientBuildPath, "index.html")));
  }
}

// Mailer (optional)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Contact endpoint
app.post("/api/contact", async (req, res) => {
  const { name, email, product, quantity, special, message, callMeBack, preferredTime } = req.body;
  if (!email || !name) return res.status(400).json({ message: "Missing required" });

  try {
    const mailOptions = {
      from: email,
      to: process.env.RECEIVER_EMAIL || process.env.SMTP_USER,
      subject: `Contact/order from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Product: ${product}
Quantity: ${quantity}
Call me back: ${callMeBack}
PreferredTime: ${preferredTime}
Special: ${special}
Message: ${message}
      `,
    };
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log("Skipping email send (SMTP not configured).", mailOptions);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Email failed:", err);
    return res.status(500).json({ ok: false, message: "Email failed" });
  }
});

// Fallback for SPA (if using single deploy)
const buildPath = path.join(__dirname, "build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.use((req, res) => res.sendFile(path.join(buildPath, "index.html")));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
