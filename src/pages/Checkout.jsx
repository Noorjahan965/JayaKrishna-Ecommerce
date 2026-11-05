import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAsync, useDocumentTitle } from '../hooks';
import { ordersApi, productsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';
import { Loading, Notice, PageHero, Section } from '../components/ui';

function loadRazorpay() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('Could not load the payment window. Please try again.'));
        document.body.appendChild(s);
    });
}

export default function Checkout() {
    useDocumentTitle('Checkout');
    const { user, ready } = useAuth();
    const { lines, clear } = useCart();
    const { data: products, loading } = useAsync(productsApi.list);
    const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', line1: '', line2: '', city: '', state: '', pincode: '' });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const [doneId, setDoneId] = useState(null);
    const [method, setMethod] = useState('cod');
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    if (!ready || loading) return <Section><Loading /></Section>;
    if (!user) return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
    if (doneId) {
        return (
            <>
                <PageHero title="Thank you!" crumb="Checkout" />
                <Section>
                    <Notice kind="ok">Your order #{doneId} has been placed. You can pay in cash when it is delivered. <Link to="/orders">View my orders</Link></Notice>                </Section>
            </>
        );
    }
    if (lines.length === 0) return <Navigate to="/cart" replace />;

    const rows = lines.map((l) => {
        const p = (products || []).find((x) => x.slug === l.slug);
        return { ...l, product: p, pack: p?.packs.find((k) => k.size === l.size) };
    });
    // Display only. The server works out the real total from its own prices.
    const total = rows.reduce((n, r) => n + (r.pack?.price ?? 0) * r.qty, 0);

    const pay = async (e) => {
        e.preventDefault();
        if (method !== 'cod') return;
        setBusy(true); setErr(null);
        try {
            const address = { ...form, line2: form.line2 || undefined };
            const o = await ordersApi.place({ lines, address, paymentMethod: 'cod' });

            if (o.mode === 'cod') {
                // Cash on delivery: nothing to pay now.
            } else if (o.mode === 'mock') {
                await ordersApi.mockPay(o.orderId);
            } else {
                await loadRazorpay();
                await new Promise((resolve, reject) => {
                    const rzp = new window.Razorpay({
                        key: o.keyId,
                        amount: o.amount,
                        currency: o.currency,
                        order_id: o.razorpayOrderId,
                        name: 'Jayakrishna Flour Mill',
                        description: `Order #${o.orderId}`,
                        prefill: { name: user.name, email: user.email, contact: form.phone },
                        handler: async (r) => {
                            try { await ordersApi.verify(o.orderId, r); resolve(); } catch (x) { reject(x); }
                        },
                        modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
                    });
                    rzp.open();
                });
            }
            clear();
            setDoneId(o.orderId);
        } catch (x) {
            setErr(x.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <PageHero title="Checkout" crumb="Shop" />
            <Section>
                <div className="cart">
                    <form className="form" onSubmit={pay}>
                        <h3>Delivery address</h3>
                        <label><span>Full name</span><input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
                        <label><span>Mobile number</span><input type="tel" required pattern="[0-9+\-\s]{10,15}" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
                        <label><span>Address line 1</span><input required value={form.line1} onChange={set('line1')} autoComplete="address-line1" /></label>
                        <label><span>Address line 2 (optional)</span><input value={form.line2} onChange={set('line2')} autoComplete="address-line2" /></label>
                        <label><span>City</span><input required value={form.city} onChange={set('city')} autoComplete="address-level2" /></label>
                        <label><span>State</span><input required value={form.state} onChange={set('state')} autoComplete="address-level1" /></label>
                        <label><span>PIN code</span><input required inputMode="numeric" value={form.pincode} onChange={set('pincode')} autoComplete="postal-code" /></label>
                                                <h3>Payment method</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="radio" name="method" checked={method === 'cod'} onChange={() => setMethod('cod')} />
                                <span>Cash on Delivery</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="radio" name="method" checked={method === 'online'} onChange={() => setMethod('online')} />
                                <span>Online Payment</span>
                            </label>
                            {method === 'online' && (
                                <p className="small muted">We are working on it. Online payment will be available soon. Please choose Cash on Delivery for now.</p>
                            )}
                        </div>
                        {err && <Notice kind="error">{err}</Notice>}
                        <button className="btn btn-primary" disabled={busy || method !== 'cod'}>{busy ? 'Processing…' : `Place order · ${formatPrice(total)}`}</button>
                    </form>

                    <aside className="cart-summary">
                        <h3>Order summary</h3>
                        <ul className="cart-lines">
                            {rows.map((r) => (
                                <li key={r.slug + r.size}>
                                    <div>
                                        <strong>{r.product?.name || r.slug}</strong>
                                        <span className="muted"> · {r.size} kg × {r.qty}</span>
                                    </div>
                                    <span>{r.pack?.price != null ? formatPrice(r.pack.price * r.qty) : ''}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="price-big">{formatPrice(total)}</p>
                        <p className="small muted">Delivery and taxes will be confirmed by our team.</p>
                    </aside>
                </div>
            </Section>
        </>
    );
}