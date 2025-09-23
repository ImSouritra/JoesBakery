// SingleProductLandingPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import slugify from "slugify";
import MainSection from "./MainSection/MainSection";
import "./SingleProductLandingPage.css";
import WhyChooseUsSection from "../Homepage/Components/WhyChooseUsSection/WhyChooseUsSection";
import YouMayAlsoLike from "./YouMayAlsoLikeSection/YouMayAlsoLike";

export default function SingleProductLandingPage({ products = [] }) {
  const { productSlug } = useParams();

  // If products is an object (like grouped PRODUCTS), flatten it; otherwise assume array
  const allProducts = Array.isArray(products)
    ? products
    : Object.values(products).flat();

  const product = allProducts.find(
    (item) => slugify(item.name, { lower: true }) === productSlug
  );

  if (!product) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Product not found.
      </div>
    );
  }

  return (
    <div className="spp-root">
      <main className="spp-content">
        <MainSection product={product} />
        <YouMayAlsoLike products={allProducts} currentProduct={product} />
        <WhyChooseUsSection />
      </main>
    </div>
  );
}
