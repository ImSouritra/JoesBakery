
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import slugify from "slugify";
import { PRODUCTS as STATIC_PRODUCTS } from "../../data/productData";
import ProductImage from "../../components/ProductImage";
import "./BestSellersPage.css";

export default function BestSellersPage({ products: propProducts }) {
  const [sortBy, setSortBy] = useState("featured");
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterNonVeg, setFilterNonVeg] = useState(false);
  const [filterNewOnly, setFilterNewOnly] = useState(false);

  // Use passed products or fallback to static
  const allProducts = useMemo(() => {
    if (Array.isArray(propProducts) && propProducts.length) return propProducts;
    return Array.isArray(STATIC_PRODUCTS) ? STATIC_PRODUCTS : Object.values(STATIC_PRODUCTS).flat();
  }, [propProducts]);

  // Only best-sellers
  const matchedByType = useMemo(() => {
    return allProducts.filter(
      (p) => Array.isArray(p.type) && p.type.map((t) => String(t).toLowerCase()).includes("bestseller")
    );
  }, [allProducts]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...matchedByType];
    if (sortBy === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "weight") {
      const parseW = (w) => {
        if (!w) return 0;
        const s = String(w).toUpperCase().trim();
        const m = s.match(/([\d.]+)/);
        if (!m) return 0;
        let n = parseFloat(m[1]);
        if (s.includes("KG")) n = n * 1000;
        return isNaN(n) ? 0 : n;
      };
      copy.sort((a, b) => parseW(a.weight) - parseW(b.weight));
    }
    if (sortBy === "healthy") {
      copy.sort((a, b) => {
        const aHealthy = Array.isArray(a.type) && a.type.map((t) => String(t).toLowerCase()).includes("healthy");
        const bHealthy = Array.isArray(b.type) && b.type.map((t) => String(t).toLowerCase()).includes("healthy");
        if (aHealthy && !bHealthy) return -1;
        if (!aHealthy && bHealthy) return 1;
        return 0;
      });
    }
    return copy;
  }, [matchedByType, sortBy]);

  // Filters
  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      if (filterVeg === false && filterNonVeg === false) {
        // show all
      } else {
        if (filterVeg && !filterNonVeg && !p.isVeg) return false;
        if (!filterVeg && filterNonVeg && p.isVeg) return false;
      }
      if (filterNewOnly) {
        const types = Array.isArray(p.type) ? p.type.map((t) => String(t).toLowerCase()) : [];
        if (!types.includes("new")) return false;
      }
      return true;
    });
  }, [sorted, filterVeg, filterNonVeg, filterNewOnly]);

  const prettyTitle = "Best Sellers";

  return (
    <div className="cat-root">
      <div className="cat-hero">
        <div className="cat-hero-inner">
          <div className="cat-breadcrumbs">
            <Link to="/">Home</Link> <span> / </span>
            <span>{prettyTitle}</span>
          </div>
          <h1 className="cat-title">{prettyTitle}</h1>
          <p className="cat-sub">Our most popular cakes, loved by everyone!</p>
        </div>
      </div>

      <div className="cat-content">
        <aside className="cat-sidebar" aria-label="Filters">
          <div className="filter-block">
            <h4>Filter</h4>
            <div className="filter-row">
              <label>
                <input
                  type="checkbox"
                  checked={filterVeg}
                  onChange={(e) => setFilterVeg(e.target.checked)}
                /> Veg
              </label>
            </div>
            <div className="filter-row">
              <label>
                <input
                  type="checkbox"
                  checked={filterNonVeg}
                  onChange={(e) => setFilterNonVeg(e.target.checked)}
                /> Non-Veg
              </label>
            </div>
            <div className="filter-row">
              <label>
                <input
                  type="checkbox"
                  checked={filterNewOnly}
                  onChange={(e) => setFilterNewOnly(e.target.checked)}
                /> New Arrivals
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => {
                  setFilterVeg(false);
                  setFilterNonVeg(false);
                  setFilterNewOnly(false);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #e6e6e6",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        </aside>

        <main className="cat-main">
          <div className="cat-controls">
            <div className="cat-count">{filtered.length} products</div>
            <div className="cat-sort">
              <label>Sort by</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="weight">Weight</option>
                <option value="healthy">Healthy</option>
              </select>
            </div>
          </div>

          <div className="product-grid" role="list">
            {filtered.map((p) => (
              <article key={p.name} className="product-card" role="listitem">
                <Link
                  to={`/product/${slugify(p.name, { lower: true })}`}
                  className="product-link"
                >
                  <div className="product-media">
                    <ProductImage
                      imageKey={(p.images && p.images[0]) || p.img || ""}
                      alt={p.name}
                      className=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      placeholder={<div style={{ background: "#f7f7f7", width: "100%", height: "100%" }} />}
                    />
                    {p.isVeg && <span className="product-badge veg">Veg</span>}
                  </div>
                  <div className="product-body">
                    <h3 className="product-name">{p.name}</h3>
                    {p.weight && <div className="product-meta">{p.weight}</div>}
                    {p.price && <div className="product-price">₹{p.price}</div>}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
