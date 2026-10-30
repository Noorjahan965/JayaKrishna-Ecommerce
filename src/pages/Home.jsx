import { Link } from 'react-router-dom';
import { useAsync, useDocumentTitle } from '../hooks';
import { productsApi } from '../services/api';
import { company } from '../data/site';
import { advantages, onlineBenefits, roi, specialties, testimonials } from '../data/content';
import { Section, ShopLink } from '../components/ui';
import ProductCard from '../components/ProductCard';
import BagArt from '../components/BagArt';

export default function Home() {
	useDocumentTitle('');
	const { data: products } = useAsync(productsApi.list);

	return (
		<>
			<section className="hero">
				<div className="container hero-in">
					<div className="hero-copy">
						<p className="pill">{company.tagline}</p>
						<h1>Pure, unbleached Maida milled fresh in Madurai</h1>
						<p className="lead">
							Kili Brand Maida for parata, bread, buns, puffs, pastry and vermicelli, and Kili Special Rava for upma, idli and pongal. 100% safe, harmless and chemical-free, direct from our mills.
						</p>
						<div className="btn-row">
							<ShopLink to="/shop" className="btn btn-accent">Shop Maida</ShopLink>
							<Link to="/dealer/enquiry" className="btn btn-ghost">Become a dealer</Link>
						</div>
						<ul className="hero-points">
							<li>0% chemical bleaching agents</li>
							<li>1 kg to 50 kg packs</li>
							<li>Mill-direct, doorstep delivery</li>
						</ul>
					</div>
					<div className="hero-art" aria-hidden="true">
						<BagArt image="/img/kili-rava.png" className="bag bag-a" />
						<BagArt image="/img/kili-maida.png" className="bag bag-b" />
					</div>
				</div>
			</section>

			<Section title="Our Products" intro="Kili Brand Maida and Kili Special Rava, milled at our Thirumangalam facility with the same pure, chemical-free promise." tone="warm">
				<div className="grid-2">
					{(products || []).map((p) => <ProductCard key={p.id} product={p} />)}
				</div>
			</Section>

			<Section title="Signature Bakery Specialties" intro="One flour, endless recipes: from flaky paratas to layered pastries and traditional vermicelli.">
				<div className="specialty-grid">
					{specialties.map((s) => (
						<figure key={s.title} className="specialty">
							<img src={s.img} alt={s.title} loading="lazy" />
							<figcaption>{s.title}</figcaption>
						</figure>
					))}
				</div>
			</Section>

			<Section title="The Pure Dough Advantage" intro="Our Maida possesses high-quality natural gluten that gives dough incredible stretchiness and air-retention without chemical additives." tone="warm">
				<div className="grid-4">
					{advantages.map((a) => (
						<div key={a.title} className="card"><h3>{a.title}</h3><p>{a.text}</p></div>
					))}
				</div>
				<div className="roi">
					{roi.map((r) => (
						<div key={r.title} className="roi-item">
							<span className="roi-value">{r.value}</span>
							<div><h3>{r.title}</h3><p>{r.text}</p></div>
						</div>
					))}
				</div>
			</Section>

			<Section title="Why Online Buyers Choose Jayakrishna Flour Mill" intro="Wholesale online ordering for commercial bakeries, caterers, restaurant chains and retail distributors across India.">
				<div className="grid-4">
					{onlineBenefits.map((b) => (
						<div key={b.title} className="card card-line"><h3>{b.title}</h3><p>{b.text}</p></div>
					))}
				</div>
			</Section>

			<Section title="What Bakers & Merchants Say" tone="warm">
				<div className="grid-3">
					{testimonials.map((t) => (
						<blockquote key={t.name} className="quote">
							<p>“{t.quote}”</p>
							<footer><strong>{t.name}</strong></footer>
						</blockquote>
					))}
				</div>
			</Section>

			<section className="cta">
				<div className="container cta-in">
					<div>
						<h2>Ready to elevate your bakery &amp; kitchen quality?</h2>
						<p>Bulk &amp; retail orders welcome. Experience the pure, soft, and chemical-free difference.</p>
					</div>
					<ShopLink to="/shop" className="btn btn-accent">Buy online now</ShopLink>
				</div>
			</section>
		</>
	);
}
