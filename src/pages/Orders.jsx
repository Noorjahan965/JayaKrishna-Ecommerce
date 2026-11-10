import { Link, Navigate } from 'react-router-dom';
import { useAsync, useDocumentTitle } from '../hooks';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../data/products';
import { EmptyState, Loading, Notice, PageHero, Section } from '../components/ui';

const STATUS = {
  pending_payment: 'Awaiting payment',
  paid: 'Placed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STEPS = ['paid', 'packed', 'shipped', 'delivered'];

function Progress({ status }) {
  const at = STEPS.indexOf(status);
  if (at < 0) return null;
  return (
    <ol style={{ display: 'flex', listStyle: 'none', padding: 0, margin: '12px 0' }}>
      {STEPS.map((s, n) => (
        <li key={s} style={{ flex: 1, padding: '0 3px', textAlign: 'center', fontSize: 14, fontWeight: n <= at ? 700 : 400, color: n <= at ? 'inherit' : '#999' }}>
          <div style={{ height: 6, borderRadius: 3, background: n <= at ? '#2e7d32' : '#ddd', marginBottom: 6 }} />
          {STATUS[s]}
        </li>
      ))}
    </ol>
  );
}

export default function Orders() {
    useDocumentTitle('My Orders');
    const { user, ready } = useAuth();
    const { data: orders, loading, error } = useAsync(ordersApi.mine);

    if (!ready || loading) return <Section><Loading /></Section>;
    if (!user) return <Navigate to="/login" replace state={{ from: '/orders' }} />;

    return (
        <>
            <PageHero title="My Orders" crumb="Account" />
            <Section>
                {error && <Notice kind="error">{error.message}</Notice>}
                {(orders || []).length === 0 ? (
                    <EmptyState title="No orders yet">When you place an order it will appear here. <Link to="/shop">Go to shop</Link></EmptyState>
                ) : (
                    (orders || []).map((o) => (
                        <div key={o.id} className="card" style={{ marginBottom: 16 }}>
                            <h3>Order #{o.id} · {STATUS[o.status] || o.status}</h3>
                            <p className="muted">{new Date(o.created_at).toLocaleDateString('en-IN')}</p>
                            <Progress status={o.status} />
                            <ul>
                                {o.items.map((i, n) => (
                                    <li key={n}>{i.product_name} · {i.size_kg} kg × {i.qty}: {formatPrice(i.line_total)}</li>
                                ))}
                            </ul>
                            <p><strong>Total {formatPrice(o.total)}</strong></p>
                        </div>
                    ))
                )}
            </Section>
        </>
    );
}