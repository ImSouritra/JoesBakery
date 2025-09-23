// src/pages/Contact/Contact.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import slugify from "slugify";
import "./Contact.css";

export default function Contact({ products = [] } = {}) {
  const [searchParams] = useSearchParams();

  // Build productOptions (array of product names) and a slug->name map
  const { productOptions, slugToName } = useMemo(() => {
    const opts = Array.isArray(products) && products.length
      ? products.map((p) => p.name)
      : [
          "New York Cheesecake",
          "Dessert Chocolate Fudge",
          "Millet Cookie",
          "Chocolate Muffin",
          "Vanilla Teacake",
        ];

    const map = {};
    opts.forEach((name) => {
      const slug = slugify(String(name || ""), { lower: true });
      map[slug] = name;
    });
    return { productOptions: opts, slugToName: map };
  }, [products]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    product: "", // selected product name
    quantity: 1,
    special: "",
    message: "",
    callMeBack: false,
    preferredTime: "",
  });

  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  // Prefill using query params — run whenever search params or products/options change
  useEffect(() => {
    const productSlug = (searchParams.get("product") || "").toString();
    const qtyStr = searchParams.get("qty") || searchParams.get("quantity") || searchParams.get("q");

    // Decide product selection:
    if (productSlug) {
      const matchedName = slugToName[productSlug.toLowerCase()];
      if (matchedName) {
        setForm((f) => ({ ...f, product: matchedName }));
      } else {
        // fallback: try fuzzy match by slugifying each option (extra safety)
        const fuzzy = Object.keys(slugToName).find((s) => s === productSlug.toLowerCase());
        if (fuzzy) setForm((f) => ({ ...f, product: slugToName[fuzzy] }));
      }
    }

    // Quantity
    if (qtyStr) {
      const n = parseInt(qtyStr, 10);
      if (!Number.isNaN(n) && n > 0) {
        setForm((f) => ({ ...f, quantity: n }));
      }
    }

    // If no product selected yet, set to first available product option
    setTimeout(() => {
      setForm((f) => ({ ...f, product: f.product || (productOptions.length ? productOptions[0] : "") }));
    }, 0);
  }, [searchParams, productOptions, slugToName]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.product) e.product = "Select a product";
    if (!form.quantity || form.quantity < 1) e.quantity = "Quantity must be at least 1";
    if (form.callMeBack && !form.preferredTime.trim()) e.preferredTime = "Tell us a preferred time to call";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      product: form.product,
      quantity: form.quantity,
      special: form.special.trim(),
      message: form.message.trim(),
      callMeBack: !!form.callMeBack,
      preferredTime: form.preferredTime.trim(),
      createdAt: new Date().toISOString(),
    };

    setSending(true);
    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Server error");
      }

      setSuccessMessage("Thanks — your request has been sent. We'll contact you soon.");
      setForm({
        name: "",
        email: "",
        product: productOptions[0] || "",
        quantity: 1,
        special: "",
        message: "",
        callMeBack: false,
        preferredTime: "",
      });
      setErrors({});
      setTimeout(() => setSuccessMessage(""), 6000);
    } catch (err) {
      console.error("Send failed:", err);
      setServerError("Failed to send message. Please try again or email us directly at abhiraajsamajdar@gmail.com");
      setTimeout(() => setServerError(""), 6000);
    } finally {
      setSending(false);
    }
  }

  function changeQty(delta) {
    setForm((f) => ({ ...f, quantity: Math.max(1, (f.quantity || 1) + delta) }));
    setErrors((prev) => ({ ...prev, quantity: null }));
  }

  return (
    <div className="contact-root">
      <div className="contact-wrap">
        <h2 className="contact-title">Contact</h2>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="row two-cols">
            <label className={`field ${errors.name ? "has-error" : ""}`}>
              <span className="label">Name</span>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                aria-invalid={!!errors.name}
                className="animated-focus"
              />
              {errors.name ? <small className="error">{errors.name}</small> : <small className="hint">Full name</small>}
            </label>

            <label className={`field ${errors.email ? "has-error" : ""}`}>
              <span className="label">E-mail</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className="animated-focus"
              />
              {errors.email ? <small className="error">{errors.email}</small> : <small className="hint">We'll use this to reach you</small>}
            </label>
          </div>

          <div className="row">
            <label className={`field ${errors.product ? "has-error" : ""}`}>
              <span className="label">Product you want to order</span>

              <div className="select-qty-row">
                <select
                  name="product"
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  className="animated-focus"
                >
                  {productOptions.map((p) => (
                    <option value={p} key={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <div className="qty-selector" aria-label="Quantity selector">
                  <button type="button" className="qty-btn" onClick={() => changeQty(-1)} aria-label="Decrease quantity">
                    −
                  </button>
                  <div className="qty-value" aria-live="polite">
                    {form.quantity}
                  </div>
                  <button type="button" className="qty-btn" onClick={() => changeQty(1)} aria-label="Increase quantity">
                    +
                  </button>
                </div>
              </div>

              {errors.product ? <small className="error">{errors.product}</small> : <small className="hint">Choose product & quantity</small>}
              {errors.quantity && <small className="error">{errors.quantity}</small>}
            </label>
          </div>

          <div className="row">
            <label className="field">
              <span className="label">Any special instruction</span>
              <input
                name="special"
                value={form.special}
                onChange={(e) => setForm({ ...form, special: e.target.value })}
                placeholder="E.g. 'No nuts', 'Write happy birthday', delivery time"
                className="animated-focus"
              />
              <small className="hint">Optional — e.g. food allergies or message on cake</small>
            </label>
          </div>

          <div className="row two-cols">
            <label className="field">
              <span className="label">Call me back?</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label className="inline-switch">
                  <input
                    type="checkbox"
                    checked={form.callMeBack}
                    onChange={(e) => setForm({ ...form, callMeBack: e.target.checked })}
                  />
                  <span className="switch-track" />
                </label>
                <small className="hint">If you want a phone call instead of email</small>
              </div>
            </label>

            <label className={`field ${errors.preferredTime ? "has-error" : ""}`}>
              <span className="label">Preferred contact time</span>
              <input
                name="preferredTime"
                type="text"
                placeholder="E.g. Tomorrow 10:00-12:00 or Weekdays 3pm-6pm"
                value={form.preferredTime}
                onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                className="animated-focus"
                disabled={!form.callMeBack}
              />
              {errors.preferredTime ? <small className="error">{errors.preferredTime}</small> : <small className="hint">Optional — when we should call</small>}
            </label>
          </div>

          <div className="row">
            <label className="field">
              <span className="label">Message</span>
              <textarea
                name="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Any other details or questions"
                className="animated-focus"
              />
              <small className="hint">Optional — we'll include this in the email</small>
            </label>
          </div>

          <div className="row actions-row">
            <button className="btn-primary" type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send message"}
            </button>
          </div>

          {successMessage && <div className="success">{successMessage}</div>}
          {serverError && <div className="error" style={{ marginTop: 10 }}>{serverError}</div>}
        </form>
      </div>
    </div>
  );
}
