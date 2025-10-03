import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";
import joesbakery_logo from "../assets/logo/joesbakery_logo.png";

const MENU_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/category/cake", label: "Cakes" },
  { to: "/category/cup_cake", label: "Cup Cakes" },
  { to: "/category/brownie", label: "Brownies" },
  { to: "/category/cookie", label: "Cookies" },
  { to: "/category/teacake", label: "Teacakes" },
  { to: "/contact", label: "Order Now" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen((s) => !s);
  const closeMenu = () => setMenuOpen(false);

  // Framer motion variants for mobile drawer + staggered children
  const menuVariants = {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: {
        type: "tween",
        duration: 0.35,
        when: "beforeChildren",
        staggerChildren: 0.12,
      },
    },
    exit: {
      x: "100%",
      transition: { type: "tween", duration: 0.32 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.32 } },
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/" onClick={closeMenu} className="logo-link">
          <img src={joesbakery_logo} alt="Joe's Bakery Logo" className="logo-img" />
        </Link>
      </div>

      {/* Desktop menu (visible on large screens) */}
      <ul className="navbar-menu desktop">
        {MENU_ITEMS.map((item) => (
          <li key={item.label}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>

      {/* Hamburger toggle (visible on small screens) */}
      <button
        className="navbar-hamburger"
        onClick={handleMenuToggle}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span className={menuOpen ? "bar open" : "bar"} />
        <span className={menuOpen ? "bar open" : "bar"} />
        <span className={menuOpen ? "bar open" : "bar"} />
      </button>

      {/* Backdrop for mobile when menu is open */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="navbar-backdrop show"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Mobile sliding drawer (only acts on small screens via CSS media rules) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            className="navbar-menu mobile"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {MENU_ITEMS.map((item) => (
              <motion.li key={item.label} variants={itemVariants} whileHover={{ scale: 1.03 }}>
                <Link to={item.to} onClick={closeMenu}>
                  {item.label}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </nav>
  );
}
