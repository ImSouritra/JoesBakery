// server.js
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const slugify = require("slugify");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const nodemailer = require('nodemailer'); // optional if you use emailing

const {
  PGHOST,
  PGPORT,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  UPLOAD_DIR = "uploads",
} = process.env;


if (!PGHOST || !PGPORT || !PGDATABASE || !PGUSER) {
  console.warn("Postgres env vars not fully provided. Please create .env with PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD");
}

// Create upload folder if missing
const uploadDir = path.resolve(process.cwd(), UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer - store files on disk in uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // keep original ext, unique name
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const app = express();
app.use(cors()); // adjust origin in production
app.use(express.json());

// Serve uploaded images statically
app.use("/uploads", express.static(uploadDir));
// Postgres pool
const pool = new Pool({
  host: PGHOST,
  port: PGPORT,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
});

// Simple helper to run queries
async function query(sql, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

/*
  DB schema (run once) - see below instructions to create these tables.
  Table structure:
   - products: id (serial pk), name, slug, is_veg, weight, type jsonb, description, ingredients, delivery_instructions, created_at
   - product_images: id, product_id (fk), path (string), created_at
*/

// Create product (multipart/form-data with files)
app.post("/api/products", upload.array("images", 8), async (req, res) => {
  try {
    // Fields are expected in body (as text fields). types is JSON-encoded array or comma-separated.
    const {
      name,
      isVeg = "false",
      weight = "",
      type = "[]",
      description = "",
      ingredients = "",
      delivery_instructions = "",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Missing product name" });
    }
    const normalizedName = String(name).trim();
    const slug = slugify(normalizedName, { lower: true, strict: true });

    // Check duplicate by slug or name (case-insensitive)
    const dupCheck = await query(
      "SELECT id FROM products WHERE slug = $1 OR lower(name) = lower($2) LIMIT 1",
      [slug, normalizedName]
    );
    if (dupCheck.rowCount > 0) {
      return res.status(409).json({ error: "Product with same name already exists" });
    }

    // Parse types
    let typesParsed = [];
    try {
      // client may send JSON string or comma separated
      const t = String(type);
      if (t.trim().startsWith("[")) typesParsed = JSON.parse(t);
      else typesParsed = t.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      typesParsed = [];
    }

    // Insert product
    const insertProduct = await query(
    `INSERT INTO products (name, slug, is_veg, weight, type, description, ingredients, delivery_instructions, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW()) RETURNING *`,
      [normalizedName, slug, isVeg === "true" || isVeg === true, weight || "", JSON.stringify(typesParsed), description || "", ingredients || "", delivery_instructions || ""]
    );
    const product = insertProduct.rows[0];

    // Save images records. uploaded files are in req.files
    const images = [];
    if (Array.isArray(req.files) && req.files.length) {
      for (const f of req.files) {
        // store relative path for serving: /uploads/<filename>
        const relPath = `/uploads/${path.basename(f.path)}`;
        await query(
          `INSERT INTO product_images (product_id, path, created_at) VALUES ($1,$2,NOW())`,
          [product.id, relPath]
        );
        images.push(relPath);
      }
    }

    // Return created product merged with images
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
    const products = pRes.rows;

    // get images for each product in one batch
    const ids = products.map((p) => p.id);
    if (ids.length === 0) return res.json({ products: [] });

    const imgsRes = await query(
      `SELECT product_id, path FROM product_images WHERE product_id = ANY($1::int[]) ORDER BY id ASC`,
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

// GET one product by slug
app.get("/api/products/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const pRes = await query("SELECT * FROM products WHERE slug = $1 LIMIT 1", [slug]);
    if (pRes.rowCount === 0) return res.status(404).json({ error: "Not found" });
    const product = pRes.rows[0];
    const imgsRes = await query("SELECT path FROM product_images WHERE product_id = $1 ORDER BY id ASC", [product.id]);
    product.images = imgsRes.rows.map((r) => r.path);
    res.json({ product });
  } catch (err) {
    console.error("GET /api/products/:slug", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve the react build in production (if you build client into ../build)
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "build");
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
  }
}


// Example mail transporter (use env vars)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Example API endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, product, quantity, special, message, callMeBack, preferredTime } = req.body;
  // Validate lightly
  if (!email || !name) return res.status(400).json({ message: 'Missing required' });

  // send email (or persist, etc.)
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
    // Only attempt send if transporter configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log('Skipping email send (SMTP not configured).', mailOptions);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Email failed:', err);
    return res.status(500).json({ ok: false, message: 'Email failed' });
  }
});

/* ---------- Serve React build in production ---------- */
// Serve static files from the React app (build folder)
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// For all other routes, serve index.html (so react-router handles client routing)
app.use((req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
 });


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
