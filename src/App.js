// src/App.js (simplified snippet)
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Navbar/NavBar";
import Footer from "./Footer/Footer";
import HomePage from "./pages/Homepage/HomePage";
import SingleProductLandingPage from "./pages/SingleProductLandingPage/SingleProductLandingPage";
import CategoryLandingPage from "./pages/CategoryLandingPage/CategoryLandingPage";
import Admin from "./pages/AdminPage/Admin";
import Contact from "./pages/ContactPage/Contact";

function App() {
  const [products, setProducts] = useState([]);

  async function fetchProducts() {
    try {
      const API = process.env.REACT_APP_API_URL_BASE || "http://localhost:5000";
      const res = await fetch(`${API}/api/products`);
      console.log(res)
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

  // Called by Admin AddProduct after server returns new product
  async function handleProductAdd(createdProduct) {
    // Option 1: refetch full list:
    await fetchProducts();
    // Option 2: append client-side (less reliable):
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
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
