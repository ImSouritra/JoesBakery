// src/pages/SEOCollectionPage/SEOCollectionPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import slugify from "slugify";
import ProductImage from "../../components/ProductImage";
import vegIcon from "../../assets/images/veg-icon.svg";
import { getSeoCollection, SEO_COLLECTIONS } from "../../data/seoCollections";
import "./SEOCollectionPage.css";

const productSlug = (name) => slugify(String(name || ""), { lower: true });

const deriveLiveProductSlug = (p) => {
  const cands = [
    p?.slug,
    p?.slugified,
    p?.product_slug,
    p?.name,
    p?.title,
    p?.product_name,
    p?.productName,
    p?.displayName,
  ];
  for (const raw of cands) {
    if (!raw && raw !== 0) continue;
    const s = String(raw)
      .replace(/\s+/g, " ")
      .split("")
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join("")
      .trim();
    if (s) return productSlug(s);
  }
  return "";
};

const parseWeightToGrams = (w) => {
  if (!w) return 0;
  const s = String(w).toUpperCase().trim();
  const m = s.match(/([\d.]+)/);
  let n = m ? parseFloat(m[1]) : 0;
  if (s.includes("KG")) n *= 1000;
  return isNaN(n) ? 0 : n;
};

const inferTypesFromSlug = (slug) => {
  const s = String(slug || "").toLowerCase();
  const map = [
    ["cake", "cake"],
    ["cupcake", "cup_cake"],
    ["cup", "cup_cake"],
    ["cookie", "cookie"],
    ["brownie", "brownie"],
    ["diwali", "cookie"],
    ["healthy", "healthy"],
    ["bestseller", "bestseller"],
  ];
  return map.filter(([k]) => s.includes(k)).map(([, t]) => t);
};

export default function SEOCollectionPage({ products: propProducts }) {
  const { seoSlug } = useParams();
  const collection = useMemo(() => getSeoCollection(seoSlug), [seoSlug]);

  const [sortBy, setSortBy] = useState("featured");
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterNonVeg, setFilterNonVeg] = useState(false);
  const [filterNewOnly, setFilterNewOnly] = useState(false);

  const liveBySlug = useMemo(() => {
    const map = {};
    (propProducts || []).forEach((p) => {
      const s = deriveLiveProductSlug(p);
      if (s) map[s] = p;
    });
    return map;
  }, [propProducts]);

  const liveByType = useMemo(() => {
    const map = {};
    (propProducts || []).forEach((p) => {
      const types = Array.isArray(p.type)
        ? p.type.map((t) => String(t).toLowerCase())
        : [];
      types.forEach((t) => {
        if (!map[t]) map[t] = [];
        map[t].push(p);
      });
    });
    return map;
  }, [propProducts]);

  const otherGuides = useMemo(() => {
    if (!collection) return [];
    return (SEO_COLLECTIONS || [])
      .filter((c) => c.slug !== collection.slug)
      .map((c) => ({ slug: c.slug, h1: c.h1, subtitle: c.subtitle }));
  }, [collection]);

  const allProducts = useMemo(() => {
    if (!collection) return [];

    const dedupe = (arr) => {
      const seen = new Set();
      return arr.filter((p) => {
        const s =
          deriveLiveProductSlug(p) ||
          productSlug(p.name || p.title || p.product_name || "");
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
      });
    };

    if (Array.isArray(collection.productTypes) && collection.productTypes.length) {
      const items = collection.productTypes.flatMap(
        (t) => liveByType[String(t).toLowerCase()] || []
      );
      return dedupe(items);
    }

    if (Array.isArray(collection.productSlugs) && collection.productSlugs.length) {
      const items = collection.productSlugs
        .map((s) => liveBySlug[s])
        .filter(Boolean);
      if (items.length <= 2) {
        const inferred = inferTypesFromSlug(collection.slug || collection.h1);
        const supplemental = inferred.flatMap((t) => liveByType[t] || []);
        return dedupe([...items, ...supplemental]);
      }
      return dedupe(items);
    }

    const inferred = inferTypesFromSlug(collection.slug || collection.h1);
    if (inferred.length) {
      const items = inferred.flatMap((t) => liveByType[t] || []);
      return dedupe(items);
    }

    return [];
  }, [collection, liveBySlug, liveByType]);

  const sorted = useMemo(() => {
    const copy = [...allProducts];
    if (sortBy === "name") {
      copy.sort((a, b) =>
        String(a.name || a.title || "").localeCompare(
          String(b.name || b.title || "")
        )
      );
    } else if (sortBy === "weight") {
      copy.sort(
        (a, b) => parseWeightToGrams(a.weight) - parseWeightToGrams(b.weight)
      );
    } else if (sortBy === "healthy") {
      const score = (p) =>
        Array.isArray(p.type)
          ? p.type.map((t) => String(t).toLowerCase()).includes("healthy")
          : false;
      copy.sort((a, b) =>
        score(a) === score(b) ? 0 : score(a) ? -1 : 1
      );
    }
    return copy;
  }, [allProducts, sortBy]);

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      if (filterVeg || filterNonVeg) {
        if (filterVeg && !filterNonVeg && !p.is_veg) return false;
        if (!filterVeg && filterNonVeg && p.is_veg) return false;
      }
      if (filterNewOnly) {
        const types = Array.isArray(p.type)
          ? p.type.map((t) => String(t).toLowerCase())
          : [];
        if (!types.includes("new")) return false;
      }
      return true;
    });
  }, [sorted, filterVeg, filterNonVeg, filterNewOnly]);

  useEffect(() => {
    if (!collection) return;
    if (collection.meta?.title) document.title = collection.meta.title;
    if (collection.meta?.description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
      }
      tag.content = collection.meta.description;
    }
  }, [collection]);

  if (!collection) {
    return (
      <div className="seo-collection-missing">
        <div className="container-small">
          <h1>Collection Not Found</h1>
          <p>
            The requested guide does not exist. Try exploring our popular
            selections below.
          </p>
          <Link to="/best-sellers" className="btn-inline">
            View Best Sellers
          </Link>
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
            <Link to="/guide/" onClick={(e) => e.preventDefault()}>
              Guides
            </Link>{" "}
            <span> / </span>
            <span>{collection.h1}</span>
          </div>
          <h1 className="seo-title">{collection.h1}</h1>
          {collection.subtitle && (
            <p className="seo-sub">{collection.subtitle}</p>
          )}
        </div>
      </div>

      <div className="seo-content">
        {/* Sidebar (desktop only) */}
        <aside className="seo-sidebar" aria-label="Filters">
          <div className="seo-filter-block">
            <h4>Filter</h4>
            <label className="seo-filter-row">
              <input
                type="checkbox"
                checked={filterVeg}
                onChange={(e) => setFilterVeg(e.target.checked)}
              />{" "}
              Veg
            </label>
            <label className="seo-filter-row">
              <input
                type="checkbox"
                checked={filterNonVeg}
                onChange={(e) => setFilterNonVeg(e.target.checked)}
              />{" "}
              Non-Veg
            </label>
            <label className="seo-filter-row">
              <input
                type="checkbox"
                checked={filterNewOnly}
                onChange={(e) => setFilterNewOnly(e.target.checked)}
              />{" "}
              New Arrivals
            </label>
            <button
              onClick={() => {
                setFilterVeg(false);
                setFilterNonVeg(false);
                setFilterNewOnly(false);
              }}
              className="seo-clear-btn"
            >
              Clear filters
            </button>
          </div>

          {/* Related guides (desktop only) */}
          <div className="seo-faq-block">
            <h4>Related Guides</h4>
            <ul className="seo-guides-list">
              {otherGuides.map((g) => (
                <li key={g.slug} className="seo-guide-item">
                  <Link to={`/guide/${g.slug}`} className="seo-guide-link">
                    <strong>{g.h1}</strong>
                    {g.subtitle && (
                      <div className="seo-guide-sub">{g.subtitle}</div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="seo-main">
          <div className="seo-controls">
            <div className="seo-count">{filtered.length} products</div>
            <div className="seo-sort">
              <label>Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="weight">Weight</option>
                <option value="healthy">Healthy</option>
              </select>
            </div>
          </div>

          <div className="seo-product-grid" role="list">
            {filtered.map((p) => {
              const slug = productSlug(
                p.name ||
                  p.title ||
                  p.product_name ||
                  p.productName ||
                  p.displayName ||
                  p.slug ||
                  ""
              );
              return (
                <article
                  key={slug || p.id || p._id || p.name}
                  className="seo-product-card"
                  role="listitem"
                >
                  <Link to={`/favorites/${slug}`} className="seo-product-link">
                    <div className="seo-product-media">
                      <ProductImage
                        imageKey={(p.images && p.images[0]) || p.img || ""}
                        alt={p.name || p.title || "product"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        placeholder={
                          <div
                            style={{
                              background: "#f7f7f7",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        }
                      />
                      {p.is_veg && (
                        <span className="seo-product-badge veg">
                          <img
                            src={vegIcon}
                            alt="Vegetarian"
                            className="seo-product-badge-img"
                          />
                        </span>
                      )}
                    </div>

                    <div className="seo-product-body">
                      <h3 className="seo-product-name">{p.name || p.title}</h3>
                      {p.weight && (
                        <div className="seo-product-meta">{p.weight}</div>
                      )}
                      {p.price && (
                        <div className="seo-product-price">₹{p.price}</div>
                      )}
                    </div>
                  </Link>
                </article>
              );
            })}

            {filtered.length === 0 && (
              <div className="seo-empty">
                <p>
                  No products matched this collection
                  {filterVeg || filterNonVeg || filterNewOnly
                    ? " & current filters"
                    : ""}
                  .
                </p>
              </div>
            )}
          </div>

          {/* FAQ + Mobile Related Guides */}
          {collection.faq?.length > 0 && (
            <section className="seo-faq-mobile">
              <h2>Frequently Asked Questions</h2>
              <div className="seo-faq-accordion">
                {collection.faq.map((f, i) => (
                  <details key={i} className="seo-faq-accordion-item" open>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>

              {/* ✅ Related Guides directly under FAQ (mobile only) */}
              <div className="seo-guides-mobile">
                <h3>Related Guides</h3>
                <ul className="seo-guides-list-mobile">
                  {otherGuides.map((g) => (
                    <li key={g.slug} className="seo-guide-item">
                      <Link to={`/guide/${g.slug}`} className="seo-guide-link">
                        <strong>{g.h1}</strong>
                        {g.subtitle && (
                          <div className="seo-guide-sub">{g.subtitle}</div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
