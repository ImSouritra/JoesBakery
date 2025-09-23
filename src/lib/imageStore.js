// src/lib/imageStore.js
import localforage from "localforage";

// configure a store just for product images
localforage.config({
  name: "joesbakery",
  storeName: "product_images", // IndexedDB store
});

/**
 * Save a base64 DataURL or Blob into IndexedDB.
 * Returns a unique key you can store in your product object.
 */
export async function saveImageDataUrl(dataUrl) {
  const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await localforage.setItem(key, dataUrl);
  return key;
}

/**
 * Retrieve an image DataURL/Blob by key
 */
export async function getImageDataUrl(key) {
  return await localforage.getItem(key);
}

/**
 * Delete an image by key
 */
export async function removeImageKey(key) {
  return await localforage.removeItem(key);
}
