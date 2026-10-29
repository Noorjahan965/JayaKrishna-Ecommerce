// Product catalogue. Shape mirrors the future MySQL tables:
//   products(id, slug, name, brand, facility, description, ...)  +  product_packs(product_id, size_kg, price, sku, in_stock)
// `price: null` = not published yet → UI shows "Sign in to view price".
// TODO(client): supply mill-direct prices (and any dealer-tier prices) when ready.

export const PACK_SIZES = [1, 5, 10, 25, 50]; // kg, from the Product Guide

const makePacks = (code) =>
  PACK_SIZES.map((size) => ({ size, sku: `${code}-${size}KG`, price: null, inStock: true }));

export const products = [
  {
    id: 1,
    slug: 'kili-brand-maida',
    name: 'Kili Brand Maida',
    brand: 'Kili',
    facility: 'Thirumangalam Facility, Madurai',
    tagline: 'High gluten elasticity, precision milled',
    description:
      'Precision milled to preserve natural wheat vitality and high gluten elasticity. Ideal for all-purpose mastery: Parata, Bread, Buns, Puffs, Pastry & Vermicelli.',
    uses: ['Parata', 'Bread', 'Buns', 'Puffs', 'Pastry', 'Vermicelli'],
    specs: [
      ['Gluten / Protein Content', '12.0% - 13.0%'],
      ['Water Absorption Capacity', '64% - 66%'],
      ['Energy Value', '358 kcal'],
      ['Carbohydrates', '73.5 g'],
      ['Ash Content (Max)', '0.50%'],
      ['Chemical Bleaching Agents', '0.0% (Zero Bleach)'],
    ],
    packs: makePacks('KILI'),
  },
  {
    id: 2,
    slug: 'lion-brand-maida',
    name: 'Lion Brand Maida',
    brand: 'Lion',
    facility: 'Kappalur Facility, Madurai',
    tagline: 'High-protein blends for a robust rise',
    description:
      'Crafted with high-protein wheat blends for robust dough rise and baking structure. Ideal for all-purpose mastery: Parata, Bread, Buns, Puffs, Pastry & Vermicelli.',
    uses: ['Parata', 'Bread', 'Buns', 'Puffs', 'Pastry', 'Vermicelli'],
    specs: [
      ['Gluten / Protein Content', '11.5% - 12.5%'],
      ['Water Absorption Capacity', '62% - 64%'],
      ['Energy Value', '355 kcal'],
      ['Carbohydrates', '74.2 g'],
      ['Ash Content (Max)', '0.48%'],
      ['Chemical Bleaching Agents', '0.0% (Zero Bleach)'],
    ],
    packs: makePacks('LION'),
  },
];

export const formatPrice = (p) =>
  p == null ? null : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(p);
