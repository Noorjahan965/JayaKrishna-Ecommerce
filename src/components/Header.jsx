import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { company, nav } from '../data/site';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShopLink } from './ui';

function NavItem({ item, onNavigate }) {
	if (!item.children) {
		return (
			<li>
				<NavLink to={item.to} end={item.to === '/'} onClick={onNavigate}>{item.label}</NavLink>
			</li>
		);
	}
	return (
		<li className="has-sub">
			{item.to ? (
				<NavLink to={item.to} onClick={onNavigate} className="sub-parent">{item.label}<span aria-hidden="true"> ▾</span></NavLink>
			) : (
				<button type="button" className="sub-parent" aria-haspopup="true">{item.label}<span aria-hidden="true"> ▾</span></button>
			)}
			<ul className="sub">
				{item.children.map((c) => (
					<li key={c.to}>
						{item.shop ? <ShopLink to={c.to} onClick={onNavigate}>{c.label}</ShopLink> : <Link to={c.to} onClick={onNavigate}>{c.label}</Link>}
					</li>
				))}
			</ul>
		</li>
	);
}

export default function Header() {
	const [open, setOpen] = useState(false);
	const { user, logout } = useAuth();
	const { count } = useCart();
	const { pathname } = useLocation();
	useEffect(() => setOpen(false), [pathname]);

	// "Hello <name>" pop-up after sign in or account creation.
	const [welcome, setWelcome] = useState(null);
	const [confirmOut, setConfirmOut] = useState(false);
	useEffect(() => {
		let timer;
		const onWelcome = (e) => {
			setWelcome(e.detail || 'there');
			clearTimeout(timer);
			timer = setTimeout(() => setWelcome(null), 3500);
		};
		window.addEventListener('jk:welcome', onWelcome);
		return () => { window.removeEventListener('jk:welcome', onWelcome); clearTimeout(timer); };
	}, []);

	return (
		<header className="site-header">
			{welcome && (
				<div role="status" style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#b48a43', color: '#fff', padding: '12px 22px', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.3)' }}>
					Hello, {welcome}!
				</div>
			)}
			{confirmOut && (
				<div role="dialog" aria-modal="true" aria-labelledby="signout-title" onClick={() => setConfirmOut(false)} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
					<div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', color: '#2b1a00', borderRadius: 12, padding: '24px 28px', maxWidth: 360, width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,.35)', textAlign: 'center' }}>
						<h3 id="signout-title" style={{ margin: '0 0 8px' }}>Sign out?</h3>
						<p style={{ margin: '0 0 20px' }}>Your cart will be cleared, and you will need to sign in again to place an order.</p>
						<div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
							<button type="button" className="btn btn-outline btn-sm" style={{ color: '#5c3a00', borderColor: '#5c3a00' }} onClick={() => setConfirmOut(false)}>Stay signed in</button>
							<button type="button" className="btn btn-primary btn-sm" onClick={() => { setConfirmOut(false); logout(); }}>Sign out</button>
						</div>
					</div>
				</div>
			)}
			<div className="topbar">
				<div className="container topbar-in">
					<span>{company.strapline}</span>
					<a href={`mailto:${company.email}`}>{company.email}</a>
				</div>
			</div>
			<div className="container header-in">
				<Link to="/" className="brand" aria-label="Jayakrishna Flour Mill home">
					<img
						src="/e-commerce/img/logo.png"
						alt="Jayakrishna – Quality lies in Consistency"
						className="brand-logo"
					/>
				</Link>

				<button className="menu-btn" type="button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((o) => !o)}>
					<span className="sr">Menu</span>
					<span aria-hidden="true">{open ? '✕' : '☰'}</span>
				</button>

				<nav id="main-nav" className={`main-nav ${open ? 'open' : ''}`} aria-label="Main">
					<ul>
						{nav.map((item) => <NavItem key={item.label} item={item} onNavigate={() => setOpen(false)} />)}
					</ul>
					<div className="nav-actions">
						<Link to="/cart" className="cart-link">Cart{count > 0 && <span className="badge">{count}</span>}</Link>
						{user ? (
							<button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmOut(true)}>Sign out</button>
						) : (
							<Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
						)}
					</div>
				</nav>
			</div>
		</header>
	);
}
