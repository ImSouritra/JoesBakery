// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Navbar/NavBar";
import Footer from "./Footer/Footer";

import HomePage from "./pages/Homepage/HomePage";
import { API_BASE } from "./config";
import SingleProductLandingPage from "./pages/SingleProductLandingPage/SingleProductLandingPage";
import CategoryLandingPage from "./pages/CategoryLandingPage/CategoryLandingPage";
import Admin from "./pages/AdminPage/Admin";
import Contact from "./pages/ContactPage/Contact";
import BestSellersPage from "./pages/BestSellersPage/BestSellersPage";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy";
import TermsAndConditions from "./pages/Legal/TermsAndConditions";

function App() {
  const [products, setProducts] = useState([]);

  async function fetchProducts() {
    try {
      // ✅ Use relative path in production, env var override allowed for dev
  const res = await fetch(`${API_BASE}/api/products`);

      if (!res.ok) {
        console.warn("Failed to fetch products");
        return;
      }

      const body = await res.json();
      setProducts(body.products || []);
    } catch (err) {
      console.error("Fetch products failed", err);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleProductAdd(createdProduct) {
    // Best: refetch full list
    await fetchProducts();
    // Or just append locally:
    // setProducts((p) => [createdProduct, ...p]);
  }

  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage products={products} />} />
          <Route path="/favorites/:productSlug" element={<SingleProductLandingPage products={products} />} />
          <Route path="/product/:productSlug" element={<SingleProductLandingPage products={products} />} />
          <Route path="/category/:typeKey" element={<CategoryLandingPage products={products} />} />
          <Route path="/category" element={<Navigate to="/category/all" replace />} />
          <Route path="/admin/add-product" element={<Admin onProductAdd={handleProductAdd} />} />
          <Route path="/contact" element={<Contact products={products} />} />
          <Route path="/best-sellers" element={<BestSellersPage products={products} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/terms" element={<TermsAndConditions />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
