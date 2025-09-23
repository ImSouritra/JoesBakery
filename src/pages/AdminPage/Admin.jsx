// src/pages/Admin/Admin.jsx
import React, { useEffect, useState, useCallback } from "react";
import localforage from "localforage";
import AddProduct from "./AddProduct/AddProduct"; // <-- path to your AddProduct component
import { PRODUCTS as STATIC_PRODUCTS } from "../../data/productData"; // adjust path
import "./Admin.css";

/*
  Admin shows:
   - staticArr (static products from code) — cannot delete
   - serverProducts (fetched from backend) — can delete (deletes from DB)
   - extras (localforage) — local-only, deletable locally
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
    // broadcast change to other tabs
    try {
      const bc = new BroadcastChannel("joesbakery_extras");
      bc.postMessage("changed");
      bc.close();
    } catch (e) {
      /* ignore */
    }
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
  const [extras, setExtras] = useState([]); // local extras
  const [serverProducts, setServerProducts] = useState([]); // products from backend
  const staticArr = flattenStatic(STATIC_PRODUCTS);

  const API =
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API_URL_BASE ||
    "http://localhost:5000";

  // load extras + server products on mount
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      const [stored, serverRes] = await Promise.all([
        readExtrasSafe(),
        (async () => {
          try {
            const r = await fetch(`${API}/api/products`);
            if (!r.ok) return [];
            const body = await r.json();
            return body.products || [];
          } catch (e) {
            console.warn("Failed to fetch server products:", e);
            return [];
          }
        })(),
      ]);
      if (cancelled) return;
      setExtras(stored);
      setServerProducts(serverRes);
      setLoading(false);
    }
    loadAll();

    // BroadcastChannel to receive extras changes from other tabs
    let bc;
    try {
      bc = new BroadcastChannel("joesbakery_extras");
      bc.onmessage = (ev) => {
        if (ev.data === "changed") {
          readExtrasSafe().then((s) => setExtras(s));
        }
      };
    } catch (e) {
      // not available - ignore
    }

    return () => {
      cancelled = true;
      try {
        if (bc) bc.close();
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  // Called by AddProduct after server returns new product OR when adding local-only
  const onProductAdd = useCallback(
    async (newProduct) => {
      if (!newProduct || !newProduct.name) return { ok: false, reason: "invalid" };

      // If server created product returned with an id, add to serverProducts state
      if (newProduct.id) {
        // Prevent duplicate id
        setServerProducts((prev) => {
          if (prev.some((p) => p.id === newProduct.id)) return prev;
          return [newProduct, ...prev];
        });
        return { ok: true, product: newProduct };
      }

      // Otherwise fallback to local extras (existing behaviour)
      try {
        const currentExtras = await readExtrasSafe();
        const already = currentExtras.some(
          (p) =>
            String(p.name || "").trim().toLowerCase() ===
            String(newProduct.name || "").trim().toLowerCase()
        );
        if (already) {
          setExtras(currentExtras);
          return { ok: false, reason: "duplicate" };
        }
        const updated = [...currentExtras, newProduct];
        const ok = await writeExtrasSafe(updated);
        if (ok) {
          setExtras(updated);
          return { ok: true, product: newProduct };
        } else {
          // fallback UI update
          setExtras(updated);
          return { ok: false, reason: "persist_failed" };
        }
      } catch (err) {
        console.error("Add product fallback error:", err);
        return { ok: false, reason: "error" };
      }
    },
    [setServerProducts, setExtras]
  );

  // Delete server product by id -> calls backend to remove from DB (and storage)
  const onDeleteServerProduct = useCallback(
    async (id, name) => {
      if (!id) return;
      if (!window.confirm(`Delete product "${name}" (this will remove it from the database)?`)) return;
      try {
        const r = await fetch(`${API}/api/products/${id}`, { method: "DELETE" });
        if (!r.ok) {
          const body = await r.text().catch(() => null);
          console.error("Delete failed:", r.status, body);
          alert("Failed to delete product (see console).");
          return;
        }
        // remove from state
        setServerProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Delete server product error:", err);
        alert("Failed to delete product (see console).");
      }
    },
    [API]
  );

  // delete an extras item by index (index relative to extras array)
  const onDeleteExtra = useCallback(
    async (index) => {
      const current = await readExtrasSafe();
      if (!Array.isArray(current) || index < 0 || index >= current.length) {
        alert("Invalid index");
        return;
      }
      if (!window.confirm(`Delete local product "${current[index].name}"?`)) return;
      const kept = current.filter((_, i) => i !== index);
      const ok = await writeExtrasSafe(kept);
      if (!ok) {
        alert("Failed to remove item. See console.");
        return;
      }
      setExtras(kept);
    },
    [setExtras]
  );

  return (
    <div className="admin-root" style={{ padding: 24 }}>
      <h1>Admin — Add Product</h1>

      <div style={{ marginBottom: 12, color: "#666" }}>
        Note: products created via the backend are saved to the database. Items saved locally are stored in your browser only.
      </div>

      <div style={{ marginBottom: 18 }}>
        <AddProduct onProductAdd={onProductAdd} />
      </div>

      <section className="admin-products" style={{ marginTop: 32 }}>
        <h2>All Products (static + server + local)</h2>

        {loading ? (
          <div style={{ padding: 12, color: "#666" }}>Loading products…</div>
        ) : (
          <div
            className="admin-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {/* static products */}
            {staticArr.map((p, idx) => (
              <div
                className="admin-card"
                key={"static-" + (p.name || idx)}
                style={{
                  background: "#fff",
                  padding: 12,
                  borderRadius: 10,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="admin-img-wrap"
                  style={{ height: 140, overflow: "hidden", borderRadius: 8 }}
                >
                  <img
                    src={(p.images && p.images[0]) || p.img || "https://via.placeholder.com/300"}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="admin-body" style={{ marginTop: 10 }}>
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ color: "#666", marginTop: 6 }}>
                    {p.weight}
                  </div>
                  <div className="muted" style={{ color: "#666", fontSize: 13 }}>
                    {Array.isArray(p.type) ? p.type.join(", ") : p.type}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#999" }}>Static product</div>
                </div>
              </div>
            ))}

            {/* server products (deletable in DB) */}
            {serverProducts.map((p, i) => (
              <div
                className="admin-card"
                key={(p.name || "") + "-server-" + (p.id || i)}
                style={{
                  background: "#fff",
                  padding: 12,
                  borderRadius: 10,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="admin-img-wrap"
                  style={{ height: 140, overflow: "hidden", borderRadius: 8 }}
                >
                  <img
                    src={(p.images && p.images[0]) || p.img || "https://via.placeholder.com/300"}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="admin-body" style={{ marginTop: 10 }}>
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ color: "#666", marginTop: 6 }}>
                    {p.weight}
                  </div>
                  <div className="muted" style={{ color: "#666", fontSize: 13 }}>
                    {Array.isArray(p.type) ? p.type.join(", ") : p.type}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button
                      className="admin-delete"
                      onClick={() => onDeleteServerProduct(p.id, p.name)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "#fff",
                        border: "1px solid #e6e6e6",
                        cursor: "pointer",
                      }}
                    >
                      Delete (DB)
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* extras (editable / deletable) */}
            {extras.map((p, i) => (
              <div
                className="admin-card"
                key={(p.name || "") + "-extra-" + i}
                style={{
                  background: "#fff",
                  padding: 12,
                  borderRadius: 10,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="admin-img-wrap"
                  style={{ height: 140, overflow: "hidden", borderRadius: 8 }}
                >
                  <img
                    src={(p.images && p.images[0]) || p.img || "https://via.placeholder.com/300"}
                    alt={p.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="admin-body" style={{ marginTop: 10 }}>
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ color: "#666", marginTop: 6 }}>
                    {p.weight}
                  </div>
                  <div className="muted" style={{ color: "#666", fontSize: 13 }}>
                    {Array.isArray(p.type) ? p.type.join(", ") : p.type}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button
                      className="admin-delete"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete product "${p.name}" from extras? This cannot be undone (from UI).`
                          )
                        ) {
                          onDeleteExtra(i);
                        }
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "#fff",
                        border: "1px solid #e6e6e6",
                        cursor: "pointer",
                      }}
                    >
                      Delete (Local)
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {serverProducts.length === 0 && extras.length === 0 && staticArr.length === 0 && (
              <div style={{ color: "#666" }}>No products found.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
