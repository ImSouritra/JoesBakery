// src/components/OurBakedGoods/OurBakedGoodsSection.jsx
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import "./OurBakedGoodsSection.css";
import cakeImg from "../../../../assets/images/birthday_cake.JPG";
import muffin from "../../../../assets/images/muffin.JPG";
import cookies from "../../../../assets/images/cookies.webp";
import brownie from "../../../../assets/images/brownie.webp";
import teacake from "../../../../assets/images/teacake.webp";

// IMPORTANT: typeKey should match the type strings in your PRODUCTS array
const bakedGoods = [
  { img: cakeImg, label: "Signature Cakes", typeKey: "cake" },
  { img: muffin, label: "Muffins", typeKey: "muffin" },
  { img: cookies, label: "Cookies", typeKey: "cookie" },
  { img: brownie, label: "Brownies", typeKey: "brownie" },
  { img: teacake, label: "Teacakes", typeKey: "teacake" },
];

export default function OurBakedGoodsSection() {
  const scrollRef = useRef(null);

  return (
    <section className="baked-section">
      <h2 className="baked-title">Browse Our Baked Goods</h2>

      <div className="baked-carousel-control">
        <div className="baked-carousel" ref={scrollRef}>
          {bakedGoods.map((item, idx) => (
            <Link
              to={`/category/${item.typeKey}`}
              key={idx}
              className="baked-slide"
              aria-label={`Browse ${item.label}`}
            >
              <div className="baked-img-circle" aria-hidden>
                <img src={item.img} alt={item.label} />
              </div>
              <p className="baked-label">{item.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
