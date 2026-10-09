import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import FacultyAvatar from '../components/FacultyAvatar';
import { api } from '../services/api';
import { useDebounced, useFetch } from '../hooks/useFetch';
import { CardSkeletons, EmptyState, ErrorState, PageHero, Pagination, SampleBadge, SearchBar, Select } from '../components/ui';

const DESIGNATIONS = ['all', 'Head of Department', 'Project Guide', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

export default function Faculty() {
  const [q, setQ] = useState('');
  const [designation, setDesignation] = useState('all');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, meta, loading, error, reload } = useFetch(() => api.list('faculty', { q: dq, designation, page, limit: 8 }), [dq, designation, page]);

  return (
    <>
      <PageHero title="Faculty Directory" subtitle="Teaching staff of the Department of Electronics and Computer Engineering." />
      <div className="container-x py-10">
        <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_240px]">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, expertise…" />
          <Select label="Filter by designation" value={designation} onChange={(v) => { setDesignation(v); setPage(1); }} options={DESIGNATIONS.map((d) => ({ value: d, label: d === 'all' ? 'All designations' : d }))} />
        </div>
        {loading ? <CardSkeletons count={4} /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? <EmptyState title="No faculty found" text="Try a different search or filter." /> : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.map((f) => (
                <article key={f._id} className="card card-hover flex flex-col p-5 text-center">
                  <FacultyAvatar faculty={f} className="mx-auto h-24 w-24 text-2xl" />
                  <h3 className="mt-3 font-semibold text-navy-900 dark:text-white">{f.name}</h3>
                  <p className="text-sm font-medium text-accent-600">{f.designation}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.qualification}</p>
                  <p className="text-xs text-slate-500">{f.specialization}</p>
                  {f.isDemo && <div className="mt-2"><SampleBadge /></div>}
                  <div className="mt-auto flex justify-center gap-2 pt-4">
                    <Link to={`/faculty/${f._id}`} className="btn-primary !px-3 !py-2">View profile</Link>
                    <a href={`mailto:${f.email}`} className="btn-outline !px-3 !py-2" aria-label={`Email ${f.name}`}><Mail size={16} /></a>
                  </div>
                </article>
              ))}
            </div>
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
