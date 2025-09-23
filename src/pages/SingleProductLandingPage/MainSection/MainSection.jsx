// MainSection.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import slugify from "slugify";
// IMPORTANT: adjust path if your ProductImage location is different.
// Example locations:
// import ProductImage from "../../components/ProductImage"; // if MainSection is in pages/... and components is two levels up
// import ProductImage from "../../../../components/ProductImage"; // if nested deeper
import ProductImage from "../../../components/ProductImage";

 // Usage: <MainSection product={product} />
export default function MainSection({ product }) {
  const [selectedImg, setSelectedImg] = useState(0);
  const [openAccordions, setOpenAccordions] = useState({});

  if (!product) return null;

  function toggleAccordion(key) {
    setOpenAccordions((s) => ({ ...s, [key]: !s[key] }));
  }

  const images =
    product.images && product.images.length
      ? product.images
      : ["https://via.placeholder.com/1200x900?text=Product"];

  const productSlug = slugify(product.name || "product", { lower: true });

  return (
    <div className="pf-hero-root">
      <style>{`
        .pf-hero-root {
          font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          color: #111;
          width: 100%;
          box-sizing: border-box;
        }

        /* Grid layout: left images, right info */
        .pf-hero {
          width: 100%;
          margin: 2rem auto;
          padding: 0 4.5vw;
          display: grid;
          grid-template-columns: minmax(420px, 1fr) minmax(520px, 720px);
          gap: 2.8rem;
          align-items: start;
        }

        /* LEFT - images */
        .pf-media { display: flex; gap: 1.25rem; align-items: flex-start; }
        .pf-thumbs { display: flex; flex-direction: column; gap: 0.9rem; }
        .pf-thumb { width: 68px; height: 68px; border-radius: 6px; overflow: hidden; border: 2px solid transparent; box-shadow: 0 6px 18px rgba(17,17,17,0.06); cursor: pointer; background: #fff; }
        .pf-thumb img, .pf-thumb > div { width: 100%; height: 100%; object-fit: cover; display:block; }
        .pf-thumb.selected { border-color: #111; box-shadow: 0 8px 26px rgba(17,17,17,0.12); transform: translateY(-2px); }

        .pf-mainimg { flex: 1; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 40px rgba(2,6,23,0.08); width: 100%; }
        .pf-mainimg img { width: 100%; height: auto; object-fit: cover; display:block; aspect-ratio: 16/12; max-height: 800px; }

        /* RIGHT - info */
        .pf-info { padding-top: 0.5rem; padding-left: 1.25rem; padding-right: 1.25rem; }
        .pf-toprow { display:flex; align-items:center; gap:1rem; }
        .pf-veg { width:20px; height:20px; border-radius:3px; display:inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
        .pf-veg.veg { background: #27ae60; border: 2px solid #fff; }
        .pf-veg.nonveg { background: linear-gradient(45deg,#a64b00,#5b2b00); border: 2px solid #fff; }

        /* title larger */
        .pf-title { font-family: 'Playfair Display', serif; font-size: 3.2rem; font-weight:700; margin: 0 0 0.6rem 0; line-height:1.02; color: #111; }

        .pf-sep { height:1px; background: linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.01)); margin: 0.9rem 0 1.2rem; }

        /* ACCORDIONS */
        .pf-acc { margin-top: 1.5rem; border-radius: 6px; overflow:visible; }
        .pf-acc-item { border-bottom:1px solid rgba(0,0,0,0.06); font-size: 22px; padding: 1rem 0; display:flex; align-items:center; justify-content:space-between; cursor:pointer; }
        .pf-acc-item strong { font-weight:700; }
        .pf-acc-body { padding:0.9rem 0 1.4rem; color:#333; line-height:1.6; font-size:16px; }

        .pf-weight { display:inline-block; margin-bottom: 1rem; border:3px solid #111; border-radius:10px; padding:12px 14px; font-weight:800; font-size:1.0rem; }

        /* ORDER NOW - always visible, placed under the accordion block */
        .pf-order-row {
          margin-top: 20px;
          width: 100%;
        }
        .pf-order-btn {
          display:block;
          width: 100%;
          padding: 14px 36px;
          border-radius: 999px;
          background: #fff;
          color: #111;
          border: 1px solid rgba(0,0,0,0.25);
          font-weight: 700;
          font-size: 1.02rem;
          letter-spacing: 0.3px;
          text-align: center;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0,0.04);
          transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s, color 0.12s;
          text-decoration: none;
        }
        .pf-order-btn:hover, .pf-order-btn:focus {
          background: #111;
          color: #fff;
          transform: translateY(-3px);
          box-shadow: 0 18px 50px rgba(0,0,0,0.15);
          border-color: rgba(0,0,0,0.5);
        }

        /* Responsive */
        @media (max-width: 1300px) {
          .pf-hero { grid-template-columns: minmax(380px, 1fr) 520px; gap: 2rem; padding: 0 5vw; }
          .pf-title { font-size: 2.8rem; }
        }

        @media (max-width: 980px) {
          .pf-hero { grid-template-columns: 1fr; padding: 0 4vw; gap: 1.6rem; }
          .pf-media { order:0; }
          .pf-info { order:1; padding-left: 0; padding-right: 0; }
          .pf-thumbs { flex-direction: row; }
          .pf-thumb { width:56px; height:56px; }
          .pf-mainimg img { aspect-ratio: 16/12; max-height: 520px; border-radius: 10px; }
          .pf-title { font-size: 1.9rem; }
        }

        @media (max-width: 520px) {
          .pf-hero { padding: 0 3.5vw; }
          .pf-thumb { width:52px; height:52px; }
          .pf-title { font-size: 1.35rem; }
          .pf-mainimg img { max-height: 320px; }
        }
      `}</style>

      <div className="pf-hero">
        {/* LEFT: images */}
        <div className="pf-media">
          <div className="pf-thumbs" aria-hidden={false}>
            {images.map((src, i) => (
              <div
                key={i}
                className={`pf-thumb ${i === selectedImg ? "selected" : ""}`}
                onClick={() => setSelectedImg(i)}
                role="button"
                aria-label={`Show image ${i + 1}`}
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" ? setSelectedImg(i) : null)}
              >
                {/* use ProductImage for thumbnails */}
                <ProductImage
                  imageKey={src}
                  alt={`${product.name} thumb ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  placeholder={<div style={{ width: "100%", height: "100%", background: "#f4f4f4" }} />}
                />
              </div>
            ))}
          </div>

          <div className="pf-mainimg">
            {/* main image uses ProductImage too */}
            <ProductImage
              imageKey={images[selectedImg]}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              placeholder={<div style={{ width: "100%", height: 460, background: "#f4f4f4" }} />}
            />
          </div>
        </div>

        {/* RIGHT: info */}
        <div className="pf-info">
          <div className="pf-toprow">
            <div className={`pf-veg ${product.isVeg ? "veg" : "nonveg"}`} title={product.isVeg ? "Vegetarian" : "Non vegetarian"} />
            <div style={{ flex: 1 }}>
              <h1 className="pf-title">{product.name}</h1>
            </div>
          </div>

          <div className="pf-sep" />

          <div className="pf-acc" aria-hidden={false}>
            <div className="pf-acc-item" onClick={() => toggleAccordion("desc")}>
              <strong>Product Description</strong>
              <span>{openAccordions["desc"] ? "−" : "+"}</span>
            </div>
            {openAccordions["desc"] && <div className="pf-acc-body">{product.description}</div>}

            <div className="pf-acc-item" onClick={() => toggleAccordion("ingredients")}>
              <strong>Ingredients</strong>
              <span>{openAccordions["ingredients"] ? "−" : "+"}</span>
            </div>
            {openAccordions["ingredients"] && <div className="pf-acc-body">{product.ingredients}</div>}

            <div className="pf-acc-item" onClick={() => toggleAccordion("storage")}>
              <strong>Storage condition</strong>
              <span>{openAccordions["storage"] ? "−" : "+"}</span>
            </div>
            {openAccordions["storage"] && <div className="pf-acc-body">{product.delivery_instructions}</div>}

            <div className="pf-acc-item" onClick={() => toggleAccordion("weight")}>
              <strong>Net weight</strong>
              <span>{openAccordions["weight"] ? "−" : "+"}</span>
            </div>
            {openAccordions["weight"] && (
              <div className="pf-acc-body">
                <span className="pf-weight">{product.weight ?? "—"}</span>
              </div>
            )}
          </div>

          {/* ORDER NOW - always visible below accordion; full width of info column */}
          <div className="pf-order-row">
            <Link to={`/contact?product=${productSlug}&qty=1`} className="pf-order-btn">Order now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
