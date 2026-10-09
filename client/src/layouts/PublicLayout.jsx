import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, FlaskConical, LogIn, LogOut, Mail, MapPin, Menu, Moon, Phone, Sun, X, LayoutDashboard, UserCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { USE_MOCK } from '../services/api';
import { DEPARTMENT } from '../data/demo';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/faculty', label: 'Faculty' },
  { to: '/academics', label: 'Academics' },
  { to: '/notices', label: 'Notices' },
  { to: '/events', label: 'Events' },
  { to: '/student-corner', label: 'Student Corner' },
  { to: '/contact', label: 'Contact' },
];

export function BrandLogo({ light }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Matoshri COER – Home">
      <img src="/images/college-logo.png" alt="Matoshri College of Engineering and Research Centre logo" className="h-11 w-11 rounded-full bg-white object-contain p-0.5 shadow" />
      <span className="leading-tight">
        <span className={`block text-[11px] font-medium uppercase tracking-wider ${light ? 'text-sky-200' : 'text-slate-500 dark:text-slate-400'}`}>Matoshri COER, Nashik</span>
        <span className={`h-display block text-sm font-bold sm:text-base ${light ? 'text-white' : 'text-navy-900 dark:text-white'}`}>Electronics &amp; Computer Engg.</span>
      </span>
    </Link>
  );
}

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const { pathname } = useLocation();
  const { dark, toggle } = useTheme();
  const { user, logout, sessionExpired, clearExpired } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (sessionExpired) { toast.error('Your session has expired. Please sign in again.'); clearExpired(); nav('/login'); }
  }, [sessionExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  const doLogout = async () => { await logout(); toast.success('Signed out.'); nav('/'); };
  const linkCls = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-sky-100 text-navy-900 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-950">Skip to content</a>
      {USE_MOCK && (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
          <FlaskConical size={13} className="mr-1 inline" /> DEMO MODE — sample data held in your browser; nothing is saved. Connect the backend and set VITE_USE_MOCK=false for real data.
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-navy-950/90">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <BrandLogo />
          <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost !p-2.5" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                {['admin', 'faculty'].includes(user.role) && <Link to="/admin" className="btn-primary"><LayoutDashboard size={16} /> Dashboard</Link>}
                <Link to="/portal" className="btn-outline"><UserCircle size={16} /> My Portal</Link>
                <button onClick={doLogout} className="btn-ghost !p-2.5" aria-label="Sign out"><LogOut size={18} /></button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary hidden sm:inline-flex"><LogIn size={16} /> Login</Link>
            )}
            <button className="btn-ghost !p-2.5 xl:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-slate-200 bg-white p-4 xl:hidden dark:border-white/10 dark:bg-navy-950" aria-label="Mobile">
            <div className="grid gap-1">
              {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>)}
              {user ? (
                <>
                  {['admin', 'faculty'].includes(user.role) && <NavLink to="/admin" className={linkCls}>Dashboard</NavLink>}
                  <NavLink to="/portal" className={linkCls}>My Portal</NavLink>
                  <button onClick={doLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600">Sign out</button>
                </>
              ) : <NavLink to="/login" className={linkCls}>Login</NavLink>}
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1"><Outlet /></main>

      <footer className="mt-16 bg-navy-950 text-sky-100">
        <div className="container-x grid gap-10 py-12 md:grid-cols-3">
          <div>
            <BrandLogo light />
            <p className="mt-4 text-sm text-sky-200/80">{DEPARTMENT.society} {DEPARTMENT.college}, {DEPARTMENT.location}.</p>
            <p className="mt-2 text-sm italic text-accent">{DEPARTMENT.motto}</p>
          </div>
          <div>
            <h3 className="h-display mb-3 font-semibold text-white">Quick links</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {LINKS.map((l) => <li key={l.to}><Link className="hover:text-accent" to={l.to}>{l.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="h-display mb-3 font-semibold text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-accent" />{DEPARTMENT.address}</li>
              <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-accent" />{DEPARTMENT.phone}</li>
              <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-accent" />{DEPARTMENT.email}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-sky-200/70">
          © 2026–2027 Dept. of Electronics and Computer Engineering · Academic project by Sagar Hukumdar, Sohan Kharate, Yash Khanderay, Arvind Chavan, Achal Kalamkar · Guide: Ms. Harshali Ahire
        </div>
      </footer>

      {showTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="fixed bottom-5 right-5 z-40 rounded-full bg-accent p-3 text-navy-950 shadow-lg transition hover:scale-105">
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
