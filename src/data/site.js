// Company details and navigation. Facts come from the Product Guide.
export const company = {
  name: 'Jayakrishna Flour Mill',
  tagline: 'Every grain matters to us',
  strapline: "Madurai's premier milling excellence | 100% unbleached & safe",
  email: 'Support@jayakrishnaflourmill.com',
  // TODO(client): not in the guide. Fill in; the WhatsApp/Call buttons appear automatically once set.
  phone: '',
  whatsapp: '', // digits with country code, e.g. 919876543210
  address: 'Thirumangalam & Kappalur, Madurai, Tamil Nadu, India',
  facilities: [
    { key: 'thirumangalam', name: 'Thirumangalam Facility', area: 'Thirumangalam, Madurai', brand: 'Kili Brand Maida' },
    { key: 'kappalur', name: 'Kappalur Facility', area: 'Kappalur, Madurai', brand: 'Lion Brand Maida' },
  ],
};

// Header navigation (grouped so it fits). The footer lists the complete client sitemap.
export const nav = [
  { label: 'Home', to: '/' },
  {
    label: 'About',
    to: '/about',
    children: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Team', to: '/about/team' },
      { label: 'Why Choose Us', to: '/about/why-choose-us' },
      { label: 'Awards & Certificates', to: '/about/awards' },
    ],
  },
  {
    label: 'Shop',
    to: '/shop',
    shop: true,
    children: [
      { label: 'Product Catalogue', to: '/shop' },
      { label: 'Kili Brand Maida', to: '/shop/kili-brand-maida' },
      { label: 'Lion Brand Maida', to: '/shop/lion-brand-maida' },
    ],
  },
  { label: 'Infrastructure', to: '/infrastructure' },
  { label: 'Process & Nutrition', to: '/process-nutrition' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Testimonials', to: '/testimonials' },
  {
    label: 'Partners',
    to: '/dealer/enquiry',
    children: [
      { label: 'Dealer Enquiry', to: '/dealer/enquiry' },
      { label: 'Dealer Login', to: '/dealer/login' },
      { label: 'Supplier Registration', to: '/supplier/register' },
      { label: 'Supplier Login', to: '/supplier/login' },
    ],
  },
  {
    label: 'More',
    children: [
      { label: 'Video / Animation', to: '/video' },
      { label: 'CSR Activities', to: '/csr' },
      { label: 'Annual Report', to: '/annual-report' },
      { label: 'Career', to: '/career' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];

// Full sitemap in the order the client gave it, used by the footer.
export const sitemap = [
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Our Team', to: '/about/team' },
      { label: 'Why Choose Us', to: '/about/why-choose-us' },
      { label: 'Awards & Certificates', to: '/about/awards' },
      { label: 'Video / Animation', to: '/video' },
      { label: 'Infrastructure', to: '/infrastructure' },
      { label: 'Process & Nutrition', to: '/process-nutrition' },
      { label: 'Gallery', to: '/gallery' },
      { label: 'Testimonials', to: '/testimonials' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { label: 'Product Catalogue', to: '/shop' },
      { label: 'Kili Brand Maida', to: '/shop/kili-brand-maida' },
      { label: 'Lion Brand Maida', to: '/shop/lion-brand-maida' },
      { label: 'Sign In', to: '/login' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { label: 'Dealer Enquiry', to: '/dealer/enquiry' },
      { label: 'Dealer Login', to: '/dealer/login' },
      { label: 'Supplier Registration', to: '/supplier/register' },
      { label: 'Supplier Login', to: '/supplier/login' },
      { label: 'Career', to: '/career' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Responsibility & Policies',
    links: [
      { label: 'CSR Activities', to: '/csr' },
      { label: 'Annual Report', to: '/annual-report' },
      { label: 'Terms & Conditions', to: '/policies/terms' },
      { label: 'Privacy Policy', to: '/policies/privacy' },
      { label: 'Return Policy', to: '/policies/returns' },
    ],
  },
];
