import React from "react";
import "./HeroSection.css";
import heroBg from "./wp7367659-cake-wallpaper.jpg" // use your actual image path

const HeroSection = () => {
  return (
    <div
      className="hero-section"
      style={{
        backgroundImage: `url(${heroBg})`,
      }}
    >
      <div className="hero-overlay">
        <div className="hero-content">
          <h1>
            From our oven<br />
            To your happiness
          </h1>
          <a href="/category/all"><button className="hero-btn">Shop Now</button></a>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
