import { Link } from 'react-router-dom';
import BagArt from './BagArt';
import { ShopLink } from './ui';
import { formatPrice } from '../data/products';

export default function ProductCard({ product }) {
  const priced = product.packs.filter((p) => p.price != null);
  const from = priced.length ? Math.min(...priced.map((p) => p.price / p.size)) : null;
  return (
    <article className="product-card">
      <ShopLink to={`/shop/${product.slug}`} className="product-art" aria-label={product.name}>
        <BagArt brand={product.brand} />
      </ShopLink>
      <div className="product-body">
        <p className="eyebrow">{product.facility}</p>
        <h3><ShopLink to={`/shop/${product.slug}`}>{product.name}</ShopLink></h3>
        <p className="muted">{product.description}</p>
        <p className="chips">
          {product.packs.map((p) => <span key={p.size} className="chip">{p.size} kg</span>)}
        </p>
        <p className="price-line">
          {from != null ? <>From <strong>{formatPrice(from)}</strong> / kg</> : <span className="muted">Sign in to view price</span>}
        </p>
        <ShopLink to={`/shop/${product.slug}`} className="btn btn-primary">View details</ShopLink>
      </div>
    </article>
  );
}
