import React from "react";
import HeroSection from "./Components/Herosection/HeroSection";
import OurBakedGoodsSection from "./Components/OurBakedGoodsSection/OurBakedGoodsSection";
import TasteMasterpieceSection from "./Components/TasteMasterPieceSection/TasteMasterPieceSection";
import JoeFavoritesSection from "./Components/JoesFavouriteSection/JoesFavouritesSection";
import OurStorySection from "./Components/OurStorySection/OurStorySection";
import WhyChooseUsSection from "./Components/WhyChooseUsSection/WhyChooseUsSection";
import CustomerFeedbackSection from "./Components/CustomerFeedbackSection/CustomerFeedbackSection";
import AboutOurStandards from "./Components/AboutOurStandards/AboutOurStandards";

/**
 * HomePage
 * - accepts `products` prop (array). If not passed, components that need data will fallback to static imports.
 * - Pass `products` to child components that can consume them (JoeFavoritesSection here).
 */
function HomePage({ products = [] }) {
  return (
    <>
      <HeroSection />
      <OurBakedGoodsSection products={products} />
      <TasteMasterpieceSection products={products} />
      {/* pass products down to JoeFavorites so it shows dynamic items */}
      <JoeFavoritesSection products={products} />
      <OurStorySection />
      <AboutOurStandards />
      <CustomerFeedbackSection />
      <WhyChooseUsSection />
    </>
  );
}

export default HomePage;
