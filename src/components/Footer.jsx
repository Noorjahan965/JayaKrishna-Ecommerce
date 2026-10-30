import { Link } from 'react-router-dom';
import { company, sitemap } from '../data/site';

export default function Footer() {
	return (
		<footer className="site-footer">
			<div className="container footer-grid">
				<div>
					<img src="/img/logo.png" alt="Jayakrishna – Quality lies in Consistency" className="footer-logo" />
					<p>“{company.tagline}.” Pure, safe, and extraordinarily soft flour for your finest recipes.</p>
					<p className="muted-on-dark">{company.address}</p>
					<p><a href={`mailto:${company.email}`}>{company.email}</a></p>
				</div>
				{sitemap.map((col) => (
					<nav key={col.title} aria-label={col.title}>
						<h4>{col.title}</h4>
						<ul>{col.links.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}</ul>
					</nav>
				))}
			</div>
			<div className="footer-bar">
				<div className="container">© {new Date().getFullYear()} {company.name}. All rights reserved.</div>
			</div>
		</footer>
	);
}
