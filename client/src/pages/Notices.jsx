import { useState } from 'react';
import { Paperclip, Pin } from 'lucide-react';
import { api } from '../services/api';
import { useDebounced, useFetch } from '../hooks/useFetch';
import { Badge, EmptyState, ErrorState, PageHero, Pagination, SampleBadge, SearchBar, Select, Skeleton } from '../components/ui';
import { fmtDate } from '../utils/format';

const CATS = ['all', 'General', 'Academic', 'Examination', 'Event', 'Placement'];

export default function Notices() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, meta, loading, error, reload } = useFetch(() => api.list('notices', { q: dq, category, page, limit: 5 }), [dq, category, page]);

  return (
    <>
      <PageHero title="Notices & Announcements" subtitle="Official department announcements, newest first. Pinned notices stay on top." crumb="Notices" />
      <div className="container-x py-10">
        <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_220px]">
          <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search notices…" />
          <Select label="Filter by category" value={category} onChange={(v) => { setCategory(v); setPage(1); }} options={CATS.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))} />
        </div>
        {loading ? <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          : error ? <ErrorState error={error} onRetry={reload} />
          : !data.length ? <EmptyState title="No notices found" text="Try another keyword or category." /> : (
            <>
              <ul className="space-y-4">
                {data.map((n) => (
                  <li key={n._id} className={`card p-5 ${n.pinned ? 'border-accent ring-1 ring-accent/50' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      {n.pinned && <Badge tone="orange"><Pin size={12} className="mr-1" />Pinned</Badge>}
                      <Badge>{n.category}</Badge>{n.isDemo && <SampleBadge />}
                      <span className="text-sm text-slate-500">{fmtDate(n.date)}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-navy-900 dark:text-white">{n.title}</h2>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{n.description}</p>
                    {n.attachmentUrl && <a href={n.attachmentUrl} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy-700 underline dark:text-accent"><Paperclip size={14} /> Attachment</a>}
                  </li>
                ))}
              </ul>
              <Pagination meta={meta} onPage={setPage} />
            </>
          )}
      </div>
    </>
  );
}
