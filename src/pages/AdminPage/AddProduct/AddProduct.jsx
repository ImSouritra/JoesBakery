// src/pages/Admin/AddProduct/AddProduct.jsx
import React, { useState } from "react";
import slugify from "slugify";
import "./AddProduct.css";

const PREDEFINED_TYPES = [
  "classic","new","healthy","cake","brownie","cookie","muffin","teacake","bestseller"
];

export default function AddProduct({ onProductAdd }) {
  const [form, setForm] = useState({
    name: "",
    isVeg: true,
    weight: "",
    type: [],
    description: "",
    ingredients: "",
    delivery_instructions: "",
  });
  const [files, setFiles] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]);
  const [saving, setSaving] = useState(false);

  function toggleType(t) {
    setForm((p) => {
      const exists = p.type.includes(t);
      return { ...p, type: exists ? p.type.filter((x) => x !== t) : [...p.type, t] };
    });
  }

  function onFilesChange(e) {
    const f = Array.from(e.target.files || []);
    if (!f.length) return;
    setFiles((prev) => [...prev, ...f]);
    // build local previews
    f.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls((p) => [...p, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function addUrlImage() {
    if (!urlInput.trim()) return;
    setPreviewUrls((p) => [...p, urlInput.trim()]);
    // we don't send external URLs as files, server will store them as image path when provided in "imageUrls" field
    setFiles((prev) => prev); // no change
    setUrlInput("");
  }

  function removePreviewAt(i) {
    setPreviewUrls((p) => p.filter((_, idx) => idx !== i));
    // Note: If you want to remove corresponding file, more logic required.
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Enter product name");
      return;
    }

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("isVeg", form.isVeg ? "true" : "false");
      fd.append("weight", form.weight);
      // send types as JSON string so server picks up
      fd.append("type", JSON.stringify(form.type));
      fd.append("description", form.description);
      fd.append("ingredients", form.ingredients);
      fd.append("delivery_instructions", form.delivery_instructions);

      // attached files
      files.forEach((f) => fd.append("images", f));

      // If you want to send external image URLs (from urlInput / previews that are urls),
      // you can append them in a field imageUrls as JSON or comma separated.
      // Here we include any preview urls that start with http(s)
      const externalUrls = previewUrls.filter((u) => /^https?:\/\//i.test(u));
      if (externalUrls.length) {
        fd.append("imageUrls", JSON.stringify(externalUrls));
      }

      const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api/products";

      const res = await fetch(API, {
        method: "POST",
        body: fd,
      });

      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Product already exists");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Server error creating product:", body);
        alert(body.error || "Failed to create product");
        return;
      }

      const body = await res.json();
      // server returns created product
      const created = (body && body.product) ? body.product : null;
      if (created) {
        // call parent to update UI
        if (typeof onProductAdd === "function") {
          try {
            onProductAdd(created);
          } catch (err) { console.warn("onProductAdd error:", err); }
        }
      }

      // Reset
      setForm({
        name: "",
        isVeg: true,
        weight: "",
        type: [],
        description: "",
        ingredients: "",
        delivery_instructions: "",
      });
      setFiles([]);
      setPreviewUrls([]);
      alert("Product uploaded successfully");
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to upload product (see console)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="add-product-page">
      <h1>Add Product (server upload)</h1>
      <form onSubmit={handleSubmit} className="add-product-form">
        <label>
          Product Name *
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>

        <label className="inline-checkbox">
          <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} />
          Vegetarian
        </label>

        <label>
          Weight
          <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="500 GM" />
        </label>

        <label>
          Categories / Types
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {PREDEFINED_TYPES.map((t) => {
              const active = form.type.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  style={{
                    padding: "6px 10px", borderRadius: 999, border: active ? "1px solid #111" : "1px solid #eee",
                    background: active ? "#111" : "#fff", color: active ? "#fff" : "#111", cursor: "pointer", fontWeight: 600,
                    textTransform: "capitalize"
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        </label>

        <label>
          Description
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        <label>
          Ingredients
          <textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
        </label>

        <label>
          Delivery instructions
          <textarea value={form.delivery_instructions} onChange={(e) => setForm({ ...form, delivery_instructions: e.target.value })} />
        </label>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginTop: 8 }}>
          <label style={{ flex: 1 }}>
            Upload images
            <input type="file" accept="image/*" multiple onChange={onFilesChange} />
          </label>

          <label style={{ width: 320 }}>
            Add image by URL
            <div style={{ display: "flex", gap: 8 }}>
              <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." />
              <button type="button" onClick={addUrlImage}>Add</button>
            </div>
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {previewUrls.length === 0 ? <div style={{ color: "#777" }}>No previews</div> :
            previewUrls.map((u, i) => (
              <div key={i} style={{ width: 110, height: 110, overflow: "hidden", position: "relative", borderRadius: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
                {u ? <img src={u} alt={"preview-" + i} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                <button type="button" onClick={() => removePreviewAt(i)} style={{ position: "absolute", right: 6, top: 6 }}>✕</button>
              </div>
            ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save product"}</button>
        </div>
      </form>
    </div>
  );
}
