import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="h-display text-7xl font-extrabold text-accent">404</p>
        <h1 className="mt-2 text-2xl font-bold text-navy-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    </div>
  );
}
