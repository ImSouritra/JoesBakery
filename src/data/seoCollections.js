// seoCollections.js
// Central configuration for curated SEO landing pages.
// Each collection describes a high-intent search theme and maps to product slugs.
// Extend this file to add more guides without touching routing/component logic.

import slugify from "slugify";
import { PRODUCTS } from "./productData";

// Utility to build a stable slug from a product name (mirrors SingleProductLandingPage logic)
const productSlug = (name) => slugify(name, { lower: true });

// Pre-compute a lookup map for convenience
const productMap = PRODUCTS.reduce((acc, p) => {
  acc[productSlug(p.name)] = p;
  return acc;
}, {});

// Shared default FAQ blocks – can be reused
const COMMON_FAQ = [
  {
    q: "Do you deliver across Bengaluru?",
    a: "Yes, we currently accept and deliver orders across Bengaluru city limits. For bulk or special deliveries, contact us directly." ,
  },
  {
    q: "How far in advance should I place an order?",
    a: "For standard items 24 hours is ideal; for custom or large celebration cakes 48–72 hours helps us guarantee freshness.",
  },
];

// Define curated collections
// slug: appears in /guide/:seoSlug (or direct route if mapped)
// productSlugs: list of product slug strings (resolved dynamically to product objects)
// meta: title & description for <head>
// structured: extra schema.org notes (like itemListName override)
export const SEO_COLLECTIONS = [
  {
    slug: "best-cakes-in-bengaluru",
    h1: "Best Cakes in Bengaluru (Fresh & Artisanal)",
    subtitle: "Hand-picked favorites loved by our Bengaluru customers.",
    productSlugs: PRODUCTS.filter(p => (p.type||[]).includes("cake")).map(p => productSlug(p.name)),
    meta: {
      title: "Best Cakes in Bengaluru | Fresh Artisanal Cakes | Joe's Bakery",
      description: "Discover the best cakes in Bengaluru – fresh, handcrafted cheesecakes, celebration cakes & more. Order locally baked goodness from Joe's Bakery.",
    },
    faq: [
      ...COMMON_FAQ,
      {
        q: "Are your cakes eggless?",
        a: "We have both vegetarian (eggless) and classic recipes. Each product card shows a veg badge if it's eggless.",
      },
    ],
  },
  {
    slug: "best-cup-cakes-in-bengaluru",
    h1: "Best Cup Cakes in Bengaluru",
    subtitle: "Moist, flavorful & baked in small batches.",
    productSlugs: PRODUCTS.filter(p => (p.type||[]).includes("cup_cake")).map(p => productSlug(p.name)),
    meta: {
      title: "Best Cup Cakes in Bengaluru | Gourmet Cup Cakes | Joe's Bakery",
      description: "Browse the best cup cakes in Bengaluru – indulgent, fluffy, and baked fresh. Perfect for parties, gifting or a personal treat.",
    },
    faq: [
      ...COMMON_FAQ,
      { q: "Do you customize cup cakes?", a: "Yes, minimal frosting themes & edible tags on pre-order (24–48 hrs)." },
    ],
  },
  {
    slug: "best-diwali-gifts-in-bengaluru",
    h1: "Best Diwali Bakery Gifts in Bengaluru",
    subtitle: "Festive treats & curated sweet boxes for your loved ones.",
    productSlugs: PRODUCTS.filter(p => (p.type||[]).some(t => ["cookie","brownie","healthy"].includes(t))).map(p => productSlug(p.name)),
    meta: {
      title: "Best Diwali Gifts in Bengaluru | Premium Bakery Gift Ideas",
      description: "Premium Diwali bakery gifts in Bengaluru – brownies, cookies & wholesome bites. Freshly crafted festive indulgence.",
    },
    faq: [
      ...COMMON_FAQ,
      { q: "Can I bulk order corporate gift boxes?", a: "Yes, reach out via the contact page for bulk pricing & customization." },
    ],
  },
];

// Helper to get a collection by slug
export function getSeoCollection(slug) {
  return SEO_COLLECTIONS.find(c => c.slug === slug);
}

// Resolve a collection's products safely (ignores missing slugs to avoid runtime errors)
export function resolveCollectionProducts(collection) {
  if (!collection) return [];
  return collection.productSlugs.map(ps => productMap[ps]).filter(Boolean);
}

// Export slugs for sitemap or linking
export const SEO_COLLECTION_SLUGS = SEO_COLLECTIONS.map(c => c.slug);
