import React from "react";
import "./TasteMasterPieceSection.css";

export default function TasteMasterpieceSection() {
  return (
    <section className="tms-section">
      <div className="tms-overlay"></div>
      <div className="tms-content">
        <h1>
          <span className="fade-in">Taste Our</span>
          <br />
          <span className="slide-in">Masterpiece</span>
        </h1>
        <h3 className="subtitle">Signature Creations</h3>
        <p className="description">
          Experience the pinnacle of flavor with our signature multi-tiered berry cake. Handcrafted with the finest ingredients, each slice offers a symphony of fresh flavors. Perfect for unforgettable celebrations.
        </p>
        <a href="/category/cake"><button className="tms-button fade-up" aria-label="Explore Signature Cakes">
          Explore Signature Cakes
        </button></a>
      </div>
    </section>
  );
}
