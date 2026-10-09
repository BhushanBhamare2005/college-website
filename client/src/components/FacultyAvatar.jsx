import { useState } from 'react';
import { initials } from '../utils/format';

export default function FacultyAvatar({ faculty, className }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-navy-700 to-navy-900 font-bold text-white ${className}`}>
      {faculty.photoUrl && !failed
        ? <img src={faculty.photoUrl} alt={faculty.name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : initials(faculty.name)}
    </div>
  );
}