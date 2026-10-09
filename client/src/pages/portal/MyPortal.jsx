import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Megaphone, Send, Ticket } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { Badge, EmptyState, ErrorState, Field, PageHero, SampleBadge, Skeleton, Spinner } from '../../components/ui';
import { fmtDate } from '../../utils/format';

function SubmitProject({ onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ type: 'project', title: '', team: '', summary: '', link: '' });
  const [er, setEr] = useState({});
  const [busy, setBusy] = useState(false);
  const [documentUrl, setDocumentUrl] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (f.title.trim().length < 3) x.title = 'Title must be at least 3 characters.';
    if (!f.team.trim()) x.team = 'Please list the student(s).';
    if (f.summary.trim().length < 10) x.summary = 'Summary must be at least 10 characters.';
    setEr(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    try { await api.create('projects', { ...f, documentUrl, title: f.title.trim(), team: f.team.trim(), summary: f.summary.trim() }); toast.success('Submitted for approval.'); setF({ type: 'project', title: '', team: '', summary: '', link: '' }); setDocumentUrl(''); onDone(); }
    catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-5">
      <h2 className="font-semibold text-navy-900 dark:text-white">Submit a project or achievement</h2>
      <Field label="Type" htmlFor="st"><select id="st" className="input" value={f.type} onChange={(e) => { const v = e.target.value; setF((p0) => ({ ...p0, type: v })); }}><option value="project">Project</option><option value="achievement">Achievement</option></select></Field>
      <Field label="Title" htmlFor="sti" error={er.title}><input id="sti" className={`input ${er.title ? 'input-error' : ''}`} value={f.title} onChange={(e) => { const v = e.target.value; setF((p0) => ({ ...p0, title: v })); }} /></Field>
      <Field label="Student(s) / team" htmlFor="stm" error={er.team}><input id="stm" className={`input ${er.team ? 'input-error' : ''}`} value={f.team} onChange={(e) => { const v = e.target.value; setF((p0) => ({ ...p0, team: v })); }} /></Field>
      <Field label="Summary" htmlFor="sts" error={er.summary}><textarea id="sts" rows={4} className={`input ${er.summary ? 'input-error' : ''}`} value={f.summary} onChange={(e) => { const v = e.target.value; setF((p0) => ({ ...p0, summary: v })); }} /></Field>
      <Field label="Link (optional)" htmlFor="stl"><input id="stl" className="input" value={f.link} onChange={(e) => { const v = e.target.value; setF((p0) => ({ ...p0, link: v })); }} /></Field>
      <Field label="Project document (PDF)" htmlFor="std"><input id="std" type="file" accept="application/pdf" className="input" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        try { const result = await api.upload('project-doc', file); setDocumentUrl(result.data.url); toast.success('Document uploaded.'); }
        catch (error) { toast.error(error.message); }
        finally { setBusy(false); }
      }} />{documentUrl && <a className="mt-1 inline-block text-xs underline" href={documentUrl} target="_blank" rel="noreferrer noopener">Uploaded document</a>}</Field>
      <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : <Send size={16} />} Submit for review</button>
    </form>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword.length < 10) return toast.error('New password must be at least 10 characters.');
    if (form.newPassword !== form.confirmPassword) return toast.error('New passwords do not match.');
    setBusy(true);
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed.');
    } catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  };
  return (
    <form className="card space-y-4 p-5" onSubmit={submit}>
      <h2 className="font-semibold text-navy-900 dark:text-white">Change password</h2>
      <Field label="Current password" htmlFor="current-password"><input id="current-password" autoComplete="current-password" type="password" required className="input" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} /></Field>
      <Field label="New password (10+ characters)" htmlFor="new-password"><input id="new-password" autoComplete="new-password" type="password" minLength={10} required className="input" value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} /></Field>
      <Field label="Confirm new password" htmlFor="confirm-password"><input id="confirm-password" autoComplete="new-password" type="password" minLength={10} required className="input" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} /></Field>
      <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Update password'}</button>
    </form>
  );
}

export default function MyPortal() {
  const { user } = useAuth();
  const notices = useFetch(() => api.list('notices', { limit: 3 }), []);
  const resources = useFetch(() => api.list('resources', { limit: 5 }), []);
  const events = useFetch(() => api.list('events', { upcoming: 'true', sort: 'dateAsc', limit: 3 }), []);
  const mine = useFetch(() => api.list('projects', { limit: 20 }), []);

  return (
    <>
      <PageHero title={`Welcome, ${user.name}`} subtitle={`Signed in as ${user.role}.`} crumb="My Portal" />
      <div className="container-x grid gap-6 py-10 lg:grid-cols-2">
        <div className="space-y-6">
          <SubmitProject onDone={mine.reload} />
          <ChangePassword />
          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-navy-900 dark:text-white">Submission status</h2>
            {mine.loading ? <Skeleton className="h-16" /> : mine.error ? <ErrorState error={mine.error} onRetry={mine.reload} /> : !mine.data.length ? <EmptyState title="No submissions" text="Your submissions will appear here." /> : (
              <ul className="space-y-2">{mine.data.map((p) => <li key={p._id} className="flex items-center justify-between gap-3 text-sm"><span>{p.title}</span><Badge tone={{ approved: 'green', pending: 'orange', rejected: 'red' }[p.status] || 'gray'}>{p.status}</Badge></li>)}</ul>
            )}
            {user.role !== 'student' && <p className="mt-3 text-xs text-slate-500">Showing all submissions you are allowed to see. Faculty can approve them from the dashboard.</p>}
          </section>
        </div>
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-navy-900 dark:text-white"><Megaphone size={18} className="text-accent" />Announcements</h2>
            {notices.loading ? <Skeleton className="h-16" /> : notices.error ? <ErrorState error={notices.error} onRetry={notices.reload} /> : <ul className="space-y-3">{notices.data.map((n) => <li key={n._id}><p className="font-medium">{n.title} {n.isDemo && <SampleBadge />}</p><p className="text-xs text-slate-500">{fmtDate(n.date)}</p></li>)}</ul>}
          </section>
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-navy-900 dark:text-white"><Ticket size={18} className="text-accent" />Upcoming events</h2>
            {events.loading ? <Skeleton className="h-16" /> : events.error ? <ErrorState error={events.error} onRetry={events.reload} /> : !events.data.length ? <p className="text-sm text-slate-500">No upcoming events.</p> : <ul className="space-y-3">{events.data.map((e) => <li key={e._id} className="flex items-center justify-between gap-3"><span><span className="font-medium">{e.title}</span><span className="block text-xs text-slate-500">{fmtDate(e.date)}</span></span><Link to="/events" className="btn-outline !px-3 !py-1.5">Register</Link></li>)}</ul>}
          </section>
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-navy-900 dark:text-white"><Download size={18} className="text-accent" />Academic resources</h2>
            {resources.loading ? <Skeleton className="h-16" /> : resources.error ? <ErrorState error={resources.error} onRetry={resources.reload} /> : <ul className="space-y-2 text-sm">{resources.data.map((r) => <li key={r._id} className="flex items-center justify-between gap-2"><span>{r.title}</span>{r.url ? <a className="underline" href={r.url} target="_blank" rel="noreferrer noopener">Open</a> : <span className="text-xs text-slate-400">no file</span>}</li>)}</ul>}
          </section>
        </div>
      </div>
    </>
  );
}
