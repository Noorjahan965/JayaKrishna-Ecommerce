import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAsync, useDocumentTitle } from '../hooks';
import { productsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';
import { Loading, Notice, PageHero, Section, SpecTable } from '../components/ui';
import ProductCard from '../components/ProductCard';
import BagArt from '../components/BagArt';

export function Catalogue() {
  useDocumentTitle('Product Catalogue');
  const { data, loading, error } = useAsync(productsApi.list);
  return (
    <>
      <PageHero title="Product Catalogue" subtitle="Browse freely. You only need to sign in when you are ready to buy." crumb="Shop" />
      <Section>
        {loading && <Loading />}
        {error && <Notice kind="error">{error.message}</Notice>}
        <div className="grid-2">{(data || []).map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </Section>
    </>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const { data: product, loading, error } = useAsync(() => productsApi.bySlug(slug), [slug]);
  useDocumentTitle(product?.name);
  const { user, requireAuth } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => { if (product) setSize(product.packs[0].size); }, [product]);

  if (loading) return <Section><Loading /></Section>;
  if (error || !product) {
    return <Section><Notice kind="error">Product not found.</Notice><p><Link to="/shop">Back to catalogue</Link></p></Section>;
  }

  const pack = product.packs.find((p) => p.size === size) || product.packs[0];

  // Guest → redirected to /login (remembering this intent). Signed in → proceeds.
  const buy = (goToCart) => {
    const intent = { type: 'add', slug: product.slug, size: pack.size, qty, goToCart };
    if (!requireAuth(intent)) return;
    add(product.slug, pack.size, qty);
    if (goToCart) navigate('/cart');
    else { setAdded(true); setTimeout(() => setAdded(false), 2500); }
  };

  return (
    <>
      <PageHero title={product.name} subtitle={product.tagline} crumb={<><Link to="/shop">Shop</Link> / {product.name}</>} />
      <Section>
        <div className="detail">
          <div className="detail-art"><BagArt brand={product.brand} size={pack.size} /></div>
          <div>
            <p className="eyebrow">{product.facility}</p>
            <p>{product.description}</p>
            <p className="chips">{product.uses.map((u) => <span key={u} className="chip chip-warm">{u}</span>)}</p>

            <fieldset className="packs">
              <legend>Pack size</legend>
              {product.packs.map((p) => (
                <label key={p.size} className={`pack ${p.size === size ? 'on' : ''}`}>
                  <input type="radio" name="pack" checked={p.size === size} onChange={() => setSize(p.size)} />
                  {p.size} kg
                </label>
              ))}
            </fieldset>

            <p className="price-big">
              {pack.price != null
                ? formatPrice(pack.price)
                : user
                  ? <span className="muted">Price on request. Please contact us.</span>
                  : <span className="muted">Sign in to view price</span>}
            </p>

            <div className="buy-row">
              <label className="qty">
                <span className="sr">Quantity</span>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <input value={qty} inputMode="numeric" onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))} aria-label="Quantity" />
                <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
              </label>
              <button type="button" className="btn btn-primary" onClick={() => buy(false)}>Add to cart</button>
              <button type="button" className="btn btn-accent" onClick={() => buy(true)}>Buy now</button>
            </div>
            {added && <Notice kind="ok">Added to your cart. <Link to="/cart">View cart</Link></Notice>}
            {!user && <p className="small muted">You can browse as a guest. We’ll ask you to sign in when you add to cart or buy.</p>}
          </div>
        </div>
      </Section>

      <Section title="Nutritional Specifications (per 100 g)" tone="warm">
        <SpecTable specs={product.specs} />
      </Section>
    </>
  );
}
