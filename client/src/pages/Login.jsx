import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, USE_MOCK } from '../services/api';
import { DEMO_ACCOUNTS } from '../data/demo';
import { Field, Spinner } from '../components/ui';
import { isEmail } from '../utils/format';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login');
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={loc.state?.from || (['admin', 'faculty'].includes(user.role) ? '/admin' : '/portal')} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!isEmail(form.email)) er.email = 'Enter a valid email address.';
    if (!form.password) er.password = 'Password is required.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome, ${u.name}!`);
      nav(loc.state?.from || (['admin', 'faculty'].includes(u.role) ? '/admin' : '/portal'), { replace: true });
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const register = async (e) => {
    e.preventDefault();
    const er = {};
    if (name.trim().length < 2) er.name = 'Enter your full name.';
    if (!isEmail(form.email)) er.email = 'Enter a valid email address.';
    if (form.password.length < 10) er.password = 'Password must be at least 10 characters.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await api.registerStudent({ name: name.trim(), email: form.email.trim(), password: form.password });
      toast.success('Account request sent. Sign in after an administrator approves it.');
      setMode('login');
      setForm({ email: form.email.trim(), password: '' });
      setName('');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <img src="/images/college-logo.png" alt="" className="mx-auto h-16 w-16" />
          <h1 className="h-display mt-3 text-center text-2xl font-bold text-navy-900 dark:text-white">{mode === 'login' ? 'Sign in' : 'Create student account'}</h1>
          <p className="mb-6 text-center text-sm text-slate-500">{mode === 'login' ? 'Students, faculty and administrators' : 'Student accounts require administrator approval.'}</p>
          <form onSubmit={mode === 'login' ? submit : register} noValidate className="space-y-4">
            {mode === 'signup' && <Field label="Full name" htmlFor="signup-name" error={errors.name}><input id="signup-name" autoComplete="name" className={`input ${errors.name ? 'input-error' : ''}`} value={name} onChange={(e) => setName(e.target.value)} /></Field>}
            <Field label="Email" htmlFor="le" error={errors.email}><input id="le" type="email" autoComplete="username" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, email: v })); }} /></Field>
            <Field label="Password" htmlFor="lp" error={errors.password}>
              <div className="relative">
                <input id="lp" type={show ? 'text' : 'password'} minLength={mode === 'signup' ? 10 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={`input pr-11 ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={(e) => { const v = e.target.value; setForm((p0) => ({ ...p0, password: v })); }} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </Field>
            <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : mode === 'login' ? <><LogIn size={16} /> Sign in</> : 'Request student account'}</button>
          </form>
          <button type="button" className="mt-4 w-full text-sm font-medium text-accent-700 underline" onClick={() => { setMode((current) => current === 'login' ? 'signup' : 'login'); setErrors({}); }}>{mode === 'login' ? 'Create a student account' : 'Back to sign in'}</button>
        </div>
        {USE_MOCK && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Demo accounts (demo mode only)</p>
            <ul className="mt-2 space-y-1">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.role} className="flex items-center justify-between gap-2"><span><strong className="capitalize">{a.role}</strong>: {a.email} / {a.password}</span>
                  <button type="button" className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold" onClick={() => setForm({ email: a.email, password: a.password })}>Fill</button></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
