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

	return (
		<header className="site-header">
			<div className="topbar">
				<div className="container topbar-in">
					<span>{company.strapline}</span>
					<a href={`mailto:${company.email}`}>{company.email}</a>
				</div>
			</div>
			<div className="container header-in">
				<Link to="/" className="brand" aria-label="Jayakrishna Flour Mill home">
					<img
						src="/img/logo.png"
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
							<button type="button" className="btn btn-outline btn-sm" onClick={logout}>Sign out</button>
						) : (
							<Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>
						)}
					</div>
				</nav>
			</div>
		</header>
	);
}
