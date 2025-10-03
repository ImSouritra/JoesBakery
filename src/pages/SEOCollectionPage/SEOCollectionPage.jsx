import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import slugify from "slugify";
import ProductImage from "../../components/ProductImage";
import vegIcon from "../../assets/images/veg-icon.svg";
import { getSeoCollection, resolveCollectionProducts } from "../../data/seoCollections";
import "./SEOCollectionPage.css";

// Mirrors logic used in other pages for product slug linking
const productSlug = (name) => slugify(name, { lower: true });

export default function SEOCollectionPage({ products: propProducts }) {
  const { seoSlug } = useParams();
  const collection = getSeoCollection(seoSlug);

  // Local state for sort & filters (matching BestSellersPage UX)
  const [sortBy, setSortBy] = useState("featured");
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterNonVeg, setFilterNonVeg] = useState(false);
  const [filterNewOnly, setFilterNewOnly] = useState(false);

  // Resolve products: prefer live products (propProducts) to keep pricing fresh, fallback to static resolution
  const resolvedStatic = useMemo(() => resolveCollectionProducts(collection), [collection]);
  const liveProductsBySlug = useMemo(() => {
    if (!Array.isArray(propProducts)) return {};
    return propProducts.reduce((acc, p) => {
      acc[productSlug(p.name)] = p; return acc;
    }, {});
  }, [propProducts]);

  const allProducts = useMemo(() => {
    if (!collection) return [];
    return collection.productSlugs.map(ps => liveProductsBySlug[ps] || resolvedStatic.find(p => productSlug(p.name) === ps)).filter(Boolean);
  }, [collection, liveProductsBySlug, resolvedStatic]);

  // Sorting logic (duplicated intentionally for consistency; could be abstracted later)
  const sorted = useMemo(() => {
    const copy = [...allProducts];
    if (sortBy === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "weight") {
      const parseW = (w) => {
        if (!w) return 0; const s = String(w).toUpperCase().trim();
        const m = s.match(/([\d.]+)/); if (!m) return 0; let n = parseFloat(m[1]);
        if (s.includes("KG")) n = n * 1000; return isNaN(n) ? 0 : n; };
      copy.sort((a, b) => parseW(a.weight) - parseW(b.weight));
    }
    if (sortBy === "healthy") {
      copy.sort((a, b) => {
        const types = (p) => Array.isArray(p.type) ? p.type.map(t => String(t).toLowerCase()) : [];
        const aH = types(a).includes("healthy");
        const bH = types(b).includes("healthy");
        if (aH && !bH) return -1; if (!aH && bH) return 1; return 0;
      });
    }
    return copy;
  }, [allProducts, sortBy]);

  const filtered = useMemo(() => {
    return sorted.filter(p => {
      if (filterVeg === false && filterNonVeg === false) {
        // show all
      } else {
        if (filterVeg && !filterNonVeg && !p.is_veg) return false;
        if (!filterVeg && filterNonVeg && p.is_veg) return false;
      }
      if (filterNewOnly) {
        const types = Array.isArray(p.type) ? p.type.map(t => String(t).toLowerCase()) : [];
        if (!types.includes("new")) return false;
      }
      return true;
    });
  }, [sorted, filterVeg, filterNonVeg, filterNewOnly]);

  // Meta handling
  useEffect(() => {
    if (!collection) return;
    if (collection.meta?.title) document.title = collection.meta.title;
    // Description tag
    if (collection.meta?.description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) { tag = document.createElement('meta'); tag.name = 'description'; document.head.appendChild(tag); }
      tag.content = collection.meta.description;
    }
  }, [collection]);

  if (!collection) {
    return (
      <div className="seo-collection-missing">
        <div className="container-small">
          <h1>Collection Not Found</h1>
          <p>The requested guide does not exist. Try exploring our popular selections below.</p>
          <Link to="/best-sellers" className="btn-inline">View Best Sellers</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="seo-collection-page">
      <div className="seo-hero">
        <div className="seo-hero-inner">
          <div className="seo-breadcrumbs">
            <Link to="/">Home</Link> <span> / </span>
            <Link to="/guide/" onClick={(e)=> e.preventDefault()}>Guides</Link> <span> / </span>
            <span>{collection.h1}</span>
          </div>
          <h1 className="seo-title">{collection.h1}</h1>
          {collection.subtitle && <p className="seo-sub">{collection.subtitle}</p>}
        </div>
      </div>

      <div className="seo-content">
        <aside className="seo-sidebar" aria-label="Filters">
          <div className="seo-filter-block">
            <h4>Filter</h4>
            <div className="seo-filter-row">
              <label>
                <input type="checkbox" checked={filterVeg} onChange={e => setFilterVeg(e.target.checked)} /> Veg
              </label>
            </div>
            <div className="seo-filter-row">
              <label>
                <input type="checkbox" checked={filterNonVeg} onChange={e => setFilterNonVeg(e.target.checked)} /> Non-Veg
              </label>
            </div>
            <div className="seo-filter-row">
              <label>
                <input type="checkbox" checked={filterNewOnly} onChange={e => setFilterNewOnly(e.target.checked)} /> New Arrivals
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => { setFilterVeg(false); setFilterNonVeg(false); setFilterNewOnly(false); }}
                style={{ background: 'transparent', border: '1px solid #e6e6e6', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
                Clear filters
              </button>
            </div>
          </div>

          {collection.faq?.length > 0 && (
            <div className="seo-faq-block">
              <h4>FAQs</h4>
              <ul className="seo-faq-list">
                {collection.faq.map((f, i) => (
                  <li key={i} className="seo-faq-item">
                    <strong>{f.q}</strong>
                    <p>{f.a}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <main className="seo-main">
          <div className="seo-controls">
            <div className="seo-count">{filtered.length} products</div>
            <div className="seo-sort">
              <label>Sort by</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="weight">Weight</option>
                <option value="healthy">Healthy</option>
              </select>
            </div>
          </div>

          <div className="seo-product-grid" role="list">
            {filtered.map(p => (
              <article key={p.name} className="seo-product-card" role="listitem">
                <Link to={`/favorites/${productSlug(p.name)}`} className="seo-product-link">
                  <div className="seo-product-media">
                    <ProductImage
                      imageKey={(p.images && p.images[0]) || p.img || ''}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      placeholder={<div style={{ background: '#f7f7f7', width: '100%', height: '100%' }} />}
                    />
                    {p.is_veg && (
                      <span className="seo-product-badge veg">
                        <img src={vegIcon} alt="Vegetarian" className="seo-product-badge-img" />
                      </span>
                    )}
                  </div>
                  <div className="seo-product-body">
                    <h3 className="seo-product-name">{p.name}</h3>
                    {p.weight && <div className="seo-product-meta">{p.weight}</div>}
                    {p.price && <div className="seo-product-price">₹{p.price}</div>}
                  </div>
                </Link>
              </article>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 10px', color: '#775' }}>
                <p style={{ margin: 0 }}>No products matched this collection{(filterVeg||filterNonVeg||filterNewOnly)?' & current filters':''}.</p>
              </div>
            )}
          </div>

          {collection.faq?.length > 0 && (
            <section className="seo-faq-mobile">
              <h2>Frequently Asked Questions</h2>
              <div className="seo-faq-accordion">
                {collection.faq.map((f, i) => (
                  <details key={i} className="seo-faq-accordion-item">
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
