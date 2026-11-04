import { useState } from 'react';
import { useAsync, useDocumentTitle } from '../hooks';
import { adminApi } from '../services/api';
import { EmptyState, Loading, Notice } from '../components/ui';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected'];
const when = (d) => (d ? new Date(d).toLocaleString('en-IN') : '');

function JobForm({ row, onSaved, onCancel }) {
  const [f, setF] = useState({
    title: row?.title || '', title_ta: row?.title_ta || '',
    department: row?.department || '', location: row?.location || 'Thirumangalam, Madurai',
    job_type: row?.job_type || 'Full-time', experience: row?.experience || '',
    openings: row?.openings ?? 1, salary: row?.salary || '',
    overview: row?.overview || '', overview_ta: row?.overview_ta || '',
    responsibilities: row?.responsibilities || '', responsibilities_ta: row?.responsibilities_ta || '',
    requirements: row?.requirements || '', requirements_ta: row?.requirements_ta || '',
    is_active: row ? !!row.is_active : true,
  });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { await adminApi.saveJob(row?.id, { ...f, openings: Number(f.openings) || 1 }); onSaved(); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  const area = (k, label, rows = 3) => (
    <div className="admin-field"><label>{label}<textarea className="admin-input wide" rows={rows} value={f[k]} onChange={set(k)} /></label></div>
  );

  return (
    <form className="card" onSubmit={submit} style={{ marginBottom: 24 }}>
      <h3>{row ? 'Edit vacancy' : 'Add vacancy'}</h3>
      <div className="grid-2">
        <div className="admin-field"><label>Job title (English) *<input className="admin-input wide" required minLength={2} value={f.title} onChange={set('title')} /></label></div>
        <div className="admin-field"><label>Job title (தமிழ்)<input className="admin-input wide" value={f.title_ta} onChange={set('title_ta')} /></label></div>
      </div>
      <div className="grid-2">
        <div className="admin-field"><label>Department<input className="admin-input wide" value={f.department} onChange={set('department')} placeholder="Production & Milling" /></label></div>
        <div className="admin-field"><label>Location<input className="admin-input wide" value={f.location} onChange={set('location')} /></label></div>
      </div>
      <div className="grid-4">
        <div className="admin-field"><label>Job type
          <select className="admin-input wide" value={f.job_type} onChange={set('job_type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </label></div>
        <div className="admin-field"><label>Experience<input className="admin-input wide" value={f.experience} onChange={set('experience')} placeholder="1-3 Years" /></label></div>
        <div className="admin-field"><label>Openings<input className="admin-input wide" type="number" min="1" value={f.openings} onChange={set('openings')} /></label></div>
        <div className="admin-field"><label>Salary<input className="admin-input wide" value={f.salary} onChange={set('salary')} placeholder="Competitive" /></label></div>
      </div>
      <div className="grid-2">{area('overview', 'Overview (English)')}{area('overview_ta', 'Overview (தமிழ்)')}</div>
      <div className="grid-2">{area('responsibilities', 'Responsibilities (English, one per line)', 4)}{area('responsibilities_ta', 'Responsibilities (தமிழ், one per line)', 4)}</div>
      <div className="grid-2">{area('requirements', 'Requirements (English, one per line)', 4)}{area('requirements_ta', 'Requirements (தமிழ், one per line)', 4)}</div>
      <label><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Show this vacancy on the website</label>
      {err && <Notice kind="error">{err}</Notice>}
      <p>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>{' '}
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
      </p>
    </form>
  );
}

function Jobs() {
  const [tick, setTick] = useState(0);
  const [editing, setEditing] = useState(null); // null | 'new' | a row
  const [msg, setMsg] = useState(null);
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');
  const { data, error } = useAsync(adminApi.jobs, [tick]);

  const saved = () => { setEditing(null); setTick((t) => t + 1); };
  const del = async (j) => {
    if (!window.confirm(`Delete "${j.title}"?`)) return;
    setMsg(null);
    try { await adminApi.deleteJob(j.id); setTick((t) => t + 1); }
    catch (e) { setMsg(e.message); }
  };

  if (error) return <Notice kind="error">{error.message}</Notice>;
  if (!data) return <Loading />;

  const departments = [...new Set(data.map((j) => j.department).filter(Boolean))];
  const shown = data.filter((j) =>
    (!dept || j.department === dept) &&
    (!q || `${j.title} ${j.department || ''}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <div className="admin-bar">
        <button className="btn btn-accent btn-sm" onClick={() => setEditing('new')}>+ Add vacancy</button>
        <input className="admin-input" placeholder="Search position or department" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vacancies" />
        <select className="admin-input" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      {editing && <JobForm key={editing === 'new' ? 'new' : editing.id} row={editing === 'new' ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />}
      {msg && <Notice kind="error">{msg}</Notice>}
      {shown.length === 0 ? (
        <EmptyState title="No vacancies">Use "Add vacancy" to post one.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="spec-table">
            <thead><tr><th>Position</th><th>Department</th><th>Location</th><th>Type</th><th>Openings</th><th>Salary</th><th>Applied</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {shown.map((j) => (
                <tr key={j.id}>
                  <td><strong>{j.title}</strong><div className="small muted">{j.title_ta}</div></td>
                  <td>{j.department}</td>
                  <td>{j.location}</td>
                  <td className="nowrap">{j.job_type}<div className="small muted">{j.experience}</div></td>
                  <td>{j.openings}</td>
                  <td>{j.salary}</td>
                  <td>{j.applications}</td>
                  <td><span className="chip chip-warm">{j.is_active ? 'Live' : 'Hidden'}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn-outline btn-sm" onClick={() => { setMsg(null); setEditing(j); }}>Edit</button>
                    <button className="btn btn-outline btn-sm" onClick={() => del(j)}>Delete</button>
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

function Applications() {
  const [tick, setTick] = useState(0);
  const [msg, setMsg] = useState(null);
  const { data, error } = useAsync(adminApi.applications, [tick]);

  const setStatus = async (a, status) => {
    setMsg(null);
    try { await adminApi.setApplicationStatus(a.id, status); setTick((t) => t + 1); }
    catch (e) { setMsg(e.message); }
  };

  if (error) return <Notice kind="error">{error.message}</Notice>;
  if (!data) return <Loading />;
  if (data.length === 0) return <EmptyState title="No applications yet">They will appear here when people apply on the Career page.</EmptyState>;

  return (
    <>
      {msg && <Notice kind="error">{msg}</Notice>}
      <div className="table-wrap">
        <table className="spec-table">
          <thead><tr><th>Applied</th><th>Applicant</th><th>Position</th><th>Note</th><th>Status</th></tr></thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id}>
                <td className="nowrap">{when(a.created_at)}</td>
                <td><strong>{a.name}</strong><div className="small muted">{a.email}<br />{a.phone}</div></td>
                <td>{a.job}</td>
                <td>{a.message ? <details><summary>Read</summary><p>{a.message}</p></details> : <span className="muted">None</span>}</td>
                <td>
                  <select className="admin-input" value={a.status} onChange={(e) => setStatus(a, e.target.value)} aria-label={`Status of ${a.name}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminCareers() {
  useDocumentTitle('Careers');
  const [tab, setTab] = useState('jobs');
  return (
    <>
      <h2>Careers</h2>
      <div className="admin-bar">
        <button className={`btn btn-sm ${tab === 'jobs' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('jobs')}>Job openings</button>
        <button className={`btn btn-sm ${tab === 'apps' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('apps')}>Applications</button>
      </div>
      {tab === 'jobs' ? <Jobs /> : <Applications />}
    </>
  );
}