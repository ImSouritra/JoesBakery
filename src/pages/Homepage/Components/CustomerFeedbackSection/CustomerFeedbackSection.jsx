import React from "react";
import "./CustomerFeedbackSection.css";

const feedbacks = [
  {
    name: "Priya S.",
    stars: 5,
    feedback:
      "Absolutely loved the Belgian truffle cake! So soft, rich, and beautifully decorated. Your service made my party perfect!"
  },
  {
    name: "Rahul Verma",
    stars: 4,
    feedback:
      "The red velvet was melt-in-the-mouth. Ordered online and got it fresh and on-time. Highly recommended for celebrations!"
  },
  {
    name: "Sara M.",
    stars: 5,
    feedback:
      "Best eggless cake I’ve ever tasted. Moist and flavorful. The whole family enjoyed every bite. Will order again for sure!"
  }
];

function StarRating({ count }) {
  return (
    <div className="stars">
      {"★".repeat(count)}
      <span className="star-dim">{"★".repeat(5 - count)}</span>
    </div>
  );
}

export default function CustomerFeedbackSection() {
  return (
    <section className="feedback-section">
      <h2 className="feedback-title">What Our Customers Say</h2>
      <div className="feedback-desc">Baked with Love, Reviewed with Joy</div>
      <div className="feedback-cards">
        {feedbacks.map((f, idx) => (
          <div
            className="feedback-card animated-fadein"
            style={{ animationDelay: `${idx * 0.18 + 0.1}s` }}
            key={f.name}
          >
            <div className="feedback-user">{f.name}</div>
            <StarRating count={f.stars} />
            <div className="feedback-text">“{f.feedback}”</div>
          </div>
        ))}
      </div>
    </section>
  );
}
