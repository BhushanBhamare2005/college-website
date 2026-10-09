import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, ClipboardCheck, FileText, FlaskConical, GraduationCap, LayoutDashboard, LogOut, Mail, Megaphone, Menu, Moon, Sun, Ticket, Users, UserCog, X, Globe, FlaskRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { USE_MOCK } from '../services/api';

const ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, roles: ['admin', 'faculty'] },
  { to: '/admin/faculty', label: 'Faculty', icon: Users, roles: ['admin'] },
  { to: '/admin/courses', label: 'Courses', icon: GraduationCap, roles: ['admin'] },
  { to: '/admin/labs', label: 'Laboratories', icon: FlaskRound, roles: ['admin'] },
  { to: '/admin/notices', label: 'Notices', icon: Megaphone, roles: ['admin', 'faculty'] },
  { to: '/admin/events', label: 'Events', icon: CalendarDays, roles: ['admin'] },
  { to: '/admin/registrations', label: 'Registrations', icon: Ticket, roles: ['admin'] },
  { to: '/admin/projects', label: 'Projects & Achievements', icon: ClipboardCheck, roles: ['admin', 'faculty'] },
  { to: '/admin/resources', label: 'Resources', icon: BookOpen, roles: ['admin', 'faculty'] },
  { to: '/admin/messages', label: 'Messages', icon: Mail, roles: ['admin'] },
  { to: '/admin/users', label: 'Users & Roles', icon: UserCog, roles: ['admin'] },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const toast = useToast();
  const nav = useNavigate();
  const items = ITEMS.filter((i) => i.roles.includes(user.role));

  const doLogout = async () => { await logout(); toast.success('Signed out.'); nav('/'); };
  const cls = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-sky-100/80 hover:bg-white/10 hover:text-white'}`;

  const Sidebar = (
    <div className="flex h-full flex-col bg-navy-900 p-4">
      <Link to="/" className="mb-6 flex items-center gap-3">
        <img src="/images/college-logo.png" alt="" className="h-10 w-10 rounded-full bg-white object-contain p-0.5" />
        <span className="h-display text-sm font-bold leading-tight text-white">Admin Panel<span className="block text-xs font-normal text-sky-200">ECE Department</span></span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Admin">
        {items.map((i) => <NavLink key={i.to} to={i.to} end={i.end} className={cls} onClick={() => setOpen(false)}><i.icon size={18} />{i.label}</NavLink>)}
      </nav>
      <Link to="/" className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sky-100/80 hover:bg-white/10"><Globe size={18} /> View public site</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{Sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{Sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-navy-950/90">
          <button className="btn-ghost !p-2.5 lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
          <p className="hidden text-sm text-slate-500 lg:block dark:text-slate-400">Signed in as <strong className="text-navy-900 dark:text-white">{user.name}</strong> · <span className="capitalize">{user.role}</span>{USE_MOCK && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">DEMO DATA</span>}</p>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost !p-2.5" aria-label="Toggle dark mode">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={doLogout} className="btn-outline"><LogOut size={16} /> Sign out</button>
          </div>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
