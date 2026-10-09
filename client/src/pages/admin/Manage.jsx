import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Check, MailOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounced, useFetch } from '../../hooks/useFetch';
import { Badge, ConfirmDialog, EmptyState, ErrorState, Field, Modal, Pagination, SearchBar, Select, Spinner, TableSkeleton } from '../../components/ui';
import { toInputDate } from '../../utils/format';
import { MODULES } from './modules';

const TONES = { approved: 'green', published: 'green', pending: 'orange', rejected: 'red', admin: 'red', faculty: 'blue', student: 'gray' };

function toForm(fields, row) {
  const f = {};
  fields.forEach((fl) => {
    const v = row?.[fl.key];
    if (fl.uploadTarget) { f[fl.key] = ''; f[fl.uploadTarget] = row?.[fl.uploadTarget] ?? ''; }
    else if (fl.type === 'date') f[fl.key] = v ? toInputDate(v) : toInputDate(new Date());
    else if (fl.type === 'list') f[fl.key] = Array.isArray(v) ? v.join(', ') : '';
    else if (fl.type === 'checkbox') f[fl.key] = !!v;
    else if (fl.type === 'select') f[fl.key] = v ?? fl.options[0];
    else f[fl.key] = v ?? '';
  });
  return f;
}
function toPayload(fields, form) {
  const p = {};
  fields.forEach((fl) => {
    if (fl.uploadTarget) { if (form[fl.uploadTarget]) p[fl.uploadTarget] = form[fl.uploadTarget]; return; }
    const v = form[fl.key];
    if (fl.type === 'list') p[fl.key] = String(v).split(',').map((s) => s.trim()).filter(Boolean);
    else if (fl.type === 'number') p[fl.key] = v === '' ? undefined : Number(v);
    else if (fl.type === 'date') p[fl.key] = v ? new Date(v).toISOString() : undefined;
    else p[fl.key] = typeof v === 'string' ? v.trim() : v;
  });
  return p;
}

function RecordForm({ mod, row, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(mod.fields, row));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    mod.fields.forEach((f) => { if (!(row && f.createOnly)) { const m = f.validate?.(form[f.key]); if (m) er[f.key] = m; } });
    Object.assign(er, mod.crossValidate?.(form) || {});
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const payload = toPayload(mod.fields.filter((field) => !(row && field.createOnly)), form);
      if (row) await api.update(mod.resource, row._id, payload); else await api.create(mod.resource, payload);
      toast.success(row ? 'Changes saved.' : 'Record created.');
      onSaved();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`${row ? 'Edit' : 'Add'} – ${mod.title}`} wide>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {mod.fields.filter((field) => !(row && field.createOnly)).map((f) => {
          const id = `f-${f.key}`;
          const cls = `input ${errors[f.key] ? 'input-error' : ''}`;
          const full = f.type === 'textarea' || f.type === 'list' ? 'sm:col-span-2' : '';
          return (
            <div key={f.key} className={full}>
              {f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 pt-7 text-sm font-medium"><input type="checkbox" checked={form[f.key]} onChange={(e) => setForm((p0) => ({ ...p0, [f.key]: e.target.checked }))} /> {f.label}</label>
              ) : (
                <Field label={f.label} htmlFor={id} error={errors[f.key]}>
                  {f.type === 'file' ? <div><input id={id} type="file" accept={f.accept} className={cls} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                      const result = await api.upload(f.uploadKind, file);
                      setForm((previous) => ({ ...previous, [f.uploadTarget || f.key]: result.data.url }));
                      setErrors((previous) => ({ ...previous, [f.key]: '' }));
                    } catch (error) { setErrors((previous) => ({ ...previous, [f.key]: error.message })); toast.error(error.message); }
                    finally { setBusy(false); }
                  }} />{form[f.uploadTarget || f.key] && <a className="mt-1 inline-block text-xs underline" href={form[f.uploadTarget || f.key]} target="_blank" rel="noreferrer noopener">Uploaded file</a>}</div>
                    : f.type === 'textarea' ? <textarea id={id} rows={4} className={cls} value={form[f.key]} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, [f.key]: v })); }} />
                    : f.type === 'select' ? <select id={id} className={cls} value={form[f.key]} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, [f.key]: v })); }}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
                    : <input id={id} type={f.type === 'email' ? 'email' : f.type === 'password' ? 'password' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} autoComplete={f.type === 'password' ? 'new-password' : undefined} className={cls} value={form[f.key]} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, [f.key]: v })); }} />}
                </Field>
              )}
            </div>
          );
        })}
        <div className="flex justify-end gap-3 sm:col-span-2">
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Manage() {
  const { module } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const mod = MODULES[module];
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const dq = useDebounced(q);

  const { data, meta, loading, error, reload } = useFetch(
    () => (mod ? api.list(mod.resource, { q: dq, page, limit: 8, ...(mod.filter && filter !== 'all' ? { [mod.filter.key]: filter } : {}) }) : Promise.resolve({ data: [] })),
    [module, dq, filter, page],
  );

  if (!mod || !mod.roles.includes(user.role)) return <Navigate to="/admin" replace />;
  const can = (a) => mod[a].includes(user.role);
  const approvalKey = mod.resource === 'users' ? 'accountStatus' : 'status';
  const approvalValue = mod.resource === 'projects' ? 'approved' : mod.resource === 'users' ? 'approved' : 'published';

  const act = async (fn, okMsg) => {
    try { await fn(); toast.success(okMsg); reload(); } catch (e) { toast.error(e.message); }
  };
  const confirmDelete = async () => {
    setBusy(true);
    try { await api.remove(mod.resource, deleting._id); toast.success('Record deleted.'); setDeleting(null); if (data.length === 1 && page > 1) setPage(page - 1); else reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const hasActions = can('edit') || can('del') || mod.approval || mod.markRead;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="h-display text-2xl font-bold text-navy-900 dark:text-white">{mod.title}</h1>{meta && <p className="text-sm text-slate-500">{meta.total} records</p>}</div>
        {can('create') && <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add new</button>}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_220px]">
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={mod.search} />
        {mod.filter ? <Select label={`Filter by ${mod.filter.label}`} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={[{ value: 'all', label: `All ${mod.filter.label.toLowerCase()}s` }, ...mod.filter.options.map((o) => ({ value: o, label: o }))]} /> : <div />}
      </div>

      <div className="card overflow-hidden">
        {loading ? <TableSkeleton /> : error ? <div className="p-4"><ErrorState error={error} onRetry={reload} /></div> : !data.length ? <div className="p-4"><EmptyState text="No records match your search or filter." /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
                <tr>{mod.columns.map((c) => <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>)}{hasActions && <th className="px-4 py-3 text-right font-semibold">Actions</th>}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {data.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    {mod.columns.map((c) => (
                      <td key={c.key} className="max-w-[260px] truncate px-4 py-3 text-slate-700 dark:text-slate-200">
                        {c.badge ? <Badge tone={TONES[r[c.key]] || 'gray'}>{r[c.key]}</Badge> : c.render ? c.render(r) : r[c.key]}
                        {c.key === module.slice(0, 0) + mod.columns[0].key && r.isDemo ? <span className="ml-2 text-[10px] uppercase text-slate-400">sample</span> : null}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {mod.approval && user.role === 'admin' && (mod.resource !== 'users' || r.role === 'student') && r[approvalKey] !== approvalValue && <button className="btn-ghost !p-2 text-emerald-600" aria-label="Approve" title="Approve" onClick={() => act(() => api.update(mod.resource, r._id, { [approvalKey]: approvalValue }), mod.resource === 'users' ? 'Student account approved.' : 'Approved and published.')}><Check size={16} /></button>}
                        {mod.approval && user.role === 'admin' && (mod.resource !== 'users' || r.role === 'student') && r[approvalKey] !== 'rejected' && <button className="btn-ghost !p-2 text-amber-600" aria-label="Reject" title="Reject" onClick={() => act(() => api.update(mod.resource, r._id, { [approvalKey]: 'rejected' }), mod.resource === 'users' ? 'Student account rejected.' : 'Submission rejected.')}><X size={16} /></button>}
                        {mod.markRead && !r.read && <button className="btn-ghost !p-2" aria-label="Mark as read" title="Mark as read" onClick={() => act(() => api.update(mod.resource, r._id, { read: true }), 'Marked as read.')}><MailOpen size={16} /></button>}
                        {can('edit') && mod.fields.length > 0 && <button className="btn-ghost !p-2" aria-label="Edit" title="Edit" onClick={() => setEditing(r)}><Pencil size={16} /></button>}
                        {can('del') && <button className="btn-ghost !p-2 text-red-600" aria-label="Delete" title="Delete" onClick={() => setDeleting(r)}><Trash2 size={16} /></button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination meta={meta} onPage={setPage} />

      {editing && <RecordForm mod={mod} row={editing === 'new' ? null : editing} onClose={setEditing} onSaved={() => { setEditing(null); reload(); }} />}
      <ConfirmDialog open={!!deleting} busy={busy} message={`Delete "${deleting?.title || deleting?.name || deleting?.eventTitle || 'this record'}"? This cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
