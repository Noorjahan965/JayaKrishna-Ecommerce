import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks';
import { company } from '../data/site';
import { advantages, gallery, jobs, onlineBenefits, roi, testimonials } from '../data/content';
import { productsApi } from '../services/api';
import { useAsync } from '../hooks';
import { EmptyState, PageHero, Section, ShopLink } from '../components/ui';

const Page = ({ title, subtitle, crumb, children }) => {
  useDocumentTitle(title);
  return (<><PageHero title={title} subtitle={subtitle} crumb={crumb} />{children}</>);
};

export function About() {
  return (
    <Page title="About Us" subtitle={company.strapline} crumb="About">
      <Section>
        <div className="prose">
          <p>
            Jayakrishna Flour Mill is a Madurai-based flour mill producing pure, safe and extraordinarily soft Maida for bakers, caterers, hotels and retailers across India.
            We mill at two facilities, <strong>Thirumangalam</strong> (Kili Brand Maida) and <strong>Kappalur</strong> (Lion Brand Maida), and both deliver the same uncompromising standard.
          </p>
          <blockquote className="pull">“Every grain matters to us. Whether milled at Thirumangalam or Kappalur, Jayakrishna Flour Mill delivers pure, safe, and extraordinarily soft flour for your finest recipes.”</blockquote>
          <p>
            Our Maida is completely non-harmful and safe for all ages. We never use toxic artificial whiteners or chemical additives. We care deeply about public health and culinary authenticity.
          </p>
          <p><ShopLink to="/shop" className="btn btn-primary">Shop our Maida</ShopLink></p>
        </div>
      </Section>
    </Page>
  );
}

export const Team = () => (
  <Page title="Our Team" crumb="About">
    <Section><EmptyState title="Meet the people behind the mill">Our team profiles are being prepared. Please get in touch if you would like to speak to someone directly.</EmptyState></Section>
  </Page>
);

export const Awards = () => (
  <Page title="Awards & Certificates" crumb="About">
    <Section><EmptyState title="Certificates & recognitions">Our certificates and awards are being added. Please contact us for copies of our quality documentation.</EmptyState></Section>
  </Page>
);

export function WhyChooseUs() {
  return (
    <Page title="Why Choose Us" subtitle="Pure dough advantages and real commercial returns." crumb="About">
      <Section title="The Pure Dough Advantage">
        <div className="grid-4">{advantages.map((a) => <div key={a.title} className="card"><h3>{a.title}</h3><p>{a.text}</p></div>)}</div>
      </Section>
      <Section title="Efficiency & Commercial ROI" tone="warm">
        <div className="roi">{roi.map((r) => <div key={r.title} className="roi-item"><span className="roi-value">{r.value}</span><div><h3>{r.title}</h3><p>{r.text}</p></div></div>)}</div>
      </Section>
      <Section title="Why Online Buyers Choose Us">
        <div className="grid-4">{onlineBenefits.map((b) => <div key={b.title} className="card card-line"><h3>{b.title}</h3><p>{b.text}</p></div>)}</div>
      </Section>
    </Page>
  );
}

export function Video() {
  // TODO(client): set VIDEO_URL (YouTube/Vimeo embed or an .mp4 in /public) when the film is ready.
  const VIDEO_URL = '';
  return (
    <Page title="Video & Animation" subtitle="See how Jayakrishna Maida is made." crumb="Media">
      <Section>
        {VIDEO_URL ? (
          <div className="video"><iframe src={VIDEO_URL} title="Jayakrishna Flour Mill" allowFullScreen loading="lazy" /></div>
        ) : (
          <EmptyState title="Video coming soon">Our brand film and animation will be published here shortly.</EmptyState>
        )}
      </Section>
    </Page>
  );
}

export function Infrastructure() {
  return (
    <Page title="Infrastructure" subtitle="Two Madurai mills, one standard of purity." crumb="Company">
      <Section>
        <div className="grid-2">
          {company.facilities.map((f) => (
            <div key={f.key} className="card card-line">
              <p className="eyebrow">{f.area}</p>
              <h3>{f.name}</h3>
              <p>Home of <strong>{f.brand}</strong>. Every online order is fulfilled directly from recent milling batches at this facility.</p>
            </div>
          ))}
        </div>
        <p className="muted small">Facility photographs, capacity and machinery details will be added here.</p>
      </Section>
    </Page>
  );
}

export function ProcessNutrition() {
  const { data } = useAsync(productsApi.list);
  if (!data) return <Page title="Process & Nutrition" crumb="Company"><Section><p className="loading">Loading…</p></Section></Page>;
  const [kili, lion] = data;
  return (
    <Page title="Process & Nutrition" subtitle="We believe in 100% transparency." crumb="Company">
      <Section title="Nutritional Specifications (per 100 g)" intro="Both Kili Brand and Lion Brand Maida maintain consistent high-protein profiles and uncompromised purity standards.">
        <div className="table-wrap">
          <table className="spec-table spec-compare">
            <thead><tr><th>Nutrient / Specification</th><th>Kili Brand (Thirumangalam)</th><th>Lion Brand (Kappalur)</th></tr></thead>
            <tbody>
              {kili.specs.map(([k, v], i) => (<tr key={k}><th scope="row">{k}</th><td>{v}</td><td>{lion.specs[i][1]}</td></tr>))}
            </tbody>
          </table>
        </div>
        <div className="assure">
          <h3>100% Safe, Harmless &amp; Chemical-Free Assurance</h3>
          <p>Our Maida is completely non-harmful and safe for all ages. We never use toxic artificial whiteners or chemical additives. We care deeply about public health and culinary authenticity.</p>
        </div>
      </Section>
      <Section title="Why it performs" tone="warm">
        <div className="grid-4">{advantages.map((a) => <div key={a.title} className="card"><h3>{a.title}</h3><p>{a.text}</p></div>)}</div>
      </Section>
    </Page>
  );
}

export function Gallery() {
  return (
    <Page title="Gallery" subtitle="What you can make with Jayakrishna Maida." crumb="Media">
      <Section>
        <div className="specialty-grid">{gallery.map((g) => <figure key={g.src} className="specialty"><img src={g.src} alt={g.alt} loading="lazy" /><figcaption>{g.alt}</figcaption></figure>)}</div>
      </Section>
    </Page>
  );
}

export function Testimonials() {
  return (
    <Page title="Testimonials" subtitle="Baker & merchant feedback." crumb="Company">
      <Section>
        <div className="grid-3">{testimonials.map((t) => <blockquote key={t.name} className="quote"><p>“{t.quote}”</p><footer><strong>{t.name}</strong> · {t.role}</footer></blockquote>)}</div>
      </Section>
    </Page>
  );
}

export const Csr = () => (
  <Page title="CSR Activities" crumb="Responsibility">
    <Section><EmptyState title="Our commitment to community">Details of our community and social initiatives will be shared here soon.</EmptyState></Section>
  </Page>
);

export const AnnualReport = () => (
  <Page title="Annual Report" crumb="Responsibility">
    <Section><EmptyState title="Annual & financial reports">Reports will be available for download here. Please contact us if you need a copy now.</EmptyState></Section>
  </Page>
);

export function Career() {
  return (
    <Page title="Career" subtitle="Grow with Jayakrishna Flour Mill." crumb="Company">
      <Section>
        {jobs.length ? (
          <ul className="jobs">{jobs.map((j) => <li key={j.title}><strong>{j.title}</strong> · {j.location}</li>)}</ul>
        ) : (
          <EmptyState title="No open positions listed right now">Send your CV to <a href={`mailto:${company.email}?subject=Career enquiry`}>{company.email}</a> and we will keep it on file.</EmptyState>
        )}
      </Section>
    </Page>
  );
}

export function NotFound() {
  return (
    <Page title="Page not found">
      <Section><EmptyState title="We couldn’t find that page">The link may be old. <Link to="/">Return home</Link> or <Link to="/shop">browse the shop</Link>.</EmptyState></Section>
    </Page>
  );
}
