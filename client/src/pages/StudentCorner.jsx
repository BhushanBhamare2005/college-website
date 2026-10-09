import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink, Trophy, Rocket } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDebounced, useFetch } from '../hooks/useFetch';
import { Badge, CardSkeletons, EmptyState, ErrorState, PageHero, Pagination, SampleBadge, SearchBar, Tabs } from '../components/ui';

const LINKS = [
  { label: 'Matoshri Education Society', note: 'Add the official URL here' },
  { label: 'University / board notifications', note: 'Add the official URL here' },
  { label: 'Exam timetables', note: 'Add the official URL here' },
];

function Showcase({ type }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, meta, loading, error, reload } = useFetch(() => api.list('projects', { q: dq, type, page, limit: 6 }), [dq, type, page]);
  return (
    <>
      <SearchBar className="mb-6 max-w-md" value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search…" />
      {loading ? <CardSkeletons count={3} /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? <EmptyState title="Nothing to show yet" text="Approved submissions appear here." /> : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <article key={p._id} className="card card-hover p-5">
                <div className="flex items-center gap-2">{type === 'achievement' ? <Trophy className="text-accent" size={18} /> : <Rocket className="text-accent" size={18} />}{p.isDemo && <SampleBadge />}</div>
                <h3 className="mt-3 font-semibold text-navy-900 dark:text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.summary}</p>
                <p className="mt-3 text-xs text-slate-500">By {p.team}</p>
                {p.link && <a className="mt-2 inline-flex items-center gap-1 text-sm underline" href={p.link} target="_blank" rel="noreferrer noopener"><ExternalLink size={14} />Details</a>}
              </article>
            ))}
          </div>
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

function Resources() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, loading, error, reload } = useFetch(() => api.list('resources', { q: dq, limit: 20 }), [dq]);
  return (
    <>
      <SearchBar className="mb-6 max-w-md" value={q} onChange={setQ} placeholder="Search resources…" />
      {loading ? <CardSkeletons count={3} /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? <EmptyState title="No resources found" /> : (
        <ul className="grid gap-4 md:grid-cols-2">{data.map((r) => (
          <li key={r._id} className="card flex items-center justify-between gap-4 p-4">
            <div><div className="flex items-center gap-2"><Badge>{r.category}</Badge>{r.isDemo && <SampleBadge />}</div><p className="mt-1 font-semibold text-navy-900 dark:text-white">{r.title}</p><p className="text-sm text-slate-500">{r.description}</p></div>
            {r.url ? <a className="btn-primary shrink-0" href={r.url} target="_blank" rel="noreferrer noopener"><Download size={16} />Open</a> : <span className="text-xs text-slate-400">No file yet</span>}
          </li>))}
        </ul>
      )}
    </>
  );
}

export default function StudentCorner() {
  const [tab, setTab] = useState('project');
  const { user } = useAuth();
  return (
    <>
      <PageHero title="Student Corner" subtitle="Projects, achievements, resources and useful links." crumb="Student Corner" />
      <div className="container-x py-10">
        <div className="card mb-8 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-slate-700 dark:text-slate-200">Built something or won something? Submissions are reviewed by faculty before they are published.</p>
          {user ? <Link to="/portal" className="btn-primary">Submit from My Portal</Link> : <Link to="/login" state={{ from: '/portal' }} className="btn-primary">Sign in to submit</Link>}
        </div>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'project', label: 'Projects' }, { value: 'achievement', label: 'Achievements' }, { value: 'resources', label: 'Resources' }, { value: 'links', label: 'Useful links' }]} />
        {tab === 'project' && <Showcase type="project" />}
        {tab === 'achievement' && <Showcase type="achievement" />}
        {tab === 'resources' && <Resources />}
        {tab === 'links' && <ul className="grid gap-4 md:grid-cols-3">{LINKS.map((l) => <li key={l.label} className="card p-5"><ExternalLink className="text-accent" /><p className="mt-2 font-semibold text-navy-900 dark:text-white">{l.label}</p><p className="text-sm text-slate-500">{l.note}</p></li>)}</ul>}
      </div>
    </>
  );
}
