import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Calendar, CalendarDays, FlaskConical, GraduationCap, Megaphone, Trophy, Users, Mail, MapPin, Phone, FileText } from 'lucide-react';
import { api } from '../services/api';
import FacultyAvatar from '../components/FacultyAvatar';
import { useFetch } from '../hooks/useFetch';
import { Badge, CardSkeletons, EmptyState, ErrorState, SampleBadge, SectionHeader, Skeleton } from '../components/ui';
import { fmtDate } from '../utils/format';
import { DEPARTMENT } from '../data/demo';

const QUICK = [
  { to: '/academics', label: 'Courses & Labs', icon: GraduationCap },
  { to: '/notices', label: 'Notices', icon: Megaphone },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/student-corner', label: 'Resources', icon: BookOpen },
  { to: '/faculty', label: 'Faculty', icon: Users },
  { to: '/contact', label: 'Contact us', icon: Mail },
];

export default function Home() {
  const stats = useFetch(() => api.publicStats(), []);
  const notices = useFetch(() => api.list('notices', { limit: 4 }), []);
  const events = useFetch(() => api.list('events', { upcoming: 'true', sort: 'dateAsc', limit: 3 }), []);
  const faculty = useFetch(() => api.list('faculty', { limit: 4 }), []);
  const projects = useFetch(() => api.list('projects', { limit: 3 }), []);

  const s = stats.data;
  const tiles = [
    { label: 'Faculty', value: s?.faculty, icon: Users }, { label: 'Courses', value: s?.courses, icon: GraduationCap },
    { label: 'Laboratories', value: s?.labs, icon: FlaskConical }, { label: 'Events', value: s?.events, icon: CalendarDays },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        <img src="/images/college-photo.jpg" alt="Aerial view of Matoshri College of Engineering and Research Centre campus" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-900/85 to-navy-900/30" />
        <div className="container-x py-20 sm:py-28 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <p className="mb-3 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-sky-100 ring-1 ring-white/20">{DEPARTMENT.society}</p>
            <h1 className="h-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">Department of <span className="text-accent">Electronics &amp; Computer</span> Engineering</h1>
            <p className="mt-5 text-lg text-sky-100">{DEPARTMENT.college}, {DEPARTMENT.location}. One place for faculty, courses, laboratories, notices, events and achievements.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/academics" className="btn-accent !px-6 !py-3">Explore academics <ArrowRight size={18} /></Link>
              <Link to="/notices" className="btn !border !border-white/40 !px-6 !py-3 text-white hover:bg-white/10">Latest notices</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container-x -mt-10 relative z-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="card flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-navy-800 dark:bg-white/10 dark:text-accent"><t.icon size={22} /></span>
              <div>
                {stats.loading ? <Skeleton className="h-7 w-10" /> : <p className="h-display text-2xl font-bold text-navy-900 dark:text-white">{t.value ?? '—'}</p>}
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.label}</p>
              </div>
            </div>
          ))}
        </div>
        {stats.error && <p className="mt-2 text-sm text-red-600">Statistics unavailable: {stats.error.message}</p>}
      </section>

      <section className="container-x mt-16">
        <SectionHeader eyebrow="Quick links" title="Everything in one place" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className="card card-hover flex flex-col items-center gap-2 p-5 text-center">
              <q.icon className="text-navy-700 dark:text-accent" size={26} />
              <span className="text-sm font-semibold text-navy-900 dark:text-white">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeader eyebrow="Announcements" title="Latest notices" action={<Link to="/notices" className="btn-ghost">View all <ArrowRight size={16} /></Link>} />
          {notices.loading ? <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
            : notices.error ? <ErrorState error={notices.error} onRetry={notices.reload} />
            : !notices.data.length ? <EmptyState title="No notices yet" text="Check back soon." />
            : <ul className="space-y-3">{notices.data.map((n) => (
              <li key={n._id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2"><Badge tone={n.pinned ? 'orange' : 'blue'}>{n.pinned ? 'Pinned · ' : ''}{n.category}</Badge>{n.isDemo && <SampleBadge />}<span className="text-xs text-slate-500">{fmtDate(n.date)}</span></div>
                <h3 className="mt-2 font-semibold text-navy-900 dark:text-white">{n.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{n.description}</p>
              </li>))}</ul>}
        </div>
        <div>
          <SectionHeader eyebrow="Don't miss" title="Upcoming events" action={<Link to="/events" className="btn-ghost">All events <ArrowRight size={16} /></Link>} />
          {events.loading ? <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
            : events.error ? <ErrorState error={events.error} onRetry={events.reload} />
            : !events.data.length ? <EmptyState title="No upcoming events" text="New events will appear here." />
            : <ul className="space-y-3">{events.data.map((e) => (
              <li key={e._id} className="card flex gap-4 p-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-navy-800 text-center text-white">
                  <div><p className="h-display text-xl font-bold leading-none">{new Date(e.date).getDate()}</p><p className="text-xs uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</p></div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><Badge tone="orange">{e.type}</Badge>{e.isDemo && <SampleBadge />}</div>
                  <h3 className="mt-1 font-semibold text-navy-900 dark:text-white">{e.title}</h3>
                  <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{e.venue}</p>
                </div>
              </li>))}</ul>}
        </div>
      </section>

      <section className="container-x mt-16">
        <SectionHeader eyebrow="Our people" title="Faculty highlights" action={<Link to="/faculty" className="btn-ghost">Full directory <ArrowRight size={16} /></Link>} />
        {faculty.loading ? <CardSkeletons count={4} /> : faculty.error ? <ErrorState error={faculty.error} onRetry={faculty.reload} /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {faculty.data.map((f) => (
              <Link key={f._id} to={`/faculty/${f._id}`} className="card card-hover p-5 text-center">
                <FacultyAvatar faculty={f} className="mx-auto h-20 w-20 text-xl" />
                <h3 className="mt-3 font-semibold text-navy-900 dark:text-white">{f.name}</h3>
                <p className="text-sm text-accent-600">{f.designation}</p>
                <p className="mt-1 text-xs text-slate-500">{f.specialization}</p>
                {f.isDemo && <div className="mt-2"><SampleBadge /></div>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container-x mt-16">
        <SectionHeader eyebrow="Showcase" title="Student projects & achievements" action={<Link to="/student-corner" className="btn-ghost">Student corner <ArrowRight size={16} /></Link>} />
        {projects.loading ? <CardSkeletons count={3} /> : projects.error ? <ErrorState error={projects.error} onRetry={projects.reload} /> : (
          <div className="grid gap-6 md:grid-cols-3">
            {projects.data.map((p) => (
              <div key={p._id} className="card p-5">
                <div className="flex items-center gap-2"><Trophy size={18} className="text-accent" /><Badge tone={p.type === 'achievement' ? 'orange' : 'blue'}>{p.type}</Badge>{p.isDemo && <SampleBadge />}</div>
                <h3 className="mt-3 font-semibold text-navy-900 dark:text-white">{p.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{p.summary}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="container-x mt-16">
        <div className="card grid gap-6 bg-gradient-to-br from-navy-900 to-navy-700 p-8 text-white md:grid-cols-3 dark:from-navy-900 dark:to-navy-800">
          <div className="md:col-span-1"><h2 className="h-display text-2xl font-bold">Get in touch</h2><p className="mt-2 text-sky-100">Questions about the department? Send us a message.</p><Link to="/contact" className="btn-accent mt-4">Contact the department</Link></div>
          <ul className="space-y-3 text-sm md:col-span-2">
            <li className="flex gap-3"><MapPin className="shrink-0 text-accent" size={18} />{DEPARTMENT.address}</li>
            <li className="flex gap-3"><Phone className="shrink-0 text-accent" size={18} />{DEPARTMENT.phone}</li>
            <li className="flex gap-3"><Mail className="shrink-0 text-accent" size={18} />{DEPARTMENT.email}</li>
          </ul>
        </div>
      </section>
    </>
  );
}
