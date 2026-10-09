import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Briefcase, GraduationCap, Mail } from 'lucide-react';
import FacultyAvatar from '../components/FacultyAvatar';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { ErrorState, PageHero, SampleBadge, Skeleton } from '../components/ui';

export default function FacultyDetail() {
  const { id } = useParams();
  const { data: f, loading, error, reload } = useFetch(() => api.get('faculty', id), [id]);
  return (
    <>
      <PageHero title={f?.name || 'Faculty profile'} crumb="Faculty" subtitle={f?.designation} />
      <div className="container-x py-10">
        <Link to="/faculty" className="btn-ghost mb-6"><ArrowLeft size={16} /> Back to directory</Link>
        {loading ? <Skeleton className="h-64 w-full" /> : error ? <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} /> : (
          <div className="card grid gap-8 p-8 md:grid-cols-[200px_1fr]">
            <FacultyAvatar faculty={f} className="h-40 w-40 text-5xl md:h-48 md:w-48" />
            <div>
              <div className="flex flex-wrap items-center gap-3"><h2 className="h-display text-2xl font-bold text-navy-900 dark:text-white">{f.name}</h2>{f.isDemo && <SampleBadge />}</div>
              <p className="text-accent-600">{f.designation}</p>
              <p className="mt-4 text-slate-600 dark:text-slate-300">{f.bio}</p>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3"><GraduationCap className="text-navy-700 dark:text-accent" /><div><dt className="text-xs uppercase text-slate-500">Qualification</dt><dd className="font-medium">{f.qualification}</dd></div></div>
                <div className="flex gap-3"><Award className="text-navy-700 dark:text-accent" /><div><dt className="text-xs uppercase text-slate-500">Specialization</dt><dd className="font-medium">{f.specialization}</dd></div></div>
                <div className="flex gap-3"><Briefcase className="text-navy-700 dark:text-accent" /><div><dt className="text-xs uppercase text-slate-500">Experience</dt><dd className="font-medium">{f.experience}</dd></div></div>
                <div className="flex gap-3"><Mail className="text-navy-700 dark:text-accent" /><div><dt className="text-xs uppercase text-slate-500">Email</dt><dd className="font-medium"><a className="underline" href={`mailto:${f.email}`}>{f.email}</a></dd></div></div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
