import React from "react";
import "./AboutOurStandards.css";
import artisanalImg from "../../../../assets/images/cake_baker.png"; // kneading dough
import traditionalImg from "../../../../assets/images/cake_maker.png"; // loaf of bread
import joyfulImg from "../../../../assets/images/chocolate_image.png"; // decorated cake
import  ArtisanalIcon from "../../../../assets/images/ArtisanalIcon.png";
import TraditionalIcon  from "../../../../assets/images/TraditionalIcon.png";
import JoyfulIcon from "../../../../assets/images/cake.png";

const STANDARDS = [
  {
    img: artisanalImg,
    icon: ArtisanalIcon,
    title: "Artisanal Ingredients",
    text: "We use only the finest, fresh, and wholesome ingredients, ensuring exceptional flavor in every bite."
  },
  {
    img: traditionalImg,
    icon: TraditionalIcon,
    title: "Traditional Techniques",
    text: "Honoring time-tested methods, our creations are crafted with patience, skill, and local expertise."
  },
  {
    img: joyfulImg,
    icon: JoyfulIcon,
    title: "Joyful Moments",
    text: "From everyday treats to custom celebrations, we bake happiness, care, and beautiful occasions."
  }
];

export default function AboutOurStandards() {
  return (
    <section className="standards-section">
      <h2 className="standards-heading">Baked with Passion. Crafted with Care.</h2>
      <div className="standards-cards">
        {STANDARDS.map((std, idx) => (
          <div className="standards-card" key={idx}>
            <div className="standards-img-wrap">
              <img src={std.img} alt={std.title} />
            </div>
            <div className="standards-icon">
                <img src={std.icon} alt={std.title + ' icon'} />
            </div>
            <h3 className="standards-title">{std.title}</h3>
            <p className="standards-desc">{std.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
