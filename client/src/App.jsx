import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import { Spinner } from './components/ui';
import Home from './pages/Home';
import About from './pages/About';
import Faculty from './pages/Faculty';
import FacultyDetail from './pages/FacultyDetail';
import Academics from './pages/Academics';
import Notices from './pages/Notices';
import Events from './pages/Events';
import StudentCorner from './pages/StudentCorner';
import Contact from './pages/Contact';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Manage = lazy(() => import('./pages/admin/Manage'));
const MyPortal = lazy(() => import('./pages/portal/MyPortal'));

function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Spinner size={28} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

const Fallback = <div className="grid min-h-[50vh] place-items-center"><Spinner size={28} /></div>;

export default function App() {
  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/faculty/:id" element={<FacultyDetail />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/events" element={<Events />} />
          <Route path="/student-corner" element={<StudentCorner />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/portal" element={<Guard roles={['student', 'faculty', 'admin']}><MyPortal /></Guard>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<Guard roles={['admin', 'faculty']}><AdminLayout /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path=":module" element={<Manage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
