import { Link } from 'react-router-dom';
import { config } from '../config';
import { company } from '../data/site';

/** Link into the shop. Uses the separate shop URL when configured, else the in-app /shop route. */
export function ShopLink({ to, children, ...rest }) {
  if (config.shopUrl) return <a href={config.shopUrl + to} {...rest}>{children}</a>;
  return <Link to={to} {...rest}>{children}</Link>;
}

export function PageHero({ title, subtitle, crumb }) {
  return (
    <header className="page-hero">
      <div className="container">
        {crumb && <p className="crumb">{crumb}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="lead">{subtitle}</p>}
      </div>
    </header>
  );
}

export function Section({ title, intro, children, tone, id }) {
  return (
    <section className={`section ${tone === 'warm' ? 'section-warm' : ''}`} id={id}>
      <div className="container">
        {title && <h2 className="section-title">{title}</h2>}
        {intro && <p className="section-intro">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
      <ContactButtons />
    </div>
  );
}

export function ContactButtons({ message = 'Hello, I would like to know more about Jayakrishna Flour Mill.' }) {
  return (
    <div className="btn-row">
      <a className="btn btn-primary" href={`mailto:${company.email}`}>Email us</a>
      {company.whatsapp && (
        <a className="btn btn-outline" href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`}>WhatsApp</a>
      )}
      {company.phone && <a className="btn btn-outline" href={`tel:${company.phone}`}>Call</a>}
    </div>
  );
}

export function SpecTable({ specs }) {
  return (
    <table className="spec-table">
      <tbody>
        {specs.map(([k, v]) => (
          <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export function Notice({ kind = 'info', children }) {
  return <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function Loading() {
  return <div className="loading" aria-busy="true">Loading…</div>;
}
