// src/components/YouMayAlsoLike.jsx
import React, { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import slugify from "slugify";
import { motion } from "framer-motion";
import ProductImage from "../../../components/ProductImage"; // adjust this path if your components folder is in a different location
import "./YouMayAlsoLike.css";

/*
 Props:
  - products: array of all product objects (same shape as PRODUCTS)
  - currentProduct: the currently-viewed product object
  - title (optional)
  - maxItems (optional) default 8
*/
export default function YouMayAlsoLike({
  products = [],
  currentProduct = null,
  title = "You May Also Like",
  maxItems = 8,
}) {
  const scrollRef = useRef(null);

  // stable identifier for a product (prefers id, then slug, then slugified name)
  const getProductId = (p) =>
  p ? (p.id ?? p.slug ?? slugify(String(p.name || ""), { lower: true })) : "";

  // pick image key (first image path or fallback image key)
  const getImageKey = (item) => {
    if (!item) return "";
    if (Array.isArray(item.images) && item.images.length) return item.images[0];
    if (item.img) return item.img;
    return "";
  };

  // Build suggestions: prefer same 'type' items, exclude current product.
  const suggestions = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    // If no currentProduct provided, show top maxItems products
    if (!currentProduct) {
      return products.slice(0, maxItems);
    }

    const curId = getProductId(currentProduct);

    // collect same-type items (defensive)
    const sameType = products.filter((p) => {
      const pid = getProductId(p);
      if (!pid || pid === curId) return false;
      const a = Array.isArray(p.type) ? p.type : [];
      const b = Array.isArray(currentProduct.type) ? currentProduct.type : [];
      return a.some((t) => b.includes(t));
    });

    if (sameType.length >= maxItems) return sameType.slice(0, maxItems);

    // fill with other products excluding duplicates & current
    const seen = new Set(sameType.map(getProductId));
    seen.add(curId);
    const others = [];
    for (const p of products) {
      const pid = getProductId(p);
      if (!pid || seen.has(pid)) continue;
      others.push(p);
      seen.add(pid);
      if (sameType.length + others.length >= maxItems) break;
    }

    return [...sameType, ...others].slice(0, maxItems);
  }, [products, currentProduct, maxItems]);

  // nothing to show
  if (!suggestions || suggestions.length === 0) return null;

  function scroll(direction = "right") {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector(".favorites-card-wrap");
    const gap = 24; // approximate gap; tweak to match CSS
    const scrollBy = (card ? card.offsetWidth : 300) + gap;
    el.scrollBy({ left: direction === "right" ? scrollBy : -scrollBy, behavior: "smooth" });
  }

  const FavoriteProductCard = ({ item }) => {
    const imgKey = getImageKey(item);
    const keyId = getProductId(item) || `${slugify(item.name || "", { lower: true })}-${Math.random()}`;
    return (
      <Link
        to={`/favorites/${slugify(String(item.name || ""), { lower: true })}`}
        style={{ textDecoration: "none", color: "inherit" }}
        key={keyId}
      >
        <motion.div
          className="favorites-card-wrap"
          tabIndex={0}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
        >
          <div className="favorites-card-img">
            <ProductImage
              imageKey={imgKey}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              placeholder={<div style={{ width: "100%", height: "100%", background: "#f4f4f4" }} />}
            />
            {item.isVeg && <span className="favorites-badge">Veg</span>}
          </div>

          <div className="favorites-card-info">
            <span className="favorites-title">{item.name}</span>
          </div>
        </motion.div>
      </Link>
    );
  };

  return (
    <section className="youmay-section" aria-label="You may also like">
      <div className="youmay-header">
        <h3>{title}</h3>
        <div className="youmay-controls">
          <button className="youmay-arrow left" aria-label="Scroll left" onClick={() => scroll("left")}>
            ‹
          </button>
          <button className="youmay-arrow right" aria-label="Scroll right" onClick={() => scroll("right")}>
            ›
          </button>
        </div>
      </div>

      <div className="youmay-carousel" ref={scrollRef} role="list">
        {suggestions.map((p, i) => (
          <FavoriteProductCard item={p} key={getProductId(p) || `${slugify(p.name || "", { lower: true })}-${i}`} />
        ))}
      </div>
    </section>
  );
}
