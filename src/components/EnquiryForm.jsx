import { useState } from 'react';
import { formsApi } from '../services/api';
import { Notice } from './ui';

/**
 * Config-driven form. `fields`: [{ name, label, type?, required?, options?, full? }]
 * Static release → opens the visitor's email app pre-filled. Dynamic → POST /api/forms/:kind.
 */
export default function EnquiryForm({ kind, subject, fields, submitLabel = 'Send enquiry' }) {
  const [values, setValues] = useState({});
  const [status, setStatus] = useState(null);

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ kind: 'info', text: 'Sending…' });
    try {
      const labelled = Object.fromEntries(fields.map((f) => [f.label, values[f.name] || '']));
      const res = await formsApi.submit(kind, subject, labelled);
      setStatus({
        kind: 'ok',
        text: res.mode === 'mailto'
          ? 'Your email app should open with the enquiry filled in. Press send there to reach us.'
          : 'Thank you. We have received your details and will contact you shortly.',
      });
    } catch (err) {
      setStatus({ kind: 'error', text: err.message });
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        {fields.map((f) => (
          <label key={f.name} className={f.full ? 'full' : ''}>
            <span>{f.label}{f.required && <b aria-hidden="true"> *</b>}</span>
            {f.type === 'textarea' ? (
              <textarea rows={4} required={f.required} value={values[f.name] || ''} onChange={set(f.name)} />
            ) : f.options ? (
              <select required={f.required} value={values[f.name] || ''} onChange={set(f.name)}>
                <option value="">Select…</option>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type || 'text'} required={f.required} value={values[f.name] || ''} onChange={set(f.name)} />
            )}
          </label>
        ))}
      </div>
      {status && <Notice kind={status.kind}>{status.text}</Notice>}
      <button className="btn btn-primary" type="submit">{submitLabel}</button>
    </form>
  );
}
