// Placeholder pack illustration drawn in SVG until real pack photos are supplied.
// TODO(client): replace with product photos: set `image` on each product in data/products.js.
const THEMES = {
  Kili: { body: '#8f4210', panel: '#fff6d1', ink: '#5f2a0b', band: '#e8b923' },
  Lion: { body: '#4a2008', panel: '#fde68a', ink: '#4a2008', band: '#e8b923' },
};

export default function BagArt({ brand = 'Kili', size, className }) {
  const t = THEMES[brand] || THEMES.Kili;
  return (
    <svg className={className} viewBox="0 0 240 300" role="img" aria-label={`${brand} Brand Maida ${size ? size + ' kg ' : ''}pack`}>
      <defs>
        <linearGradient id={`g-${brand}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".14" />
          <stop offset=".25" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="288" rx="92" ry="9" fill="#000" opacity=".12" />
      <path d="M34 34 Q120 12 206 34 L220 270 Q120 292 20 270 Z" fill={t.body} />
      <path d="M34 34 Q120 12 206 34 L220 270 Q120 292 20 270 Z" fill={`url(#g-${brand})`} />
      <path d="M34 34 Q120 52 206 34" fill="none" stroke={t.band} strokeWidth="3" strokeDasharray="5 5" />
      <rect x="46" y="84" width="148" height="132" rx="12" fill={t.panel} />
      <text x="120" y="112" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2" fill={t.ink}>JAYAKRISHNA</text>
      <text x="120" y="154" textAnchor="middle" fontSize="34" fontWeight="800" fill={t.ink}>{brand.toUpperCase()}</text>
      <text x="120" y="176" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="3" fill={t.ink}>MAIDA</text>
      <line x1="76" x2="164" y1="190" y2="190" stroke={t.ink} strokeOpacity=".35" />
      <text x="120" y="207" textAnchor="middle" fontSize="10" fontWeight="600" fill={t.ink}>100% UNBLEACHED</text>
      {size && (
        <>
          <circle cx="188" cy="236" r="22" fill={t.band} />
          <text x="188" y="241" textAnchor="middle" fontSize="15" fontWeight="800" fill="#4a2008">{size}kg</text>
        </>
      )}
    </svg>
  );
}
