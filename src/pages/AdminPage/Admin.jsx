// src/pages/Admin/Admin.jsx
import React, { useEffect, useState, useCallback } from "react";
import localforage from "localforage";
import AddProduct from "./AddProduct/AddProduct"; 
import { PRODUCTS as STATIC_PRODUCTS } from "../../data/productData";
import "./Admin.css";

/*
  Admin shows:
   - staticArr (static products from code) — cannot delete
   - serverProducts (fetched from backend) — can delete (deletes from DB)
   - extras (localforage) — local-only, deletable locally
*/

const EXTRAS_KEY = "extraProductsList";

// local extras store
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
    try {
      const bc = new BroadcastChannel("joesbakery_extras");
      bc.postMessage("changed");
      bc.close();
    } catch {}
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
  const [extras, setExtras] = useState([]);
  const [serverProducts, setServerProducts] = useState([]);
  const staticArr = flattenStatic(STATIC_PRODUCTS);

  // always use relative API path so it works on Railway and locally with CRA proxy
  const API_BASE = process.env.REACT_APP_API_URL || "";
  const API_PREFIX = API_BASE ? API_BASE.replace(/\/$/, "") : "";

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      const [stored, serverRes] = await Promise.all([
        readExtrasSafe(),
        (async () => {
          try {
            const r = await fetch(`${API_PREFIX}/api/products`);
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

    // BroadcastChannel for extras sync across tabs
    let bc;
    try {
      bc = new BroadcastChannel("joesbakery_extras");
      bc.onmessage = (ev) => {
        if (ev.data === "changed") {
          readExtrasSafe().then((s) => setExtras(s));
        }
      };
    } catch {}

    return () => {
      cancelled = true;
      try {
        if (bc) bc.close();
      } catch {}
    };
  }, [API_PREFIX]);

  const onProductAdd = useCallback(async (newProduct) => {
    if (!newProduct || !newProduct.name) return { ok: false, reason: "invalid" };

    if (newProduct.id) {
      setServerProducts((prev) => {
        if (prev.some((p) => p.id === newProduct.id)) return prev;
        return [newProduct, ...prev];
      });
      return { ok: true, product: newProduct };
    }

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
        setExtras(updated);
        return { ok: false, reason: "persist_failed" };
      }
    } catch (err) {
      console.error("Add product fallback error:", err);
      return { ok: false, reason: "error" };
    }
  }, []);

  const onDeleteServerProduct = useCallback(
    async (id, name) => {
      if (!id) return;
      if (!window.confirm(`Delete product "${name}" (from database)?`)) return;
      try {
        const r = await fetch(`${API_PREFIX}/api/products/${id}`, { method: "DELETE" });
        if (!r.ok) {
          console.error("Delete failed:", r.status);
          alert("Failed to delete product (see console).");
          return;
        }
        setServerProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Delete server product error:", err);
        alert("Failed to delete product (see console).");
      }
    },
    [API_PREFIX]
  );

  const onDeleteExtra = useCallback(async (index) => {
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
  }, []);

  return (
    <div className="admin-root" style={{ padding: 24 }}>
      <h1>Admin — Add Product</h1>

      <div style={{ marginBottom: 12, color: "#666" }}>
        Note: database products are saved on the server. Extras are stored only in your browser.
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
              <AdminCard key={"static-" + idx} p={p} label="Static product" />
            ))}

            {/* server products */}
            {serverProducts.map((p) => (
              <AdminCard
                key={"server-" + p.id}
                p={p}
                onDelete={() => onDeleteServerProduct(p.id, p.name)}
                deleteLabel="Delete (DB)"
              />
            ))}

            {/* local extras */}
            {extras.map((p, i) => (
              <AdminCard
                key={"extra-" + i}
                p={p}
                onDelete={() => onDeleteExtra(i)}
                deleteLabel="Delete (Local)"
              />
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

function AdminCard({ p, label, onDelete, deleteLabel }) {
  return (
    <div
      className="admin-card"
      style={{
        background: "#fff",
        padding: 12,
        borderRadius: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      }}
    >
      <div className="admin-img-wrap" style={{ height: 140, overflow: "hidden", borderRadius: 8 }}>
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
        {label && <div style={{ marginTop: 8, fontSize: 13, color: "#999" }}>{label}</div>}
        {onDelete && (
          <div style={{ marginTop: 10 }}>
            <button
              className="admin-delete"
              onClick={onDelete}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "#fff",
                border: "1px solid #e6e6e6",
                cursor: "pointer",
              }}
            >
              {deleteLabel || "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
