import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Field, PageHero, Spinner } from '../components/ui';
import { isEmail } from '../utils/format';
import { DEPARTMENT } from '../data/demo';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => { const v = e.target.value; setForm((p0) => ({ ...p0, [k]: v })); setErrors((p0) => (p0[k] ? { ...p0, [k]: undefined } : p0)); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Please enter your name.';
    if (!isEmail(form.email)) er.email = 'Enter a valid email address.';
    if (form.subject.trim().length < 3) er.subject = 'Subject must be at least 3 characters.';
    if (form.message.trim().length < 10) er.message = 'Message must be at least 10 characters.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await api.sendContact({ name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim(), message: form.message.trim() });
      setSent(true); setForm(EMPTY); toast.success('Message sent. We will get back to you soon.');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHero title="Contact the Department" subtitle="Send us a message and the department will respond." crumb="Contact" />
      <div className="container-x grid gap-8 py-10 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {[{ i: MapPin, t: 'Address', v: DEPARTMENT.address }, { i: Phone, t: 'Phone', v: DEPARTMENT.phone }, { i: Mail, t: 'Email', v: DEPARTMENT.email }].map((c) => (
            <div key={c.t} className="card flex gap-4 p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-navy-800 dark:bg-white/10 dark:text-accent"><c.i size={20} /></span><div><p className="font-semibold text-navy-900 dark:text-white">{c.t}</p><p className="text-sm text-slate-600 dark:text-slate-300">{c.v}</p></div></div>
          ))}
        </div>
        <form onSubmit={submit} noValidate className="card space-y-4 p-6 lg:col-span-3">
          {sent && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">Thank you — your message has been received.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" htmlFor="cn" error={errors.name}><input id="cn" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} /></Field>
            <Field label="Email" htmlFor="ce" error={errors.email}><input id="ce" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={set('email')} /></Field>
          </div>
          <Field label="Subject" htmlFor="cs" error={errors.subject}><input id="cs" className={`input ${errors.subject ? 'input-error' : ''}`} value={form.subject} onChange={set('subject')} /></Field>
          <Field label="Message" htmlFor="cm" error={errors.message}><textarea id="cm" rows={6} className={`input ${errors.message ? 'input-error' : ''}`} value={form.message} onChange={set('message')} /></Field>
          <button className="btn-primary" disabled={busy}>{busy ? <Spinner /> : <Send size={16} />} Send message</button>
        </form>
      </div>
    </>
  );
}
