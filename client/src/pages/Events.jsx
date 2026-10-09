import { useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { api } from '../services/api';
import { useDebounced, useFetch } from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { Badge, CardSkeletons, EmptyState, ErrorState, Field, Modal, PageHero, Pagination, SampleBadge, SearchBar, Spinner, Tabs } from '../components/ui';
import { fmtDate, isEmail } from '../utils/format';

function RegisterModal({ event, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', department: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Please enter your full name.';
    if (!isEmail(form.email)) er.email = 'Enter a valid email address.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await api.registerEvent(event._id, { name: form.name.trim(), email: form.email.trim(), department: form.department.trim() });
      setDone(true); toast.success('Registration confirmed.');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={done ? 'Registration confirmed' : `Register: ${event.title}`}>
      {done ? (
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <p className="mt-3 text-slate-700 dark:text-slate-200">Thanks, {form.name}! You are registered for <strong>{event.title}</strong> on {fmtDate(event.date)}.</p>
          <button className="btn-primary mt-6" onClick={onClose}>Close</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Full name" htmlFor="rn" error={errors.name}><input id="rn" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, name: v })); }} /></Field>
          <Field label="Email" htmlFor="re" error={errors.email}><input id="re" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, email: v })); }} /></Field>
          <Field label="Class / department (optional)" htmlFor="rd"><input id="rd" className="input" value={form.department} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, department: v })); }} /></Field>
          <p className="text-xs text-slate-500">Each email can register once per event.</p>
          <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} Confirm registration</button>
        </form>
      )}
    </Modal>
  );
}

export default function Events() {
  const [tab, setTab] = useState('true');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const dq = useDebounced(q);
  const { data, meta, loading, error, reload } = useFetch(() => api.list('events', { q: dq, upcoming: tab, sort: tab === 'true' ? 'dateAsc' : 'date', page, limit: 6 }), [dq, tab, page]);
  const open = (e) => new Date(e.deadline) >= new Date();

  return (
    <>
      <PageHero title="Events & Activities" subtitle="Seminars, workshops, technical events and department programmes." crumb="Events" />
      <div className="container-x py-10">
        <Tabs value={tab} onChange={(v) => { setTab(v); setPage(1); }} tabs={[{ value: 'true', label: 'Upcoming' }, { value: 'false', label: 'Past' }]} />
        <SearchBar className="mb-6 max-w-md" value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search events…" />
        {loading ? <CardSkeletons count={3} /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? <EmptyState title={tab === 'true' ? 'No upcoming events' : 'No past events'} /> : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((e) => (
                <article key={e._id} className="card card-hover flex flex-col p-5">
                  {e.bannerUrl && <img src={e.bannerUrl} alt={e.title} className="mb-4 aspect-[16/9] w-full rounded object-cover" />}
                  <div className="flex flex-wrap items-center gap-2"><Badge tone="orange">{e.type}</Badge>{e.isDemo && <SampleBadge />}</div>
                  <h3 className="mt-2 text-lg font-semibold text-navy-900 dark:text-white">{e.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{e.description}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2"><CalendarDays size={15} className="text-accent" />{fmtDate(e.date)}</li>
                    <li className="flex items-center gap-2"><MapPin size={15} className="text-accent" />{e.venue}</li>
                    <li className="flex items-center gap-2"><Clock size={15} className="text-accent" />Register by {fmtDate(e.deadline)}</li>
                    {e.capacity && <li className="flex items-center gap-2"><Users size={15} className="text-accent" />Capacity {e.capacity}</li>}
                  </ul>
                  <div className="mt-auto pt-5">
                    {tab === 'true' && open(e) ? <button className="btn-primary w-full" onClick={() => setSelected(e)}>Register now</button>
                      : <button className="btn-outline w-full" disabled>{tab === 'true' ? 'Registration closed' : 'Event completed'}</button>}
                  </div>
                </article>
              ))}
            </div>
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </div>
      {selected && <RegisterModal event={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
