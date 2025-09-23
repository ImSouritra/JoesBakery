// src/components/ProductImage.jsx
import React from "react";

/**
 * ProductImage
 * - imageKey: can be:
 *    - null/"" -> will render placeholder
 *    - a full URL (starts with http) -> used as-is
 *    - a server-relative path (starts with "/uploads/...") -> prepend API base
 *
 * Make sure you have REACT_APP_API_URL_BASE set to http://localhost:5000 in your .env
 * and restart the dev server after changing .env.
 */
export default function ProductImage({
  imageKey = "",
  alt = "",
  style = {},
  placeholder = null,
}) {
  const apiBase = process.env.REACT_APP_API_URL_BASE || "";

  let src = "";
  if (!imageKey) {
    src = "";
  } else if (/^https?:\/\//i.test(imageKey)) {
    src = imageKey;
  } else if (imageKey.startsWith("/")) {
    // Relative path from server: prepend API base (no double slash)
    src = `${apiBase.replace(/\/$/, "")}${imageKey}`;
  } else {
    // If it's a filename, assume upload dir on server
    src = `${apiBase.replace(/\/$/, "")}/uploads/${imageKey}`;
  }

  if (!src) {
    return placeholder || <div style={{ width: 120, height: 120, background: "#f4f4f4" }} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={(e) => {
        // fallback to placeholder on error
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
