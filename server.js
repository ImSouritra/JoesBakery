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

/* -------------------- Multer (Memory Storage) -------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* -------------------- Express App -------------------- */
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

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

/* -------------------- Mailer -------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post("/api/contact", async (req, res) => {
  const { name, email, product, quantity, special, message, callMeBack, preferredTime } =
    req.body;
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
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Email failed:", err);
    res.status(500).json({ ok: false, message: "Email failed" });
  }
});

/* -------------------- Serve React Build (SPA Fallback) -------------------- */
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "build");
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    // Catch-all fallback (Express v5 safe)
    app.use((req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
  }
}

/* -------------------- Start Server -------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
