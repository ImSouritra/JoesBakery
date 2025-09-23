import React from "react";
import "./OurStorySection.css";
import bakeryImage from "../../../../assets/images/IMG_8942.PNG"; // Replace with your image path

const OurStorySection = () => {
  return (
    <section className="ourstory-section">
      <div className="ourstory-container">
        <div className="ourstory-content">
          <h2 className="ourstory-title">Our Story</h2>
          <p className="ourstory-text">
            At JOE’S BAKERY, every creation is infused with a sprinkle of magic. From the freshest ingredients to time-honored local techniques, we pour our heart into every baked good. Our journey is shaped by tradition and passion, inviting you to share in the simple joy of wholesome flavors crafted with love.
          </p>
        </div>
        <div className="ourstory-image-wrapper">
          <img src={bakeryImage} alt="Baking process" className="ourstory-image" />
        </div>
      </div>
    </section>
  );
};

export default OurStorySection;
