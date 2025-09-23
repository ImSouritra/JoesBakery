// src/pages/Admin/Admin.jsx
import React, { useEffect, useState, useCallback } from "react";
import localforage from "localforage";
import AddProduct from "./AddProduct/AddProduct"; // <-- path to your AddProduct component
import { PRODUCTS as STATIC_PRODUCTS } from "../../data/productData"; // adjust path
import "./Admin.css";

/*
  This Admin uses localforage to persist extras (same store used by AddProduct)
  so both components read/write the same data.
*/

const EXTRAS_KEY = "extraProductsList";

// create a dedicated extras store
const extrasStore = localforage.createInstance({
  name: "joesbakery",
  storeName: "extras",
});

async function readExtrasSafe() {
  try {
    const arr = (await extrasStore.getItem(EXTRAS_KEY)) || [];
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.error("Failed to read extras from IndexedDB:", err);
    return [];
  }
}

async function writeExtrasSafe(arr) {
  try {
    await extrasStore.setItem(EXTRAS_KEY, arr);
    return true;
  } catch (err) {
    console.error("Failed to write extras to IndexedDB:", err);
    return false;
  }
}

function flattenStatic(staticProducts) {
  return Array.isArray(staticProducts)
    ? staticProducts
    : Object.values(staticProducts).flat();
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [extras, setExtras] = useState([]); // only extras (for delete UI mapping)
  const staticArr = flattenStatic(STATIC_PRODUCTS);

  // load extras from extrasStore on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const stored = await readExtrasSafe();
      if (cancelled) return;
      setExtras(stored);
      setProducts([...staticArr, ...stored]);
      setLoading(false);
    }
    load();
    // listen for storage-like events (optional)
    const onStorage = () => {
      // refresh extras if changed in a different tab
      load();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // onProductAdd: called by AddProduct child. Persist to extrasStore and update state.
  const onProductAdd = useCallback(
    async (newProduct) => {
      if (!newProduct || !newProduct.name) return;
      // Get latest extras then append
      const currentExtras = await readExtrasSafe();
      // prevent duplicates by name (case-insensitive)
      const already = currentExtras.some(
        (p) => String(p.name || "").trim().toLowerCase() === String(newProduct.name || "").trim().toLowerCase()
      );
      if (already) {
        // still update UI to include static + extras (no change)
        setExtras(currentExtras);
        setProducts([...staticArr, ...currentExtras]);
        console.warn("Product already exists in extras (skipped):", newProduct.name);
        return { ok: false, reason: "duplicate" };
      }

      const updated = [...currentExtras, newProduct];
      const ok = await writeExtrasSafe(updated);
      if (ok) {
        setExtras(updated);
        setProducts((prev) => [...staticArr, ...updated]);
        return { ok: true };
      } else {
        // fallback: still update local UI but inform caller
        setExtras(updated);
        setProducts((prev) => [...staticArr, ...updated]);
        return { ok: false, reason: "persist_failed" };
      }
    },
    [staticArr]
  );

  // delete an extras item by index (index relative to extras array)
  const onDeleteExtra = useCallback(
    async (index) => {
      const current = await readExtrasSafe();
      if (!Array.isArray(current) || index < 0 || index >= current.length) {
        alert("Invalid index");
        return;
      }
      const kept = current.filter((_, i) => i !== index);
      const ok = await writeExtrasSafe(kept);
      if (!ok) {
        alert("Failed to remove item. See console.");
      }
      setExtras(kept);
      setProducts([...staticArr, ...kept]);
    },
    [staticArr]
  );

  return (
    <div className="admin-root" style={{ padding: 24 }}>
      <h1>Admin — Add Product</h1>

      <div style={{ marginBottom: 18 }}>
        <AddProduct onProductAdd={onProductAdd} />
      </div>

      <section className="admin-products" style={{ marginTop: 32 }}>
        <h2>All Products (static + extras)</h2>

        {loading ? (
          <div style={{ padding: 12, color: "#666" }}>Loading products…</div>
        ) : (
          <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {/* show static products first, mark them as static (cannot delete) */}
            {staticArr.map((p, idx) => (
              <div className="admin-card" key={"static-" + (p.name || idx)} style={{ background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                <div className="admin-img-wrap" style={{ height: 140, overflow: "hidden", borderRadius: 8 }}>
                  <img src={(p.images && p.images[0]) || p.img || "https://via.placeholder.com/300"} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="admin-body" style={{ marginTop: 10 }}>
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ color: "#666", marginTop: 6 }}>{p.weight}</div>
                  <div className="muted" style={{ color: "#666", fontSize: 13 }}>{Array.isArray(p.type) ? p.type.join(", ") : p.type}</div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#999" }}>Static product</div>
                </div>
              </div>
            ))}

            {/* extras (editable / deletable) */}
            {extras.map((p, i) => (
              <div className="admin-card" key={(p.name || "") + "-extra-" + i} style={{ background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
                <div className="admin-img-wrap" style={{ height: 140, overflow: "hidden", borderRadius: 8 }}>
                  <img src={(p.images && p.images[0]) || p.img || "https://via.placeholder.com/300"} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="admin-body" style={{ marginTop: 10 }}>
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ color: "#666", marginTop: 6 }}>{p.weight}</div>
                  <div className="muted" style={{ color: "#666", fontSize: 13 }}>{Array.isArray(p.type) ? p.type.join(", ") : p.type}</div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button
                      className="admin-delete"
                      onClick={() => {
                        // confirm before deleting
                        if (window.confirm(`Delete product "${p.name}" from extras? This cannot be undone (from UI).`)) {
                          onDeleteExtra(i);
                        }
                      }}
                      style={{ padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid #e6e6e6", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {extras.length === 0 && staticArr.length === 0 && (
              <div style={{ color: "#666" }}>No products found.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
