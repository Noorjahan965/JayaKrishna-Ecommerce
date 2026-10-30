// Product catalogue. Shape mirrors the future MySQL tables:
//   products(id, slug, name, brand, facility, description, image, ...)  +  product_packs(product_id, size_kg, price, sku, in_stock)
// `price: null` = not published yet → UI shows "Sign in to view price".
// TODO(client): supply mill-direct prices (and any dealer-tier prices) when ready.

export const PACK_SIZES = [1, 5, 10, 25, 50]; // kg, from the Product Guide

const makePacks = (code) =>
  PACK_SIZES.map((size) => ({
    size,
    sku: `${code}-${size}KG`,
    price: null,
    inStock: true,
  }));

export const products = [
  {
    id: 1,
    slug: "kili-brand-maida",
    name: "Kili Brand Maida",
    brand: "Kili",
    image: "/img/kili-maida.png",
    facility: "Thirumangalam Facility, Madurai",
    tagline: "High gluten elasticity, precision milled",
    description:
      "Precision milled to preserve natural wheat vitality and high gluten elasticity. Ideal for all-purpose mastery: Parata, Bread, Buns, Puffs, Pastry & Vermicelli.",
    uses: ["Parata", "Bread", "Buns", "Puffs", "Pastry", "Vermicelli"],
    specs: [
      ["Gluten / Protein Content", "12.0% - 13.0%"],
      ["Water Absorption Capacity", "64% - 66%"],
      ["Energy Value", "358 kcal"],
      ["Carbohydrates", "73.5 g"],
      ["Ash Content (Max)", "0.50%"],
      ["Chemical Bleaching Agents", "0.0% (Zero Bleach)"],
    ],
    packs: makePacks("KILI"),
  },
  {
    id: 2,
    slug: "kili-special-rava",
    name: "Kili Special Rava (Sooji)",
    brand: "Kili",
    image: "/img/kili-rava.png",
    facility: "Thirumangalam Facility, Madurai",
    tagline: "Diamond cut: big, bold, consistent",
    description:
      "Pure and natural wheat rava with a diamond cut for big, bold, consistent grains. Ideal for Upma, Kesari, Idli & Pongal, and for breakfasts, snacks and sweets.",
    uses: ["Upma", "Kesari", "Idli", "Pongal"],
    specs: [
      ["Energy Value (per 100 g)", "360 kcal"],
      ["Protein", "12.0 g"],
      ["Total Carbohydrate", "73 g"],
      ["Total Sugar", "Nil"],
      ["Dietary Fibre", "3.0 g"],
      ["Fat", "1.5 g"],
    ],
    packs: makePacks("RAVA"),
  },
];

export const formatPrice = (p) =>
  p == null
    ? null
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(p);
