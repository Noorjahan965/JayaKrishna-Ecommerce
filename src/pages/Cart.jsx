import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAsync, useDocumentTitle } from '../hooks';
import { ordersApi, productsApi, formsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { company } from '../data/site';
import { formatPrice } from '../data/products';
import { EmptyState, Loading, Notice, PageHero, Section } from '../components/ui';

export default function Cart() {
  useDocumentTitle('Your Cart');
  const { user, ready } = useAuth();
  const { lines, setQty, count } = useCart();
  const location = useLocation();
  const { data: products, loading } = useAsync(productsApi.list);
  const [msg, setMsg] = useState(null);

  if (!ready || loading) return <Section><Loading /></Section>;
  // The cart is a buying area: guests are sent to sign in, then returned here.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const rows = lines.map((l) => {
    const p = (products || []).find((x) => x.slug === l.slug);
    const pack = p?.packs.find((k) => k.size === l.size);
    return { ...l, product: p, pack };
  });
  const allPriced = rows.length > 0 && rows.every((r) => r.pack?.price != null);
  const total = rows.reduce((n, r) => n + (r.pack?.price ?? 0) * r.qty, 0);

  const checkout = async () => {
    setMsg(null);
    try {
      await ordersApi.place({ lines });
    } catch (e) {
      setMsg({ kind: 'info', text: e.message });
    }
  };

  const emailOrder = () =>
    formsApi.submit('order', 'Order enquiry', {
      Customer: `${user.name} <${user.email}>`,
      Items: rows.map((r) => `${r.product?.name} ${r.size} kg × ${r.qty}`).join('; '),
    });

  return (
    <>
      <PageHero title="Your Cart" crumb="Shop" />
      <Section>
        {rows.length === 0 ? (
          <EmptyState title="Your cart is empty">Browse the catalogue and add a pack to get started. <Link to="/shop">Go to shop</Link></EmptyState>
        ) : (
          <div className="cart">
            <ul className="cart-lines">
              {rows.map((r) => (
                <li key={r.slug + r.size}>
                  <div>
                    <strong>{r.product?.name || r.slug}</strong>
                    <span className="muted"> · {r.size} kg pack</span>
                    <div className="small muted">{r.pack?.price != null ? formatPrice(r.pack.price) : 'Price on request'}</div>
                  </div>
                  <label className="qty">
                    <span className="sr">Quantity</span>
                    <button type="button" onClick={() => setQty(r.slug, r.size, r.qty - 1)} aria-label="Decrease">−</button>
                    <input readOnly value={r.qty} aria-label="Quantity" />
                    <button type="button" onClick={() => setQty(r.slug, r.size, r.qty + 1)} aria-label="Increase">+</button>
                  </label>
                </li>
              ))}
            </ul>
            <aside className="cart-summary">
              <h3>Order summary</h3>
              <p>{count} item{count === 1 ? '' : 's'}</p>
              <p className="price-big">{allPriced ? formatPrice(total) : <span className="muted">Total on confirmation</span>}</p>
              <button type="button" className="btn btn-primary" onClick={checkout}>Proceed to checkout</button>
              <button type="button" className="btn btn-outline" onClick={emailOrder}>Send order by email</button>
              {msg && <Notice kind={msg.kind}>{msg.text} You can send this order to {company.email} using the button above.</Notice>}
            </aside>
          </div>
        )}
      </Section>
    </>
  );
}
