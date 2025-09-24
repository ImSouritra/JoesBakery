// src/.../TasteMasterpieceSection.jsx
import React, { useState } from "react";
import "./TasteMasterPieceSection.css";
import bgImage from "../../../../assets/images/lightcake.webp"; // <- single optimized webp

export default function TasteMasterpieceSection() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="tms-section" aria-label="Taste our masterpiece">
      {/* background image as an <img> so the browser can lazy-load it */}
      <img
        src={bgImage}
        alt="Signature multi-tiered berry cake"
        className={`tms-bg ${loaded ? "is-loaded" : "is-loading"}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />

      <div className="tms-overlay" aria-hidden="true"></div>

      <div className="tms-content">
        <h1>
          <span className="fade-in">Taste Our</span>
          <br />
          <span className="slide-in">Masterpiece</span>
        </h1>
        <h3 className="subtitle">Signature Creations</h3>
        <p className="description">
          Experience the pinnacle of flavor with our signature multi-tiered berry cake. Handcrafted
          with the finest ingredients, each slice offers a symphony of fresh flavors. Perfect for
          unforgettable celebrations.
        </p>
        <a href="/category/cake" aria-label="Explore Signature Cakes">
          <button className="tms-button fade-up">
            Explore Signature Cakes
          </button>
        </a>
      </div>
    </section>
  );
}
