// DEMO / PLACEHOLDER DATA — used only when VITE_USE_MOCK=true.
// Items with isDemo: true are NOT official college information.
// Verified from the project report: Dr J.J Chopda (Head of Department), Ms. Harshali Ahire (project guide).

const d = (offset) => {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  return t.toISOString();
};

export const DEPARTMENT = {
  name: 'Electronics and Computer Engineering',
  college: 'Matoshri College of Engineering and Research Centre',
  society: "Matoshri Education Society's",
  location: 'Eklahare, Nashik',
  motto: 'Knowledge · Perspective · Understanding',
  email: 'info@matoshri.edu.in',
  phone: '+91 0253 2406600',
  address: 'Eklahareshivar, Near Odhagaon, Opp Nashik-Ch. Sambhaji Nagar (Aurangabad) Highway, Nashik, Maharashtra 422105',
};

export const seed = {
  faculty: [
    { _id: 'f1', name: 'Dr J.J Chopda', designation: 'Head of Department', qualification: 'Ph.D. (verify)', specialization: 'Electronics & Computer Engineering', email: 'hod@example.edu', experience: 'To be updated', bio: 'Head of the Department of Electronics and Computer Engineering (name and role from the project report). Other details are placeholders.', isDemo: false },
    { _id: 'f2', name: 'Ms. Harshali Ahire', designation: 'Project Guide', qualification: 'M.E. (verify)', specialization: 'Software Project Management', email: 'guide@example.edu', experience: 'To be updated', bio: 'Project guide for the College Department Website project (from the report). Other details are placeholders.', isDemo: false },
    { _id: 'f3', name: 'Demo Faculty A', designation: 'Associate Professor', qualification: 'M.Tech., Ph.D.', specialization: 'Embedded Systems', email: 'faculty.a@example.edu', experience: '12 years', bio: 'Sample profile for demonstration.', isDemo: true },
    { _id: 'f4', name: 'Demo Faculty B', designation: 'Assistant Professor', qualification: 'M.E.', specialization: 'VLSI & Digital Design', email: 'faculty.b@example.edu', experience: '8 years', bio: 'Sample profile for demonstration.', isDemo: true },
    { _id: 'f5', name: 'Demo Faculty C', designation: 'Assistant Professor', qualification: 'M.Tech.', specialization: 'Data Structures & Algorithms', email: 'faculty.c@example.edu', experience: '6 years', bio: 'Sample profile for demonstration.', isDemo: true },
    { _id: 'f6', name: 'Demo Faculty D', designation: 'Lecturer', qualification: 'M.E.', specialization: 'Computer Networks', email: 'faculty.d@example.edu', experience: '3 years', bio: 'Sample profile for demonstration.', isDemo: true },
  ],
  courses: [
    { _id: 'c1', name: 'B.Tech. Electronics and Computer Engineering', duration: '4 Years (verify)', level: 'Undergraduate', description: 'Undergraduate programme of the department. Duration and curriculum details are placeholders.', subjects: ['Digital Electronics', 'Microprocessors & Microcontrollers', 'Data Structures', 'Computer Networks', 'Software Project Management', 'Database Management Systems'], isDemo: true },
    { _id: 'c2', name: 'Software Project Management (Lab course)', duration: '1 Semester', level: 'Undergraduate', description: 'Lab course in which the department website project was developed (mentioned in the report).', subjects: ['Project planning', 'UML modelling', 'Testing & reporting'], isDemo: false },
  ],
  labs: [
    { _id: 'l1', name: 'Electronics Lab (sample)', description: 'Sample entry. Replace with the department\'s actual laboratory description.', equipment: ['Oscilloscopes', 'Function generators', 'Trainer kits'], incharge: 'To be updated', isDemo: true },
    { _id: 'l2', name: 'Computer Lab (sample)', description: 'Sample entry for programming and software project work.', equipment: ['Desktop systems', 'VS Code', 'Node.js / MongoDB tools'], incharge: 'To be updated', isDemo: true },
    { _id: 'l3', name: 'Microprocessor & Embedded Lab (sample)', description: 'Sample entry for microcontroller practicals.', equipment: ['Development boards', 'Sensors', 'Logic analysers'], incharge: 'To be updated', isDemo: true },
  ],
  notices: [
    { _id: 'n1', title: 'Welcome to Academic Year 2026–2027', category: 'General', description: 'Sample notice: orientation and timetable details will be posted here by the department.', pinned: true, date: d(-2), status: 'published', isDemo: true },
    { _id: 'n2', title: 'Software Project Management Lab – Report Submission', category: 'Academic', description: 'Sample notice: T.Y. students submit the lab report as per the guide\'s instructions.', pinned: false, date: d(-5), status: 'published', isDemo: true },
    { _id: 'n3', title: 'Internal Assessment Schedule', category: 'Examination', description: 'Sample notice: internal assessment dates will be announced here.', pinned: false, date: d(-9), status: 'published', isDemo: true },
    { _id: 'n4', title: 'Workshop Registration Open', category: 'Event', description: 'Sample notice: register for the upcoming technical workshop from the Events page.', pinned: false, date: d(-12), status: 'published', isDemo: true },
    { _id: 'n5', title: 'Library Book Return Reminder', category: 'General', description: 'Sample notice for demonstration purposes.', pinned: false, date: d(-20), status: 'published', isDemo: true },
    { _id: 'n6', title: 'Placement Training Session', category: 'Placement', description: 'Sample notice for demonstration purposes.', pinned: false, date: d(-30), status: 'published', isDemo: true },
  ],
  events: [
    { _id: 'e1', title: 'Technical Workshop (sample)', type: 'Workshop', date: d(14), deadline: d(10), venue: 'Seminar Hall (placeholder)', description: 'Sample workshop entry to demonstrate registration.', capacity: 60, isDemo: true },
    { _id: 'e2', title: 'Expert Seminar (sample)', type: 'Seminar', date: d(25), deadline: d(21), venue: 'Seminar Hall (placeholder)', description: 'Sample seminar entry.', capacity: 100, isDemo: true },
    { _id: 'e3', title: 'Project Exhibition (sample)', type: 'Technical Event', date: d(40), deadline: d(35), venue: 'Department Labs (placeholder)', description: 'Sample project exhibition entry.', capacity: 150, isDemo: true },
    { _id: 'e4', title: 'Induction Programme (sample)', type: 'Program', date: d(-20), deadline: d(-25), venue: 'Auditorium (placeholder)', description: 'Past sample event.', capacity: 200, isDemo: true },
  ],
  projects: [
    { _id: 'p1', type: 'project', title: 'College Department Website', summary: 'Web-based system for department information, built by T.Y. Electronics and Computer Engineering students (Sagar Hukumdar, Sohan Kharate, Yash Khanderay, Arvind Chavan, Achal Kalamkar) under Ms. Harshali Ahire.', team: 'Project team (from report)', status: 'approved', link: '', isDemo: false, createdAt: d(-1) },
    { _id: 'p2', type: 'achievement', title: 'Sample achievement: Technical paper presentation', summary: 'Placeholder achievement entry. Replace with verified department achievements.', team: 'Demo students', status: 'approved', link: '', isDemo: true, createdAt: d(-15) },
    { _id: 'p3', type: 'project', title: 'Sample project: Smart attendance prototype', summary: 'Placeholder student project entry.', team: 'Demo students', status: 'approved', link: '', isDemo: true, createdAt: d(-22) },
    { _id: 'p4', type: 'project', title: 'Sample pending submission', summary: 'Waiting for faculty / admin approval.', team: 'Demo student', status: 'pending', link: '', isDemo: true, createdAt: d(-1) },
  ],
  resources: [
    { _id: 'r1', title: 'Syllabus (sample link)', category: 'Syllabus', description: 'Placeholder resource; real files are uploaded by authorised users once the backend is running.', url: '', status: 'published', isDemo: true },
    { _id: 'r2', title: 'Previous question papers (sample)', category: 'Question Papers', description: 'Placeholder resource.', url: '', status: 'published', isDemo: true },
    { _id: 'r3', title: 'Lab manual (sample)', category: 'Lab Manual', description: 'Placeholder resource.', url: '', status: 'published', isDemo: true },
  ],
  registrations: [
    { _id: 'g1', event: 'e1', eventTitle: 'Technical Workshop (sample)', name: 'Demo Student', email: 'demo.student@example.edu', createdAt: d(-1) },
  ],
  messages: [
    { _id: 'm1', name: 'Demo Visitor', email: 'visitor@example.com', subject: 'Admission enquiry (sample)', message: 'Sample message to show the admin inbox.', read: false, createdAt: d(-1) },
  ],
  users: [
    { _id: 'u1', name: 'Demo Admin', email: 'admin@demo.local', role: 'admin', accountStatus: 'approved' },
    { _id: 'u2', name: 'Demo Faculty', email: 'faculty@demo.local', role: 'faculty', accountStatus: 'approved' },
    { _id: 'u3', name: 'Demo Student', email: 'student@demo.local', role: 'student', accountStatus: 'approved' },
  ],
};

// Demo-mode logins ONLY (never used against the real backend).
export const DEMO_ACCOUNTS = [
  { email: 'admin@demo.local', password: 'demo-admin', role: 'admin', name: 'Demo Admin' },
  { email: 'faculty@demo.local', password: 'demo-faculty', role: 'faculty', name: 'Demo Faculty' },
  { email: 'student@demo.local', password: 'demo-student', role: 'student', name: 'Demo Student' },
];
