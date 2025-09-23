// src/components/ProductImage.jsx
import React from "react";

export default function ProductImage({
  imageKey = "",
  alt = "",
  style = {},
  placeholder = null,
}) {
  const apiBase = (process.env.REACT_APP_API_URL_BASE || "").replace(/\/$/, "");

  let src = "";
  if (!imageKey) {
    src = "";
  } else if (/^https?:\/\//i.test(imageKey)) {
    src = imageKey; // already absolute
  } else if (imageKey.startsWith("/")) {
    // server-relative path; prepend API base
    src = apiBase ? `${apiBase}${imageKey}` : imageKey;
  } else {
    // bare filename -> assume uploads path on API
    src = apiBase ? `${apiBase}/uploads/${imageKey}` : `/uploads/${imageKey}`;
  }

  if (!src) return placeholder || <div style={{ width: 120, height: 120, background: "#f4f4f4" }} />;

  return (
    <img
      src={src}
      alt={alt || ""}
      style={style}
      onError={(e) => {
        // fallback to placeholder image if you want
        if (placeholder) e.currentTarget.style.display = "none";
        else e.currentTarget.src = "https://via.placeholder.com/400x300";
      }}
    />
  );
}
