// src/pages/Admin/AddProduct/AddProduct.jsx
import React, { useState } from "react";
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
    f.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls((p) => [...p, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    // clear input so same file can be selected again if needed
    e.target.value = "";
  }

  function addUrlImage() {
    if (!urlInput.trim()) return;
    setPreviewUrls((p) => [...p, urlInput.trim()]);
    setUrlInput("");
  }

  function removePreviewAt(i) {
    setPreviewUrls((p) => p.filter((_, idx) => idx !== i));
    // if you want to remove a file too, more logic needed to match preview->file
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
      fd.append("type", JSON.stringify(form.type));
      fd.append("description", form.description);
      fd.append("ingredients", form.ingredients);
      fd.append("delivery_instructions", form.delivery_instructions);

      files.forEach((f) => fd.append("images", f));

      const externalUrls = previewUrls.filter((u) => /^https?:\/\//i.test(u));
      if (externalUrls.length) {
        fd.append("imageUrls", JSON.stringify(externalUrls));
      }

      // Use relative API in production; env override allowed
      const API_BASE = process.env.REACT_APP_API_URL || "";
      const res = await fetch(`${API_BASE}/api/products`, {
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
      const created = body?.product || null;
      if (created && typeof onProductAdd === "function") {
        try {
          onProductAdd(created);
        } catch (err) {
          console.warn("onProductAdd error:", err);
        }
      }

      // Reset form
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
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="E.g. Classic Chocolate Cake"
          />
        </label>

        <div className="row two-col">
          <label className="inline-checkbox">
            <div style={{display:'flex',flexDirection:'row',alignItems:'center',gap:8}}>
              <input
                type="checkbox"
                checked={form.isVeg}
                onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
              />
              <span>Vegetarian</span>
            </div>
          </label>

          <label>
            Weight
            <input
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              placeholder="500 GM"
            />
          </label>
        </div>

        <label>
          Categories / Types
          <div className="types-row">
            {PREDEFINED_TYPES.map((t) => {
              const active = form.type.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`type-pill ${active ? "active" : ""}`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Write a short description..."
          />
        </label>

        <label>
          Ingredients
          <textarea
            value={form.ingredients}
            onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
            placeholder="List key ingredients..."
          />
        </label>

        <label>
          Delivery instructions
          <textarea
            value={form.delivery_instructions}
            onChange={(e) =>
              setForm({ ...form, delivery_instructions: e.target.value })
            }
            placeholder="Any special delivery notes..."
          />
        </label>

        <div className="image-upload-row">
          <div className="file-upload">
            <label>
              Upload images
              <input type="file" accept="image/*" multiple onChange={onFilesChange} />
            </label>
          </div>

          <div className="url-upload">
            <label>
              Add image by URL
              <div style={{display:"flex", gap:8, marginTop:8}}>
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <button type="button" className="btn-small" onClick={addUrlImage}>
                  Add
                </button>
              </div>
            </label>
          </div>
        </div>

        <div className="image-preview">
          {previewUrls.length === 0 ? (
            <div className="muted">No previews</div>
          ) : (
            previewUrls.map((u, i) => (
              <div className="thumb" key={i}>
                <img src={u} alt={"preview-" + i} />
                <button
                  type="button"
                  className="thumb-remove"
                  aria-label={`Remove preview ${i + 1}`}
                  onClick={() => removePreviewAt(i)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => {
            // reset local form only
            if (window.confirm("Reset form?")) {
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
            }
          }}>
            Reset
          </button>

          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>
    </div>
  );
}
