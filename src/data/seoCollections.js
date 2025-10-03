// src/data/seoCollections.js
import slugify from "slugify";
const productSlug = (name) => slugify(String(name || ""), { lower: true });

// Shared default FAQ blocks – can be reused
const COMMON_FAQ = [
  {
    q: "Do you deliver across Bengaluru?",
    a: "Yes, we currently accept and deliver orders across Bengaluru city limits. For bulk or special deliveries, contact us directly.",
  },
  {
    q: "How far in advance should I place an order?",
    a: "For standard items 24 hours is ideal; for custom or large celebration cakes 48–72 hours helps us guarantee freshness.",
  },
];


export const SEO_COLLECTIONS = [
  {
    slug: "best-cakes-in-bengaluru",
    h1: "Best Cakes in Bengaluru (Fresh & Artisanal)",
    subtitle: "Hand-picked favorites loved by our Bengaluru customers.",
    productTypes: ["cake"],
    productSlugs: [
      // "new-york-cheesecake", // leave commented or include if you want reference only
    ],
    meta: {
      title: "Best Cakes in Bengaluru | Fresh Artisanal Cakes | Joe's Bakery",
      description:
        "Discover the best cakes in Bengaluru – fresh, handcrafted cheesecakes, celebration cakes & more. Order locally baked goodness from Joe's Bakery.",
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
    productTypes: ["cup_cake"],
    meta: {
      title: "Best Cup Cakes in Bengaluru | Gourmet Cup Cakes | Joe's Bakery",
      description:
        "Browse the best cup cakes in Bengaluru – indulgent, fluffy, and baked fresh. Perfect for parties, gifting or a personal treat.",
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
    productTypes: ["cookie", "brownie", "healthy", "cup_cake"],
    meta: {
      title: "Best Diwali Gifts in Bengaluru | Premium Bakery Gift Ideas",
      description:
        "Premium Diwali bakery gifts in Bengaluru – brownies, cookies & wholesome bites. Freshly crafted festive indulgence.",
    },
    faq: [
      ...COMMON_FAQ,
      { q: "Can I bulk order corporate gift boxes?", a: "Yes, reach out via the contact page for bulk pricing & customization." },
    ],
  },

// --- NEW HIGH-TRAFFIC COLLECTIONS ADDED BELOW ---

  {
    slug: "eggless-cakes-delivery-bengaluru",
    h1: "Premium Eggless & Vegetarian Cakes in Bengaluru",
    subtitle: "Freshly baked, 100% vegetarian cakes without compromising on flavor or texture.",
    productTypes: ["mousse", "cake",],
    meta: {
      title: "Eggless Cakes Delivery in Bengaluru | Vegetarian Cakes | Joe's Bakery",
      description:
        "Order the best eggless cakes in Bengaluru for any celebration. Delicious 100% vegetarian birthday, anniversary, and theme cakes available for delivery.",
    },
    faq: [
      ...COMMON_FAQ,
      {
        q: "Do all your eggless cakes come with a vegetarian certificate?",
        a: "Yes, all our vegetarian products are clearly labeled and follow strict hygiene and preparation standards.",
      },
    ],
  },

  {
    slug: "gourmet-mousse-cakes-bengaluru",
    h1: "Gourmet Mousse Cakes & Pastries Delivery in Bengaluru",
    subtitle: "Silky smooth chocolate mousse, decadent Nutella, and classic Tiramisu cakes.",
    productTypes: ["mousse", "tub_cake"],
    meta: {
      title: "Best Mousse Cakes in Bengaluru | Tiramisu & Chocolate Mousse | Joe's Bakery",
      description:
        "Experience the luxury of our mousse cakes! Order Tiramisu, Chocolate Nutella Mousse Cake, and more for same-day delivery in Bengaluru.",
    },
    faq: [
      ...COMMON_FAQ,
      {
        q: "Are your mousse cakes suitable for immediate serving?",
        a: "Yes, they are chilled and ready to serve, but we recommend storing them in the refrigerator upon arrival for optimal texture.",
      },
    ],
  },
  
  {
    slug: "fudgy-brownies-and-cookies-bengaluru",
    h1: "Fudgy Brownies & Gourmet Cookies Delivery in Bengaluru",
    subtitle: "Signature chewy brownies, chunky cookies, and specialty dessert tubs.",
    productTypes: ["brownie", "cookie", "mousse"],
    meta: {
      title: "Fudgy Brownies & Gourmet Cookies in Bengaluru | Joe's Bakery",
      description:
        "Order Joe's OG Brownies, Double Chocolate Cranberry cookies, and more. Freshly baked, intensely rich desserts delivered across Bengaluru.",
    },
    faq: [
      ...COMMON_FAQ,
      {
        q: "Do you offer assorted cookie or brownie boxes?",
        a: "Yes, you can choose from our curated selection boxes or customize your own assortment (subject to minimum order quantity).",
      },
    ],
  },

  {
    slug: "premium-cheesecakes-delivery-bengaluru",
    h1: "Best Cheesecakes Delivery in Bengaluru (Baked & No-Bake)",
    subtitle: "New York, Blueberry, and specialty flavor cheesecakes for every occasion.",
    productTypes: ["cake"],
    meta: {
      title: "Cheesecake Delivery in Bengaluru | New York Style & Baked Cheesecake | Joe's Bakery",
      description:
        "Indulge in premium cheesecakes delivered straight to your door in Bengaluru. Try our classic New York style or fruit-flavored options.",
    },
    faq: [
      ...COMMON_FAQ,
      {
        q: "Can I pre-order a cheesecake flavor not listed?",
        a: "For large or custom-flavor cheesecakes, please contact us 72 hours in advance to discuss your requirements.",
      },
    ],
  },
  
  {
    slug: "classic-tea-cakes-and-loaves-bengaluru",
    h1: "Classic Tea Cakes and Loaves in Bengaluru",
    subtitle: "Perfectly moist vanilla, marble, and fruit loaves for tea time.",
    productTypes: ["teacake"],
    meta: {
      title: "Tea Cakes & Loaves Delivery in Bengaluru | Vanilla & Plum Cake | Joe's Bakery",
      description:
        "Find the best tea cakes and moist loaves in Bengaluru. Order Joe's OG Vanilla Loaf, Upside-Down Plum Cake, and other wholesome tea time snacks.",
    },
    faq: [
      ...COMMON_FAQ,
      {
        q: "How long do the cake loaves stay fresh?",
        a: "Stored correctly in an airtight container, our loaves stay fresh for 3-5 days at room temperature or longer if refrigerated.",
      },
    ],
  },

];

// Helper to get a collection by slug
export function getSeoCollection(slug) {
  return SEO_COLLECTIONS.find((c) => c.slug === slug);
}

export function resolveCollectionProducts(collection) {
  if (!collection) return [];
  return [];
}

// Export slugs for sitemap or linking
export const SEO_COLLECTION_SLUGS = SEO_COLLECTIONS.map((c) => c.slug);
export function productNameToSlug(name) {
  return productSlug(name);
}