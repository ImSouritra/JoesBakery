// src/.../JoesFavouritesSection.jsx
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import slugify from "slugify";
import "./JoesFavouritesSection.css";
import { TABS, PRODUCTS as STATIC_PRODUCTS } from "../../../../data/productData";
import { motion, AnimatePresence } from "framer-motion";

// adjust this import path to where your ProductImage component is
import ProductImage from "../../../../components/ProductImage";
import vegIcon from "../../../../assets/images/veg-icon.svg"

export default function JoeFavoritesSection({ products = [] }) {
  const [activeTab, setActiveTab] = useState("classic");
  const scrollRef = useRef(null);

  const sourceProducts =
    Array.isArray(products) && products.length ? products : STATIC_PRODUCTS;

  const filteredProducts = sourceProducts.filter(
    (product) => Array.isArray(product.type) && product.type.includes(activeTab)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
  };

  const FavoriteProductCard = ({ item }) => {
    const imgKey = (Array.isArray(item.images) && item.images[0]) || item.img || "";

    return (
      <Link
        to={`/favorites/${slugify(item.name, { lower: true })}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <motion.div
          className="favorites-card-wrap"
          tabIndex={0}
          variants={cardVariants}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }}
          whileTap={{ scale: 0.995 }}
          layout
        >
          <div className="favorites-card-img">
            <ProductImage
              imageKey={imgKey}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              placeholder={<div style={{ width: "100%", height: "100%", background: "#f4f4f4" }} />}
            />
            {item.is_veg && <span className="favorites-badge"><img src={vegIcon} alt="veg" className="favorites-badge-img"/></span>}
          </div>

          <div className="favorites-card-info">
            <span className="favorites-title">{item.name}</span>
          </div>
        </motion.div>
      </Link>
    );
  };

  return (
    <section className="favorites-section">
      <div className="favorites-header">
        <h2>Joe’s Favorites</h2>
        <div className="favorites-tabs" role="tablist" aria-label="Favorites categories">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`favorites-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="favorites-carousel-control">
        <motion.div
          className="favorites-scroll-row"
          ref={scrollRef}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={activeTab} // re-trigger animation when tab changes
        >
          <AnimatePresence>
            {filteredProducts.map((item, idx) => (
              <FavoriteProductCard item={item} key={item.name + "-" + idx} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
