import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Inbox, Search, X, Loader2 } from 'lucide-react';

export const Spinner = ({ size = 18 }) => <Loader2 size={size} className="animate-spin" aria-hidden />;

export function Badge({ children, tone = 'blue', className = '' }) {
  const tones = {
    blue: 'bg-sky-100 text-navy-800 dark:bg-sky-400/15 dark:text-sky-200',
    orange: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-200',
    gray: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
  };
  return <span className={`badge ${tones[tone]} ${className}`}>{children}</span>;
}
export const SampleBadge = () => <Badge tone="gray" className="!text-[10px] uppercase tracking-wide">Sample</Badge>;

export function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent-600">{eyebrow}</p>}
        <h2 className="h-display text-2xl font-bold text-navy-900 sm:text-3xl dark:text-white">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-600 dark:text-slate-300">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({ title, subtitle, crumb }) {
  return (
    <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 py-14 text-white">
      <div className="container-x">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-sky-200">
          <Link to="/" className="hover:underline">Home</Link> / <span>{crumb || title}</span>
        </nav>
        <h1 className="h-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sky-100">{subtitle}</p>}
      </div>
    </section>
  );
}

export const Skeleton = ({ className = 'h-4 w-full' }) => <div className={`skeleton ${className}`} aria-hidden />;
export function CardSkeletons({ count = 3 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <Skeleton className="h-14 w-14 rounded-full" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}
export function TableSkeleton({ rows = 5 }) {
  return <div className="space-y-3 p-4" aria-busy="true">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>;
}

export function EmptyState({ title = 'Nothing here yet', text = 'No records match your search.', action }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Inbox size={40} className="text-slate-400" />
      <h3 className="text-lg font-semibold text-navy-900 dark:text-white">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{text}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const offline = error?.status === 0;
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 border-red-200 px-6 py-10 text-center dark:border-red-500/30">
      <AlertTriangle size={36} className="text-red-500" />
      <h3 className="text-lg font-semibold text-navy-900 dark:text-white">{offline ? 'Server unavailable' : 'Something went wrong'}</h3>
      <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">{error?.message || 'Please try again.'}</p>
      {onRetry && <button className="btn-primary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="search" aria-label={placeholder} className="input pl-10" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Select({ value, onChange, options, label, className = '' }) {
  return (
    <select aria-label={label} className={`input ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  const { page, pages, total } = meta;
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {pages} · {total} records</p>
      <div className="flex gap-2">
        <button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={16} /> Prev</button>
        <button className="btn-outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={16} /></button>
      </div>
    </nav>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition ${value === t.value ? 'border-accent text-navy-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-navy-800 dark:text-slate-400 dark:hover:text-white'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
      {items.map((it, i) => (
        <div key={it.title} className="bg-white dark:bg-navy-900">
          <button className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-semibold text-navy-900 dark:text-white" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
            {it.title}<ChevronDown size={18} className={`transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <div className="px-5 pb-5 text-slate-600 dark:text-slate-300">{it.body}</div>}
        </div>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-navy-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl outline-none sm:rounded-2xl dark:bg-navy-900 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="h-display text-xl font-bold text-navy-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="btn-ghost !p-2"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-slate-600 dark:text-slate-300">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm} disabled={busy}>{busy && <Spinner />}{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, error, children, htmlFor, hint }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
