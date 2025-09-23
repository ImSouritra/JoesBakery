import React from "react";
import "./WhyChooseUsSection.css";

const features = [
  {
    title: "No Preservatives",
    icon: (
      // Leaf Icon
      <svg width="100" height="100" viewBox="0 0 70 70" stroke="#1A1A1A" fill="none" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="35" cy="35" r="33" stroke="#f7d9ad" strokeWidth="2.6" fill="#fdf7ec"/>
        <path d="M35 43V28c9.5 0 13 6 13 10 0 4.5-3.7 8-8.1 8C37.7 46 35 43 35 43zM35 43V28c-9.5 0-13 6-13 10 0 4.5 3.7 8 8.1 8C32.3 46 35 43 35 43z"/>
      </svg>
    )
  },
  {
    title: "12×7 Support",
    icon: (
      // Headphone Icon
      <svg width="100" height="100" viewBox="0 0 70 70" stroke="#1A1A1A" fill="none" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="35" cy="35" r="33" stroke="#f7d9ad" strokeWidth="2.6" fill="#fdf7ec"/>
        <path d="M22 44v-7c0-8 8-11 13-11s13 3 13 11v7c0 2-2 4-4 4h-2a2 2 0 0 1-2-2v-2h-10v2a2 2 0 0 1-2 2h-2c-2 0-4-2-4-4z"/>
      </svg>
    )
  },
  {
    title: "Fast Delivery",
    icon: (
      // Delivery Icon
      <svg width="100" height="100" viewBox="0 0 70 70" stroke="#1A1A1A" fill="none" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="35" cy="35" r="33" stroke="#f7d9ad" strokeWidth="2.6" fill="#fdf7ec"/>
        <rect x="20" y="36" width="30" height="10" rx="3" />
        <path d="M48 36v-5h7v8"/>
        <circle cx="25" cy="47" r="2"/>
        <circle cx="45" cy="47" r="2"/>
      </svg>
    )
  }
];

export default function WhyChooseUsSection() {
  return (
    <section className="whychoose-section">
      <h2 className="whychoose-title">
        <span>Why Choose Us</span>
      </h2>
      <div className="whychoose-features">
        {features.map((item, idx) => (
          <div className="whychoose-feature" key={item.title}>
            <div className="whychoose-icon">{item.icon}</div>
            <div className="whychoose-label">{item.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
