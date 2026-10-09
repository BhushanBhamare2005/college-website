import { fmtDate } from '../../utils/format';

const req = (label) => (v) => (String(v ?? '').trim() ? null : `${label} is required.`);
const min = (label, n) => (v) => (String(v ?? '').trim().length >= n ? null : `${label} must be at least ${n} characters.`);
const email = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()) ? null : 'Enter a valid email address.');

const dateCol = { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) };

// roles: who may see the module. create/edit/del: roles allowed to do each action in the UI (the backend enforces the same rules).
export const MODULES = {
  faculty: {
    title: 'Faculty', resource: 'faculty', search: 'Search faculty…', roles: ['admin'], create: ['admin'], edit: ['admin'], del: ['admin'],
    columns: [{ key: 'name', label: 'Name' }, { key: 'designation', label: 'Designation' }, { key: 'specialization', label: 'Specialization' }, { key: 'email', label: 'Email' }],
    fields: [
      { key: 'name', label: 'Full name', validate: min('Name', 2) },
      { key: 'designation', label: 'Designation', type: 'select', options: ['Head of Department', 'Project Guide', 'Associate Professor', 'Assistant Professor', 'Lecturer'], validate: req('Designation') },
      { key: 'qualification', label: 'Qualification', validate: req('Qualification') },
      { key: 'specialization', label: 'Specialization', validate: req('Specialization') },
      { key: 'email', label: 'Email', type: 'email', validate: email },
      { key: 'experience', label: 'Experience' },
      { key: 'bio', label: 'Short bio', type: 'textarea' },
      { key: 'photoUrl', label: 'Profile photo', type: 'file', uploadKind: 'faculty-photo', accept: 'image/jpeg,image/png,image/webp' },
    ],
  },
  courses: {
    title: 'Courses', resource: 'courses', search: 'Search courses…', roles: ['admin'], create: ['admin'], edit: ['admin'], del: ['admin'],
    columns: [{ key: 'name', label: 'Course' }, { key: 'duration', label: 'Duration' }, { key: 'level', label: 'Level' }],
    fields: [
      { key: 'name', label: 'Course name', validate: min('Course name', 3) },
      { key: 'duration', label: 'Duration', validate: req('Duration') },
      { key: 'level', label: 'Level', type: 'select', options: ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate'], validate: req('Level') },
      { key: 'description', label: 'Description', type: 'textarea', validate: min('Description', 10) },
      { key: 'subjects', label: 'Subjects (comma separated)', type: 'list' },
    ],
  },
  labs: {
    title: 'Laboratories', resource: 'labs', search: 'Search labs…', roles: ['admin'], create: ['admin'], edit: ['admin'], del: ['admin'],
    columns: [{ key: 'name', label: 'Laboratory' }, { key: 'incharge', label: 'In-charge' }],
    fields: [
      { key: 'name', label: 'Laboratory name', validate: min('Name', 3) },
      { key: 'description', label: 'Description', type: 'textarea', validate: min('Description', 10) },
      { key: 'equipment', label: 'Equipment (comma separated)', type: 'list' },
      { key: 'incharge', label: 'Lab in-charge' },
    ],
  },
  notices: {
    title: 'Notices', resource: 'notices', search: 'Search notices…', roles: ['admin', 'faculty'], create: ['admin', 'faculty'], edit: ['admin', 'faculty'], del: ['admin', 'faculty'], approval: true,
    filter: { key: 'category', label: 'Category', options: ['General', 'Academic', 'Examination', 'Event', 'Placement'] },
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'pinned', label: 'Pinned', render: (r) => (r.pinned ? 'Yes' : 'No') }, { key: 'status', label: 'Status', badge: true }, dateCol],
    fields: [
      { key: 'title', label: 'Title', validate: min('Title', 3) },
      { key: 'category', label: 'Category', type: 'select', options: ['General', 'Academic', 'Examination', 'Event', 'Placement'], validate: req('Category') },
      { key: 'description', label: 'Description', type: 'textarea', validate: min('Description', 10) },
      { key: 'date', label: 'Date', type: 'date', validate: req('Date') },
      { key: 'pinned', label: 'Pin to top', type: 'checkbox' },
      { key: 'attachmentUpload', label: 'Notice attachment (PDF)', type: 'file', uploadKind: 'notice-attachment', uploadTarget: 'attachmentUrl', accept: 'application/pdf' },
    ],
  },
  events: {
    title: 'Events', resource: 'events', search: 'Search events…', roles: ['admin'], create: ['admin'], edit: ['admin'], del: ['admin'],
    filter: { key: 'type', label: 'Type', options: ['Workshop', 'Seminar', 'Technical Event', 'Program'] },
    columns: [{ key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }, dateCol, { key: 'venue', label: 'Venue' }],
    fields: [
      { key: 'title', label: 'Title', validate: min('Title', 3) },
      { key: 'type', label: 'Type', type: 'select', options: ['Workshop', 'Seminar', 'Technical Event', 'Program'], validate: req('Type') },
      { key: 'date', label: 'Event date', type: 'date', validate: req('Event date') },
      { key: 'deadline', label: 'Registration deadline', type: 'date', validate: req('Deadline') },
      { key: 'venue', label: 'Venue', validate: req('Venue') },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea', validate: min('Description', 10) },
      { key: 'bannerUrl', label: 'Event banner', type: 'file', uploadKind: 'event-banner', accept: 'image/jpeg,image/png,image/webp' },
    ],
    crossValidate: (v) => (v.date && v.deadline && new Date(v.deadline) > new Date(v.date) ? { deadline: 'Deadline must be on or before the event date.' } : null),
  },
  registrations: {
    title: 'Event registrations', resource: 'registrations', search: 'Search registrations…', roles: ['admin'], create: [], edit: [], del: ['admin'],
    columns: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'eventTitle', label: 'Event' }, { key: 'createdAt', label: 'Registered', render: (r) => fmtDate(r.createdAt) }],
    fields: [],
  },
  projects: {
    title: 'Projects & achievements', resource: 'projects', search: 'Search submissions…', roles: ['admin', 'faculty'], create: ['admin', 'faculty'], edit: ['admin', 'faculty'], del: ['admin'],
    filter: { key: 'status', label: 'Status', options: ['pending', 'approved', 'rejected'] },
    approval: true,
    columns: [{ key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }, { key: 'team', label: 'By' }, { key: 'status', label: 'Status', badge: true }],
    fields: [
      { key: 'title', label: 'Title', validate: min('Title', 3) },
      { key: 'type', label: 'Type', type: 'select', options: ['project', 'achievement'], validate: req('Type') },
      { key: 'team', label: 'Student(s) / team', validate: req('Team') },
      { key: 'summary', label: 'Summary', type: 'textarea', validate: min('Summary', 10) },
      { key: 'link', label: 'Link (optional)' },
      { key: 'projectUpload', label: 'Project document (PDF)', type: 'file', uploadKind: 'project-doc', uploadTarget: 'documentUrl', accept: 'application/pdf' },
    ],
  },
  resources: {
    title: 'Academic resources', resource: 'resources', search: 'Search resources…', roles: ['admin', 'faculty'], create: ['admin', 'faculty'], edit: ['admin', 'faculty'], del: ['admin', 'faculty'], approval: true,
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'url', label: 'Link', render: (r) => (r.url ? 'Yes' : '—') }, { key: 'status', label: 'Status', badge: true }],
    fields: [
      { key: 'title', label: 'Title', validate: min('Title', 3) },
      { key: 'category', label: 'Category', type: 'select', options: ['Syllabus', 'Question Papers', 'Lab Manual', 'Notes', 'Other'], validate: req('Category') },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'url', label: 'File / link URL' },
      { key: 'resourceUpload', label: 'Upload resource PDF', type: 'file', uploadKind: 'resource', uploadTarget: 'url', accept: 'application/pdf' },
    ],
  },
  messages: {
    title: 'Contact messages', resource: 'messages', search: 'Search messages…', roles: ['admin'], create: [], edit: [], del: ['admin'], markRead: true,
    columns: [{ key: 'name', label: 'From' }, { key: 'email', label: 'Email' }, { key: 'subject', label: 'Subject' }, { key: 'read', label: 'Status', render: (r) => (r.read ? 'Read' : 'Unread') }, { key: 'createdAt', label: 'Received', render: (r) => fmtDate(r.createdAt) }],
    fields: [],
  },
  users: {
    title: 'Users & roles', resource: 'users', search: 'Search users…', roles: ['admin'], create: ['admin'], edit: ['admin'], del: ['admin'],
    approval: true,
    filter: { key: 'role', label: 'Role', options: ['admin', 'faculty', 'student'] },
    columns: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role', badge: true }, { key: 'accountStatus', label: 'Access', badge: true }],
    fields: [
      { key: 'name', label: 'Full name', validate: min('Name', 2) },
      { key: 'email', label: 'Email', type: 'email', validate: email },
      { key: 'role', label: 'Role', type: 'select', options: ['student', 'faculty', 'admin'], validate: req('Role') },
      { key: 'password', label: 'Initial password (12+ characters)', type: 'password', createOnly: true, validate: min('Password', 12) },
    ],
  },
};
