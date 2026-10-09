import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { CalendarDays, ClipboardCheck, GraduationCap, Mail, Megaphone, Plus, Ticket, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#14408a', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ef4444'];

export default function Dashboard() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const { data, loading, error, reload } = useFetch(() => api.stats(), []);
  const axis = dark ? '#a8b8d6' : '#475569';
  const grid = dark ? 'rgba(255,255,255,.1)' : '#e2e8f0';

  if (error) return <ErrorState error={error} onRetry={reload} />;
  const t = data?.totals;
  const tiles = [
    { label: 'Faculty', v: t?.faculty, icon: Users, to: '/admin/faculty' }, { label: 'Courses', v: t?.courses, icon: GraduationCap, to: '/admin/courses' },
    { label: 'Notices', v: t?.notices, icon: Megaphone, to: '/admin/notices' }, { label: 'Events', v: t?.events, icon: CalendarDays, to: '/admin/events' },
    { label: 'Registrations', v: t?.registrations, icon: Ticket, to: '/admin/registrations' },
    { label: 'Pending approvals', v: t?.pendingProjects, icon: ClipboardCheck, to: '/admin/projects' },
  ];
  const quick = [
    { to: '/admin/notices', label: 'Post a notice', roles: ['admin', 'faculty'] }, { to: '/admin/events', label: 'Create an event', roles: ['admin'] },
    { to: '/admin/faculty', label: 'Add faculty', roles: ['admin'] }, { to: '/admin/projects', label: 'Review submissions', roles: ['admin', 'faculty'] },
    { to: '/admin/messages', label: `Messages${t?.unreadMessages ? ` (${t.unreadMessages} new)` : ''}`, roles: ['admin'], icon: Mail },
  ].filter((q) => q.roles.includes(user.role));

  return (
    <div className="space-y-6">
      <div><h1 className="h-display text-2xl font-bold text-navy-900 dark:text-white">Dashboard</h1><p className="text-sm text-slate-500">Live figures from the database.</p></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((x) => (
          <Link key={x.label} to={x.to} className="card card-hover p-4">
            <x.icon size={20} className="text-accent" />
            {loading ? <Skeleton className="mt-2 h-7 w-12" /> : <p className="h-display mt-2 text-2xl font-bold text-navy-900 dark:text-white">{x.v ?? 0}</p>}
            <p className="text-xs text-slate-500">{x.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">{quick.map((q) => <Link key={q.to} to={q.to} className="btn-outline"><Plus size={14} />{q.label}</Link>)}</div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-navy-900 dark:text-white">Event participation</h2>
          {loading ? <Skeleton className="h-64" /> : !data.participation.length ? <EmptyState title="No events" text="Create events to see participation." /> : (
            <div className="h-64" role="img" aria-label="Bar chart of registrations per event">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.participation}><CartesianGrid stroke={grid} vertical={false} /><XAxis dataKey="name" tick={{ fill: axis, fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} tick={{ fill: axis, fontSize: 11 }} /><Tooltip /><Bar dataKey="registrations" fill="#14408a" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-navy-900 dark:text-white">Content statistics</h2>
          {loading ? <Skeleton className="h-64" /> : (
            <div className="h-64" role="img" aria-label="Pie chart of content counts">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={data.content} dataKey="count" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>{data.content.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold text-navy-900 dark:text-white">Recent activity</h2>
        {loading ? <Skeleton className="h-24" /> : !data.recent.length ? <p className="text-sm text-slate-500">No recent activity.</p> : (
          <ul className="divide-y divide-slate-100 dark:divide-white/10">{data.recent.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><span>{r.text}</span><span className="text-xs text-slate-500">{fmtDateTime(r.at)}</span></li>)}</ul>
        )}
      </section>
    </div>
  );
}
