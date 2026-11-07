import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { config } from '../config';
import { company } from '../data/site';
import { ContactButtons, Notice, PageHero, Section } from '../components/ui';

const COPY = {
  customer: { title: 'Sign in', sub: 'Sign in to add to cart, see prices and place orders.' },
  dealer: { title: 'Dealer Login', sub: 'Dealers can view dealer prices, place orders and see order history.' },
  supplier: { title: 'Supplier Login', sub: 'Suppliers can update rates and upload quotations.' },
};

function PasswordInput({ value, onChange, autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'block' }}>
      <input
        type={show ? 'text' : 'password'}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        style={{ width: '100%', boxSizing: 'border-box', paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex', color: '#5c3a00' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {show ? (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          ) : (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </span>
  );
}

function useAfterAuth() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { add } = useCart();
  // Complete what the guest was trying to do before we sent them to sign in.
  return () => {
    const intent = state?.intent;
    if (intent?.type === 'add') {
      add(intent.slug, intent.size, intent.qty);
      navigate(intent.goToCart ? '/cart' : state?.from || '/shop', { replace: true });
    } else {
      navigate(state?.from || '/', { replace: true });
    }
  };
}

export function Login({ role = 'customer' }) {
  const copy = COPY[role];
  useDocumentTitle(copy.title);
  const { login } = useAuth();
  const { state } = useLocation();
  const done = useAfterAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const u = await login({ ...form, role });
      window.dispatchEvent(new CustomEvent('jk:welcome', { detail: u?.name }));
      done();
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHero title={copy.title} subtitle={copy.sub} />
      <Section>
        <div className="auth-box">
          {state?.intent && <Notice kind="info">Please sign in to continue with your order. We’ll take you straight back.</Notice>}
          {!config.useApi && !config.demoAuth && (
            <Notice kind="info">
              Online accounts open shortly. Until then, please order or enquire by email{company.whatsapp ? ' or WhatsApp' : ''}.
              <ContactButtons message="Hello, I would like to place an order for Maida." />
            </Notice>
          )}
          <form className="form" onSubmit={submit}>
            <label><span>Email</span><input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label><span>Password</span><PasswordInput autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            {err && <Notice kind="error">{err}</Notice>}
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="small">
            {role === 'customer' && <>New here? <Link to="/register" state={state}>Create an account</Link></>}
            {role === 'dealer' && <>Not a dealer yet? <Link to="/dealer/enquiry">Send a dealer enquiry</Link></>}
            {role === 'supplier' && <>Not registered? <Link to="/supplier/register">Register as a supplier</Link></>}
          </p>
        </div>
      </Section>
    </>
  );
}

export function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const { state } = useLocation();
  const done = useAfterAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(null);
    try {
      const u = await register(form);
      window.dispatchEvent(new CustomEvent('jk:welcome', { detail: u?.name || form.name }));
      done();
    } catch (x) { setErr(x.message); }
  };

  return (
    <>
      <PageHero title="Create your account" subtitle="One account for ordering, prices and order history." />
      <Section>
        <div className="auth-box">
          {!config.useApi && !config.demoAuth && (
            <Notice kind="info">Account creation opens shortly. For now, please email us to place an order.<ContactButtons message="Hello, I would like to place an order for Maida." /></Notice>
          )}
          <form className="form" onSubmit={submit}>
            <label><span>Full name</span><input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
            <label><span>Email</span><input type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></label>
            <label><span>Mobile number</span><input type="tel" required value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
            <label><span>Password</span><PasswordInput minLength={8} value={form.password} onChange={set('password')} autoComplete="new-password" /></label>
            {err && <Notice kind="error">{err}</Notice>}
            <button className="btn btn-primary">Create account</button>
          </form>
          <p className="small">Already registered? <Link to="/login" state={state}>Sign in</Link></p>
        </div>
      </Section>
    </>
  );
}
