import React from "react";
import "./Footer.css";

// Use your own SVG icon components or imports for better quality!
const socials = [
  { href: "https://facebook.com", icon: "🌐", label: "Facebook" },
  { href: "https://instagram.com", icon: "📸", label: "Instagram" },
  { href: "https://twitter.com", icon: "🐦", label: "Twitter" },
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Cakes", href: "/category/cake" },
  { label: "Brownies", href: "/category/brownie" },
  { label: "Muffins", href: "/category/muffin" },
  { label: "Cookies", href: "/category/cookie" },
  { label: "Teacakes", href: "/category/teacake" },
  { label: "Best Sellers", href: "/best-sellers" },
  { label: "Contact Us", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-col contact">
          <h3>Contact Us</h3>
          <div className="footer-contact-row">
            <span className="footer-icon">&#x1F4CD;</span>
            <span>Bangalore<br />Karnataka</span>
          </div>
          <div className="footer-contact-row">
            <span className="footer-icon">&#x260E;</span>
            <span>+20 4255500</span>
          </div>
          <div className="footer-contact-row">
            <span className="footer-icon">&#x2709;</span>
            <span>joesbakery@gmail.com</span>
          </div>
        </div>
        <div className="footer-col social">
          <h3>Connect With Us</h3>
          <div className="footer-social-row">
            {socials.map((s) => (
              <a
                className="footer-social-icon"
                href={s.href}
                key={s.label}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-col links">
          <h3>Quick Links</h3>
          <ul>
            {quickLinks.map((q) => (
              <li key={q.label}>
                <a href={q.href}>{q.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-top">
          <a
            href="#top"
            className="footer-backtotop"
            aria-label="Back to Top"
          >
            <span>Back to Top</span>
            <span className="footer-arrow">&#8593;</span>
          </a>
        </div>
      </div>
      <div className="footer-divider-wrap">
        <div className="footer-divider-glow" />
        <div className="footer-divider-line">
          <span className="footer-divider-dot" />
        </div>
      </div>
      <div className="footer-copyright">
        Joes Bakery © 2025. All right reserved.
      </div>
    </footer>
  );
}
