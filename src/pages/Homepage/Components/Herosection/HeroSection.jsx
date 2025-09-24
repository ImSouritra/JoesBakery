import React, { useState } from "react";
import "./HeroSection.css";
import heroBg from "../../../../assets/images/hero_section_cake_wallpaper.webp"; // single optimized WebP

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="hero-section" aria-label="Hero">
      {/* Background image as <img>, lazy-loaded */}
      <img
        className={`hero-bg ${loaded ? "is-loaded" : "is-loading"}`}
        src={heroBg}
        alt="Delicious cakes background"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />

      <div className="hero-overlay">
        <div className="hero-content">
          <h1>
            From our oven
            <br />
            To your happiness
          </h1>
          <a href="/category/all">
            <button className="hero-btn">Shop Now</button>
          </a>
        </div>
      </div>
    </section>
  );
}
