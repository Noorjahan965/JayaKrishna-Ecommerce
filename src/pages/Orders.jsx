import { Link, Navigate } from 'react-router-dom';
import { useAsync, useDocumentTitle } from '../hooks';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../data/products';
import { EmptyState, Loading, Notice, PageHero, Section } from '../components/ui';

const STATUS = {
  pending_payment: 'Awaiting payment',
  paid: 'Placed',
  packed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

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