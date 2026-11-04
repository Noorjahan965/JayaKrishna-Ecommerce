import { useState } from 'react';
import { useAsync, useDocumentTitle } from '../hooks';
import { adminApi } from '../services/api';
import { EmptyState, Loading, Notice } from '../components/ui';

const CONFIG = {
    brands: {
        label: 'brand',
        list: () => adminApi.brands(),
        save: (id, body) => adminApi.saveBrand(id, body),
        remove: (id) => adminApi.deleteBrand(id),
        extra: { key: 'tagline', label: 'Tagline / positioning', head: 'Tagline' },
    },
    categories: {
        label: 'category',
        list: () => adminApi.categories(),
        save: (id, body) => adminApi.saveCategory(id, body),
        remove: (id) => adminApi.deleteCategory(id),
        extra: { key: 'slug', label: 'Slug (used in web addresses; leave blank to make it from the name)', head: 'Slug' },
    },
};

function MasterForm({ cfg, row, onSaved, onCancel }) {
    const x = cfg.extra.key;
    const [f, setF] = useState({
        name: row?.name || '',
        name_ta: row?.name_ta || '',
        [x]: row?.[x] || '',
        description: row?.description || '',
        display_order: row?.display_order ?? 0,
        is_active: row ? !!row.is_active : true,
    });
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErr(null);
        const body = { ...f, display_order: Number(f.display_order) || 0 };
        if (x === 'slug' && !body.slug) delete body.slug;
        try { await cfg.save(row?.id, body); onSaved(); }
        catch (ex) { setErr(ex.message); }
        finally { setBusy(false); }
    };

    return (
        <form className="card" onSubmit={submit} style={{ marginBottom: 24 }}>
            <h3>{row ? `Edit ${cfg.label}` : `Add new ${cfg.label}`}</h3>
            <div className="grid-2">
                <div className="admin-field"><label>Name (English) *<input className="admin-input wide" required minLength={2} value={f.name} onChange={set('name')} /></label></div>
                <div className="admin-field"><label>Name (தமிழ்)<input className="admin-input wide" value={f.name_ta} onChange={set('name_ta')} /></label></div>
            </div>
            <div className="admin-field"><label>{cfg.extra.label}<input className="admin-input wide" value={f[x]} onChange={set(x)} /></label></div>
            <div className="admin-field"><label>Description<textarea className="admin-input wide" rows={2} value={f.description} onChange={set('description')} /></label></div>
            <div className="admin-bar">
                <label>Display order <input className="admin-input" type="number" min="0" value={f.display_order} onChange={set('display_order')} /></label>
                <label><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Active</label>
            </div>
            {err && <Notice kind="error">{err}</Notice>}
            <p>
                <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>{' '}
                <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
            </p>
        </form>
    );
}

export function AdminMaster() {
    useDocumentTitle('Brands & Categories');
    const [tab, setTab] = useState('brands');
    const [tick, setTick] = useState(0);
    const [editing, setEditing] = useState(null); // null | 'new' | a row
    const [msg, setMsg] = useState(null);
    const cfg = CONFIG[tab];
    const { data, error } = useAsync(cfg.list, [tab, tick]);

    const switchTab = (k) => { setTab(k); setEditing(null); setMsg(null); };
    const saved = () => { setEditing(null); setTick((t) => t + 1); };
    const del = async (row) => {
        if (!window.confirm(`Delete ${cfg.label} "${row.name}"?`)) return;
        setMsg(null);
        try { await cfg.remove(row.id); setTick((t) => t + 1); }
        catch (e) { setMsg(e.message); }
    };

    return (
        <>
            <h2>Brands &amp; Categories</h2>
            <div className="admin-bar">
                <button className={`btn btn-sm ${tab === 'brands' ? 'btn-primary' : 'btn-outline'}`} onClick={() => switchTab('brands')}>Brands</button>
                <button className={`btn btn-sm ${tab === 'categories' ? 'btn-primary' : 'btn-outline'}`} onClick={() => switchTab('categories')}>Categories</button>
                <button className="btn btn-accent btn-sm" onClick={() => setEditing('new')}>+ Add {cfg.label}</button>
            </div>

            {editing && (
                <MasterForm key={editing === 'new' ? `new-${tab}` : editing.id} cfg={cfg} row={editing === 'new' ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />
            )}
            {msg && <Notice kind="error">{msg}</Notice>}
            {error && <Notice kind="error">{error.message}</Notice>}

            {!data ? <Loading /> : data.length === 0 ? (
                <EmptyState title={`No ${cfg.label}s yet`}>Use the button above to add one.</EmptyState>
            ) : (
                <div className="table-wrap">
                    <table className="spec-table">
                        <thead><tr><th>Name</th><th>தமிழ்</th><th>{cfg.extra.head}</th><th>Products</th><th>Order</th><th>Status</th><th></th></tr></thead>
                        <tbody>
                            {data.map((r) => (
                                <tr key={r.id}>
                                    <td><strong>{r.name}</strong><div className="small muted">ID #{r.id}</div></td>
                                    <td>{r.name_ta}</td>
                                    <td>{r[cfg.extra.key]}</td>
                                    <td>{r.products}</td>
                                    <td>{r.display_order}</td>
                                    <td><span className="chip chip-warm">{r.is_active ? 'Active' : 'Hidden'}</span></td>
                                    <td className="actions-cell">
                                        <button className="btn btn-outline btn-sm" onClick={() => { setMsg(null); setEditing(r); }}>Edit</button>
                                        <button className="btn btn-outline btn-sm" onClick={() => del(r)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}