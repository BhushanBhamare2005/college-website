import { Eye, Target, CheckCircle2, FlaskConical, Library, Wifi, Users } from 'lucide-react';
import { PageHero, SectionHeader, Accordion } from '../components/ui';
import { DEPARTMENT } from '../data/demo';

const OBJECTIVES = [
  'Provide department information digitally through a centralised platform.',
  'Give easy access to faculty, course and laboratory information.',
  'Display department notices, announcements, events and achievements.',
  'Reduce manual information sharing and save time.',
  'Maintain departmental information in an organised manner.',
];
const FACILITIES = [
  { icon: FlaskConical, t: 'Laboratories', d: 'Electronics, computer and embedded labs (see Academics for the sample list).' },
  { icon: Library, t: 'Learning resources', d: 'Syllabus, manuals and question papers shared via Student Corner.' },
  { icon: Wifi, t: 'Digital access', d: 'Notices and events available online at any time.' },
  { icon: Users, t: 'Mentoring', d: 'Faculty guidance for projects, labs and academic progress.' },
];

export default function About() {
  return (
    <>
      <PageHero title="About the Department" subtitle={`${DEPARTMENT.name} · ${DEPARTMENT.college}, ${DEPARTMENT.location}`} />
      <div className="container-x space-y-14 py-12">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Overview" title="Who we are" />
            <p className="text-slate-600 dark:text-slate-300">The Department of Electronics and Computer Engineering at {DEPARTMENT.college}, Nashik is part of {DEPARTMENT.society}. A college department holds academic and administrative information that students, faculty, parents and visitors need to reach easily — this website brings it together in one place.</p>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">Note: the department's official profile text, history and achievements were not part of the project report. Add verified content through the admin dashboard or by editing this page.</p>
          </div>
          <img src="/images/college-photo.jpg" alt="Matoshri College campus" className="w-full rounded-2xl shadow-lg" loading="lazy" />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6"><Eye className="text-accent" /><h3 className="h-display mt-3 text-xl font-bold text-navy-900 dark:text-white">Vision</h3><p className="mt-2 text-slate-600 dark:text-slate-300">[Placeholder — insert the department's official vision statement.]</p></div>
          <div className="card p-6"><Target className="text-accent" /><h3 className="h-display mt-3 text-xl font-bold text-navy-900 dark:text-white">Mission</h3><p className="mt-2 text-slate-600 dark:text-slate-300">[Placeholder — insert the department's official mission statement.]</p></div>
        </section>

        <section>
          <SectionHeader eyebrow="Objectives" title="What this website aims to do" subtitle="Objectives taken from the project report." />
          <ul className="grid gap-3 md:grid-cols-2">{OBJECTIVES.map((o) => <li key={o} className="card flex gap-3 p-4"><CheckCircle2 className="shrink-0 text-emerald-500" size={20} />{o}</li>)}</ul>
        </section>

        <section>
          <SectionHeader eyebrow="Facilities" title="Academic facilities" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{FACILITIES.map((f) => <div key={f.t} className="card p-5"><f.icon className="text-navy-700 dark:text-accent" /><h3 className="mt-3 font-semibold text-navy-900 dark:text-white">{f.t}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{f.d}</p></div>)}</div>
        </section>

        <section>
          <SectionHeader eyebrow="FAQ" title="Frequently asked" />
          <Accordion items={[
            { title: 'Who developed this website?', body: 'T.Y. B.Tech. students Sagar Hukumdar, Sohan Kharate, Yash Khanderay, Arvind Chavan and Achal Kalamkar under the guidance of Ms. Harshali Ahire (Academic Year 2026–2027).' },
            { title: 'Who is the Head of Department?', body: 'Dr J.J Chopda, as named in the project report.' },
            { title: 'How is information kept up to date?', body: 'Authorised faculty and administrators sign in to the dashboard to add or update faculty, notices, events and other records.' },
          ]} />
        </section>
      </div>
    </>
  );
}
