// Marketing content taken from the Product Guide. Nothing here is invented.
// Items marked TODO(client) are sections the guide does not cover.

export const specialties = [
  { title: 'Soft Flaky Paratas', img: '/img/parata.jpg' },
  { title: 'Fresh Sliced Breads', img: '/img/bread.jpg' },
  { title: 'Soft Golden Buns', img: '/img/buns.jpg' },
  { title: 'Flaky Puffs & Layered Pastries', img: '/img/pastry.jpg' },
  { title: 'Traditional Plain Raw Vermicelli', img: '/img/vermicelli.jpg' },
];

export const advantages = [
  { title: '2-Day Refrigerated Dough Stability', text: 'Knead dough in advance and refrigerate for up to 2 days without discoloration or loss of elasticity.' },
  { title: '2-Day Refrigerated Parata Freshness', text: 'Cooked paratas remain exceptionally soft even after 2 days in the refrigerator. Just heat and serve!' },
  { title: 'Natural Half-White Tone', text: '100% free from harsh chemical bleaches (Benzoyl Peroxide or Chlorine Gas).' },
  { title: 'Superior Water Absorption', text: 'Absorbs up to 12% more water, delivering higher yield per bag for commercial kitchens.' },
];

export const roi = [
  { value: '+10%', title: 'Higher Yield', text: 'High hydration yields 21-22 Paratas per kg compared to the market average of 18-19.' },
  { value: '0', title: 'Preservatives Needed', text: 'Natural gluten strength eliminates the cost of dough conditioners and softening additives.' },
];

export const onlineBenefits = [
  { title: 'Direct From Mill Pricing', text: 'Cut out middleman margins. Get authentic mill-direct rates for both Kili and Lion brands.' },
  { title: 'Flexible Packaging Options', text: 'Available in 1kg, 5kg, 10kg, 25kg, and 50kg commercial polypropylene bags for easy handling.' },
  { title: 'Fresh Batch Guarantee', text: 'Every online order is fulfilled directly from recent milling batches at Thirumangalam or Kappalur.' },
  { title: 'Reliable Doorstep Logistics', text: 'Fast, hassle-free freight shipping for single bags or multi-ton commercial consignments.' },
];

export const testimonials = [
  { name: 'Madurai Hoteliers Association', role: 'Hospitality', quote: 'We switch between Kili and Lion brands based on stock availability from Thirumangalam and Kappalur. Both deliver identical, world-class soft paratas that our customers love!' },
  { name: 'Royal Bakery Chain', role: 'Commercial bakery', quote: "Our puffs and pastries expanded by 20% in puffiness without adding any dough improver. Jayakrishna Flour Mill's Maida is a game-changer for commercial bakers." },
  { name: 'Online Bulk Buyer', role: 'E-commerce client', quote: 'Ordering online direct from Jayakrishna Flour Mill saved us time and hassle. The flour quality is 100% consistent across every bag we receive!' },
];

export const gallery = [
  ...[
    ['/img/parata.jpg', 'Soft flaky paratas'],
    ['/img/bread.jpg', 'Fresh sliced bread'],
    ['/img/buns.jpg', 'Soft golden buns'],
    ['/img/pastry.jpg', 'Puffs and layered pastries'],
    ['/img/vermicelli.jpg', 'Plain raw vermicelli strands'],
  ].map(([src, alt]) => ({ src, alt })),
];
// TODO(client): mill, packing and dispatch photos for Gallery and Infrastructure.

export const jobs = []; // TODO(client): open positions. Empty list shows the "send your CV" message.
