// src/pages/Admin/Admin.jsx
import React, { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../../config";
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

// Minimal fetch helper
async function fetchJSON(url, opts){
  const r = await fetch(url, opts);
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

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
  
  // Modal editing state
  const [editing,setEditing]=useState(null); // product being edited
  const [form,setForm]=useState({});
  const [removeImages,setRemoveImages]=useState([]);
  const [newExternal,setNewExternal]=useState('');
  const [externalList,setExternalList]=useState([]);
  const [newFiles,setNewFiles]=useState([]);

  // Centralized API base imported from src/config.js
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

  // Modal editing functions
  const PREDEFINED_TYPES = ["classic","new","healthy","cake","brownie","cookie","cup_cake","mousse","teacake","bestseller"];
  const TYPE_LABELS = { cup_cake: "Cup Cakes" };

  const openEdit=useCallback(p=>{
    setEditing(p);
    setForm({
      name:p.name||'',
      weight:p.weight||'',
      description:p.description||'',
      ingredients:p.ingredients||'',
      delivery_instructions:p.delivery_instructions||'',
      isVeg: !!p.is_veg,
      // keep an internal array for selected types; store also as string for legacy reference if needed
      typeList: Array.isArray(p.type)? p.type.filter(Boolean): (p.type? [p.type]: []),
      type: Array.isArray(p.type)? p.type.join(', '): (p.type||'')
    });
    setRemoveImages([]);
    setExternalList([]);
    setNewExternal('');
    setNewFiles([]);
  },[]);

  const closeEdit=()=>{ setEditing(null); };

  function updateField(k,v){ setForm(f=>({...f,[k]:v})); }

  function toggleTypeEdit(t){
    setForm(f=>{
      const list = Array.isArray(f.typeList)? [...f.typeList]: [];
      const idx = list.indexOf(t);
      if(idx>-1){ list.splice(idx,1); } else { list.push(t); }
      return { ...f, typeList:list, type:list.join(', ') };
    });
  }

  function toggleRemove(img){ setRemoveImages(arr=> arr.includes(img)? arr.filter(i=>i!==img): [...arr,img]); }

  function addExternal(){ if(!newExternal.trim()) return; setExternalList(l=>[...l,newExternal.trim()]); setNewExternal(''); }
  function removeExternal(u){ setExternalList(l=>l.filter(x=>x!==u)); }

  async function submitEdit(){
    if(!editing) return;
    const hasFiles = newFiles.length>0;
    let data;
    let headers={};
    if(hasFiles){
      data = new FormData();
      if(form.name.trim()) data.append('name', form.name.trim());
      data.append('isVeg', form.isVeg? 'true':'false');
      if(form.weight) data.append('weight', form.weight);
      if(form.description) data.append('description', form.description);
      if(form.ingredients) data.append('ingredients', form.ingredients);
      if(form.delivery_instructions) data.append('delivery_instructions', form.delivery_instructions);
      if(form.type) data.append('type', JSON.stringify(form.type.split(',').map(s=>s.trim()).filter(Boolean)));
      if(removeImages.length) data.append('removeImageUrls', JSON.stringify(removeImages));
      if(externalList.length) data.append('imageUrls', JSON.stringify(externalList));
      newFiles.forEach(f=> data.append('images', f));
    } else {
      const payload={};
      ['name','weight','description','ingredients','delivery_instructions'].forEach(k=>{ if(form[k]) payload[k]=form[k]; });
      payload.isVeg = form.isVeg;
      if(form.type) payload.type = form.type.split(',').map(s=>s.trim()).filter(Boolean);
      if(removeImages.length) payload.removeImageUrls = removeImages;
      if(externalList.length) payload.imageUrls = externalList;
      data = JSON.stringify(payload);
      headers['Content-Type']='application/json';
    }
    try{
      const updated = await fetchJSON(`${API_PREFIX}/api/products/${editing.id}`, { method:'PUT', headers, body:data });
      setServerProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...updated.product } : p));
      closeEdit();
    }catch(e){ alert('Update failed: '+ e.message); }
  }

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
                onEdit={() => openEdit(p)}
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

      {/* Modal for editing */}
      {editing && <div className='edit-modal-overlay'>
        <div className='edit-modal'>
          <button className='close-btn' onClick={closeEdit}>✕</button>
          <h3>Edit Product</h3>
          <form onSubmit={e=>{e.preventDefault(); submitEdit();}}>
            <div className='edit-row'>
              <div className='field'>
                <label>Name</label>
                <input value={form.name} onChange={e=>updateField('name', e.target.value)} />
              </div>
              <div className='field'>
                <label>Weight</label>
                <input value={form.weight} onChange={e=>updateField('weight', e.target.value)} />
              </div>
            </div>
            <div className='edit-row'>
              <div className='field'>
                <label>Types</label>
                <div className='types-row'>
                  {PREDEFINED_TYPES.map(t=>{
                    const active = Array.isArray(form.typeList) && form.typeList.includes(t);
                    return <button type='button' key={t} className={`type-pill ${active? 'active':''}`} onClick={()=>toggleTypeEdit(t)}>{TYPE_LABELS[t]||t}</button>;
                  })}
                </div>
                <div className='edit-tags-hint'>Select one or more categories.</div>
              </div>
              <div className='field'>
                <label>Veg?</label>
                <div className='inline-checkbox'>
                  <input type='checkbox' checked={form.isVeg} onChange={e=>updateField('isVeg', e.target.checked)} /> <span>Is Vegetarian</span>
                </div>
              </div>
            </div>
            <div className='field'>
              <label>Description</label>
              <textarea value={form.description} onChange={e=>updateField('description', e.target.value)} />
            </div>
            <div className='field'>
              <label>Ingredients</label>
              <textarea value={form.ingredients} onChange={e=>updateField('ingredients', e.target.value)} />
            </div>
            <div className='field'>
              <label>Delivery Instructions</label>
              <textarea value={form.delivery_instructions} onChange={e=>updateField('delivery_instructions', e.target.value)} />
            </div>
            <div className='field'>
              <label>Existing Images (click X to mark remove)</label>
              <div className='image-grid'>
                {(editing.images||[]).map(img=> <div key={img} className='image-chip'> <img src={img} alt=''/> <button type='button' onClick={()=>toggleRemove(img)} style={removeImages.includes(img)?{background:'#b91d1d'}:undefined}>×</button> </div>)}
              </div>
              {removeImages.length>0 && <div className='removal-list'>Will remove: {removeImages.length}</div>}
            </div>
            <div className='field'>
              <label>Add New Image Files</label>
              <input type='file' multiple accept='image/*' onChange={e=> setNewFiles(Array.from(e.target.files||[]))} className='add-images-input'/>
              {newFiles.length>0 && <div style={{fontSize:'0.7rem'}}>{newFiles.length} file(s) selected</div>}
            </div>
            <div className='field external-urls'>
              <label>Add External Image URLs</label>
              <div style={{display:'flex', gap:6}}>
                <input type='text' value={newExternal} onChange={e=>setNewExternal(e.target.value)} placeholder='https://...' />
                <button type='button' className='btn btn-secondary' onClick={addExternal}>Add</button>
              </div>
              {externalList.length>0 && <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                {externalList.map(u=> <span key={u} style={{background:'#eef1ff', padding:'4px 8px', borderRadius:20, fontSize:'0.65rem'}}>{u} <button type='button' onClick={()=>removeExternal(u)} style={{marginLeft:4,border:'none',background:'transparent',cursor:'pointer'}}>×</button></span>)}
              </div>}
              <small>Added URLs will be appended as images.</small>
            </div>
            <div className='modal-actions'>
              <button type='button' className='btn btn-secondary' onClick={closeEdit}>Cancel</button>
              <button type='submit' className='btn btn-primary'>Save Changes</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}

function AdminCard({ p, label, onDelete, deleteLabel, onEdit }) {
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
        {(onDelete || onEdit) && (
          <div className="admin-actions">
            {onEdit && (
              <button className="admin-edit" onClick={onEdit}>
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button className="admin-delete" onClick={onDelete}>
                {deleteLabel || "Delete"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
