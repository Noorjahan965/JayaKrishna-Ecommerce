import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useParams } from 'react-router-dom';
import { useAsync, useDocumentTitle } from '../hooks';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../data/products';
import { EmptyState, Loading, Notice, Section } from '../components/ui';

const STATUS_LABEL = {
  pending_payment: 'Awaiting payment',
  paid: 'Placed',
  packed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
// Mirrors the server's rules. The server enforces them either way.
const NEXT = {
    pending_payment: ['cancelled'],
    paid: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
};
const ACTION = { packed: 'Confirm order', shipped: 'Mark as shipped', delivered: 'Mark as delivered', cancelled: 'Cancel order' };const when = (d) => (d ? new Date(d).toLocaleString('en-IN') : '');

/* ---------- Layout and guard ---------- */
export function AdminLayout() {
    useDocumentTitle('Admin');
    const { user, ready } = useAuth();
    if (!ready) return <Section><Loading /></Section>;
    if (!user) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
    // The server checks the role on every request too. This only keeps customers out of the screens.
    if (user.role !== 'admin') return <Navigate to="/" replace />;
    return (
        <div className="admin-wrap">
            <div className="container admin-shell">
                <aside className="admin-side">
                    <p className="admin-who"><strong>{user.name}</strong><span className="small muted">{user.email}</span></p>                    <nav aria-label="Admin">
                        <NavLink to="/admin" end>Dashboard</NavLink>
                        <NavLink to="/admin/orders">Orders &amp; Shipments</NavLink>
                        <NavLink to="/admin/master">Brands &amp; Categories</NavLink>
                        <NavLink to="/admin/products">Products &amp; Stock</NavLink>
                        <NavLink to="/admin/customers">Customers</NavLink>
                        <NavLink to="/admin/careers">Careers</NavLink>
                    </nav>
                </aside>
                <main className="admin-main"><Outlet /></main>
            </div>
        </div>
    );
}

/* ---------- Dashboard ---------- */
export function AdminDashboard() {
    const { data, error } = useAsync(adminApi.stats);
    if (error) return <Notice kind="error">{error.message}</Notice>;
    if (!data) return <Loading />;

    const cards = [
        ['Total paid revenue', formatPrice(data.all.revenue), `${formatPrice(data.month.revenue)} this month`],
        ['Total orders', data.all.orders, `${data.toPack} to pack · ${data.all.delivered} delivered`],
        ['In transit', data.all.shipped, 'shipped, not yet delivered'],
        ['Registered customers', data.customers, 'customer accounts'],
    ];
    const max = Math.max(1, ...data.last7.map((d) => d.revenue));
    const label = (day) => new Date(`${day}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    return (
        <>
            <h2>Dashboard</h2>
            <div className="grid-4">
                {cards.map(([title, big, sub]) => (
                    <div key={title} className="card card-line">
                        <p className="muted small">{title}</p>
                        <p className="price-big">{big}</p>
                        <p className="muted small">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginTop: 24 }}>
                <div className="card">
                    <h3>Revenue, last 7 days</h3>
                    <div className="bars">
                        {data.last7.map((d) => (
                            <div key={d.day} className="bar-col">
                                <div className="bar-track"><div className="bar" style={{ height: `${(d.revenue / max) * 100}%` }} title={formatPrice(d.revenue)} /></div>
                                <span className="small muted">{label(d.day)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <h3>Stock watch (≤ {data.lowStockLimit})</h3>
                    {data.lowStock.length === 0 ? (
                        <p className="muted">All packs are well stocked.</p>
                    ) : (
                        <ul>{data.lowStock.map((r) => <li key={r.id}>{r.name} · {r.size_kg} kg: <strong>{r.stock}</strong> left</li>)}</ul>
                    )}
                    <p><Link to="/admin/products">Manage products &amp; stock →</Link></p>
                </div>
            </div>

            <h3 style={{ marginTop: 32 }}>Recent orders</h3>
            {data.recent.length === 0 ? (
                <p className="muted">No orders yet.</p>
            ) : (
                <div className="table-wrap">
                    <table className="spec-table">
                        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
                        <tbody>
                            {data.recent.map((o) => (
                                <tr key={o.id}>
                                    <td><Link to={`/admin/orders/${o.id}`}>#{o.id}</Link></td>
                                    <td>{o.customer}</td>
                                    <td>{formatPrice(o.total)}</td>
                                    <td><span className="chip chip-warm">{STATUS_LABEL[o.status]}</span></td>
                                    <td>{when(o.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p><Link to="/admin/orders">Go to all orders →</Link></p>
        </>
    );
}

/* ---------- Orders ---------- */
export function AdminOrders() {
    const [params, setParams] = useState({ status: '', q: '', page: 1 });
    const [qInput, setQInput] = useState('');
    const { data, error } = useAsync(() => adminApi.orders(params), [params.status, params.q, params.page]);

    const search = (e) => { e.preventDefault(); setParams({ ...params, q: qInput.trim(), page: 1 }); };

    return (
        <>
            <h2>Orders &amp; Shipments</h2>
            <form className="admin-bar" onSubmit={search}>
                <select className="admin-input" value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })} aria-label="Filter by status">
                    <option value="">All statuses</option>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input className="admin-input" placeholder="Order no., name, email or phone" value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Search orders" />
                <button className="btn btn-primary btn-sm">Search</button>
            </form>

            {error && <Notice kind="error">{error.message}</Notice>}
            {!data ? <Loading /> : data.orders.length === 0 ? (
                <EmptyState title="No orders found">Try a different filter or search.</EmptyState>
            ) : (
                <>
                    <div className="table-wrap">
                        <table className="spec-table">
                            <thead><tr><th>Order</th><th>Customer</th><th>City</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
                            <tbody>
                                {data.orders.map((o) => (
                                    <tr key={o.id}>
                                        <td><Link to={`/admin/orders/${o.id}`}>#{o.id}</Link></td>
                                        <td>{o.customer}<div className="small muted">{o.email}</div></td>
                                        <td>{o.ship_city}</td>
                                        <td>{formatPrice(o.total)}</td>
                                        <td><span className="chip chip-warm">{STATUS_LABEL[o.status]}</span></td>
                                        <td>{when(o.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="admin-bar" style={{ marginTop: 16 }}>
                        <button className="btn btn-outline btn-sm" disabled={data.page <= 1} onClick={() => setParams({ ...params, page: data.page - 1 })}>Previous</button>
                        <span className="muted">Page {data.page} of {data.pages} · {data.total} orders</span>
                        <button className="btn btn-outline btn-sm" disabled={data.page >= data.pages} onClick={() => setParams({ ...params, page: data.page + 1 })}>Next</button>
                    </div>
                </>
            )}
        </>
    );
}

export function AdminOrderDetail() {
    const { id } = useParams();
    const [tick, setTick] = useState(0);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const { data: o, error } = useAsync(() => adminApi.order(id), [id, tick]);

    if (error) return <Notice kind="error">{error.message}</Notice>;
    if (!o) return <Loading />;

    const move = async (status) => {
        if (status === 'cancelled' && !window.confirm('Cancel this order? The bags go back into stock. If the customer has paid, refund them from the Razorpay dashboard.')) return;
        setBusy(true); setMsg(null);
        try { await adminApi.setStatus(id, status); setTick((t) => t + 1); }
        catch (e) { setMsg(e.message); }
        finally { setBusy(false); }
    };

    return (
        <>
            <p><Link to="/admin/orders">← All orders</Link></p>
            <h2>Order #{o.id} · {STATUS_LABEL[o.status]}</h2>
            <p className="muted">Placed {when(o.created_at)}{o.paid_at ? ` · Paid ${when(o.paid_at)}` : ''}</p>

            <div className="admin-actions">
                {NEXT[o.status].map((s) => (
                    <button key={s} className={`btn ${s === 'cancelled' ? 'btn-outline' : 'btn-primary'}`} disabled={busy} onClick={() => move(s)}>{ACTION[s]}</button>
                ))}
            </div>
            {msg && <Notice kind="error">{msg}</Notice>}

            <div className="grid-2">
                <div className="card">
                    <h3>Customer</h3>
                    <p>{o.customer}<br />{o.email}<br />{o.customer_phone}</p>
                </div>
                <div className="card">
                    <h3>Deliver to</h3>
                    <p>
                        {o.ship_name}<br />
                        {o.ship_line1}<br />
                        {o.ship_line2 && <>{o.ship_line2}<br /></>}
                        {o.ship_city}, {o.ship_state} {o.ship_pincode}<br />
                        Phone: {o.ship_phone}
                    </p>
                </div>
            </div>

            <div className="table-wrap" style={{ marginTop: 24 }}>
                <table className="spec-table">
                    <thead><tr><th>Item</th><th>Pack</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
                    <tbody>
                        {o.items.map((i, n) => (
                            <tr key={n}><td>{i.product_name}</td><td>{i.size_kg} kg</td><td>{formatPrice(i.unit_price)}</td><td>{i.qty}</td><td>{formatPrice(i.line_total)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="price-big">Total {formatPrice(o.total)}</p>
            {o.razorpay_payment_id && <p className="small muted">Payment reference: {o.razorpay_payment_id}</p>}
        </>
    );
}

/* ---------- Products ---------- */
function PackRow({ pack }) {
    const [price, setPrice] = useState(pack.price ?? '');
    const [stock, setStock] = useState(pack.stock);
    const [active, setActive] = useState(!!pack.is_active);
    const [state, setState] = useState('');

    const save = async () => {
        const p = price === '' ? null : Number(price);
        const s = Number(stock);
        if (p !== null && (!Number.isFinite(p) || p < 0)) return setState('Enter a valid price');
        if (!Number.isInteger(s) || s < 0) return setState('Stock must be a whole number');
        setState('Saving…');
        try {
            await adminApi.updatePack(pack.id, { price: p, stock: s, is_active: active });
            setState('Saved');
        } catch (e) { setState(e.message); }
    };

    return (
        <tr>
            <td>{pack.size_kg} kg</td>
            <td>{pack.sku}</td>
            <td><input className="admin-input" type="number" min="0" step="0.01" value={price} placeholder="Not set" onChange={(e) => { setPrice(e.target.value); setState(''); }} aria-label={`Price for ${pack.sku}`} /></td>
            <td><input className="admin-input" type="number" min="0" step="1" value={stock} onChange={(e) => { setStock(e.target.value); setState(''); }} aria-label={`Stock for ${pack.sku}`} /></td>
            <td><label><input type="checkbox" checked={active} onChange={(e) => { setActive(e.target.checked); setState(''); }} /> On sale</label></td>
            <td><button className="btn btn-primary btn-sm" onClick={save}>Save</button> <span className="small muted">{state}</span></td>
        </tr>
    );
}

function ProductEditor({ product }) {
    const [f, setF] = useState({
        name: product.name, tagline: product.tagline || '', description: product.description || '',
        facility: product.facility || '', image: product.image || '', is_active: !!product.is_active,
    });
    const [state, setState] = useState('');
    const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setState(''); };

    const save = async () => {
        setState('Saving…');
        try {
            const body = { ...f };
            if (!body.image) delete body.image;
            await adminApi.updateProduct(product.id, body);
            setState('Saved');
        } catch (e) { setState(e.message); }
    };

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <h3>{product.name}</h3>
            <div className="admin-field"><label>Name<input className="admin-input wide" value={f.name} onChange={set('name')} /></label></div>
            <div className="admin-field"><label>Tagline<input className="admin-input wide" value={f.tagline} onChange={set('tagline')} /></label></div>
            <div className="admin-field"><label>Description<textarea className="admin-input wide" rows={3} value={f.description} onChange={set('description')} /></label></div>
            <div className="admin-field"><label>Facility<input className="admin-input wide" value={f.facility} onChange={set('facility')} /></label></div>
            <div className="admin-field"><label>Image path (a file in public/img, e.g. /img/kili-maida.png)<input className="admin-input wide" value={f.image} onChange={set('image')} /></label></div>
            <label><input type="checkbox" checked={f.is_active} onChange={(e) => { setF({ ...f, is_active: e.target.checked }); setState(''); }} /> Show this product on the website</label>
            <p><button className="btn btn-primary" onClick={save}>Save product</button> <span className="small muted">{state}</span></p>

            <h4>Packs, prices and stock</h4>
            <div className="table-wrap">
                <table className="spec-table">
                    <thead><tr><th>Pack</th><th>SKU</th><th>Price (₹)</th><th>Stock</th><th>Status</th><th></th></tr></thead>
                    <tbody>{product.packs.map((k) => <PackRow key={k.id} pack={k} />)}</tbody>
                </table>
            </div>
            <p className="small muted">A pack with no price cannot be ordered online.</p>
        </div>
    );
}

export function AdminProducts() {
    const { data, error } = useAsync(adminApi.products);
    if (error) return <Notice kind="error">{error.message}</Notice>;
    if (!data) return <Loading />;
    return (
        <>
            <h2>Products &amp; Stock</h2>
            {data.map((p) => <ProductEditor key={p.id} product={p} />)}
        </>
    );
}

/* ---------- Customers ---------- */
export function AdminCustomers() {
    const [tick, setTick] = useState(0);
    const [msg, setMsg] = useState(null);
    const { data, error } = useAsync(adminApi.customers, [tick]);

    const toggle = async (c) => {
        const next = !c.is_active;
        if (!next && !window.confirm(`Deactivate ${c.name}? They will be signed out and unable to log in.`)) return;
        setMsg(null);
        try { await adminApi.setCustomerActive(c.id, next); setTick((t) => t + 1); }
        catch (e) { setMsg(e.message); }
    };

    if (error) return <Notice kind="error">{error.message}</Notice>;
    if (!data) return <Loading />;
    return (
        <>
            <h2>Customers</h2>
            {msg && <Notice kind="error">{msg}</Notice>}
            {data.length === 0 ? (
                <EmptyState title="No customers yet">Accounts appear here when people register.</EmptyState>
            ) : (
                <div className="table-wrap">
                    <table className="spec-table">
                        <thead><tr><th>Name</th><th>Contact</th><th>Orders</th><th>Spent</th><th>Joined</th><th></th></tr></thead>
                        <tbody>
                            {data.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.name}{!c.is_active && <span className="chip"> deactivated</span>}</td>
                                    <td>{c.email}<div className="small muted">{c.phone}</div></td>
                                    <td>{c.orders}</td>
                                    <td>{formatPrice(c.spent)}</td>
                                    <td>{when(c.created_at)}</td>
                                    <td><button className="btn btn-outline btn-sm" onClick={() => toggle(c)}>{c.is_active ? 'Deactivate' : 'Reactivate'}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}