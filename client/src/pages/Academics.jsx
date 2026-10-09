import { useState } from 'react';
import { Clock, Download, FlaskConical, GraduationCap } from 'lucide-react';
import { api } from '../services/api';
import { useDebounced, useFetch } from '../hooks/useFetch';
import { Accordion, Badge, CardSkeletons, EmptyState, ErrorState, PageHero, SampleBadge, SearchBar, Tabs } from '../components/ui';

function Courses() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, loading, error, reload } = useFetch(() => api.list('courses', { q: dq, limit: 20 }), [dq]);
  return (
    <>
      <SearchBar className="mb-6 max-w-md" value={q} onChange={setQ} placeholder="Search courses…" />
      {loading ? <CardSkeletons count={2} /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? <EmptyState title="No courses found" /> : (
        <div className="space-y-6">
          {data.map((c) => (
            <article key={c._id} className="card p-6">
              <div className="flex flex-wrap items-center gap-3">
                <GraduationCap className="text-accent" />
                <h3 className="h-display text-xl font-bold text-navy-900 dark:text-white">{c.name}</h3>
                {c.isDemo && <SampleBadge />}
              </div>
              <div className="mt-2 flex flex-wrap gap-2"><Badge><Clock size={12} className="mr-1" />{c.duration}</Badge><Badge tone="gray">{c.level}</Badge></div>
              <p className="mt-3 text-slate-600 dark:text-slate-300">{c.description}</p>
              {c.subjects?.length > 0 && (
                <div className="mt-5"><Accordion items={[{ title: `Subjects (${c.subjects.length})`, body: <ul className="grid gap-1 sm:grid-cols-2">{c.subjects.map((s) => <li key={s} className="list-inside list-disc">{s}</li>)}</ul> }]} /></div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Labs() {
  const { data, loading, error, reload } = useFetch(() => api.list('labs', { limit: 20 }), []);
  if (loading) return <CardSkeletons count={3} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState title="No laboratories listed" />;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((l) => (
        <article key={l._id} className="card card-hover p-6">
          <FlaskConical className="text-accent" />
          <div className="mt-3 flex flex-wrap items-center gap-2"><h3 className="font-semibold text-navy-900 dark:text-white">{l.name}</h3>{l.isDemo && <SampleBadge />}</div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{l.description}</p>
          <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Equipment</p>
          <ul className="mt-1 flex flex-wrap gap-2">{l.equipment?.map((e) => <li key={e}><Badge tone="gray">{e}</Badge></li>)}</ul>
          <p className="mt-3 text-sm text-slate-500">Lab in-charge: {l.incharge}</p>
        </article>
      ))}
    </div>
  );
}

function Materials() {
  const { data, loading, error, reload } = useFetch(() => api.list('resources', { limit: 20 }), []);
  if (loading) return <CardSkeletons count={3} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState title="No materials uploaded yet" text="Faculty can upload study material from the dashboard." />;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {data.map((r) => (
        <li key={r._id} className="card flex items-center justify-between gap-4 p-4">
          <div><div className="flex items-center gap-2"><Badge>{r.category}</Badge>{r.isDemo && <SampleBadge />}</div><p className="mt-1 font-semibold text-navy-900 dark:text-white">{r.title}</p><p className="text-sm text-slate-500">{r.description}</p></div>
          {r.url ? <a className="btn-primary shrink-0" href={r.url} target="_blank" rel="noreferrer noopener"><Download size={16} /> Open</a> : <span className="text-xs text-slate-400">No file yet</span>}
        </li>
      ))}
    </ul>
  );
}

export default function Academics() {
  const [tab, setTab] = useState('courses');
  return (
    <>
      <PageHero title="Courses & Academics" subtitle="Programmes, laboratories and study material." crumb="Academics" />
      <div className="container-x py-10">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'courses', label: 'Courses' }, { value: 'labs', label: 'Laboratories' }, { value: 'materials', label: 'Study material' }]} />
        {tab === 'courses' && <Courses />}
        {tab === 'labs' && <Labs />}
        {tab === 'materials' && <Materials />}
      </div>
    </>
  );
}
