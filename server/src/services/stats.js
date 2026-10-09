import { execute } from '../config/db.js';
import { countRecords, mapRow } from '../models/index.js';

export async function dashboardStats() {
  const [faculty, courses, labs, notices, events, registrations, projects, messages] = await Promise.all([
    ...['faculty', 'courses', 'labs', 'notices', 'events', 'registrations', 'projects', 'messages'].map((key) => countRecords(key)),
  ]);
  const [pendingProjects, unreadMessages, eventResult, registrationResult, messageResult, pendingResult] = await Promise.all([
    countRecords('projects', { where: "status = 'pending'" }), countRecords('messages', { where: 'read = 0' }),
    execute('SELECT * FROM events ORDER BY date ASC LIMIT 10'), execute('SELECT * FROM registrations ORDER BY createdAt DESC LIMIT 3'),
    execute('SELECT * FROM messages ORDER BY createdAt DESC LIMIT 3'), execute("SELECT * FROM projects WHERE status = 'pending' ORDER BY createdAt DESC LIMIT 6"),
  ]);
  const eventRows = eventResult.rows.map((row) => mapRow('events', row));
  const registrationRows = registrationResult.rows.map((row) => mapRow('registrations', row));
  const recentMessages = messageResult.rows.map((row) => mapRow('messages', row));
  const pendingRows = pendingResult.rows.map((row) => mapRow('projects', row));
  const participationResult = await execute('SELECT e.title AS name, COUNT(r.id) AS registrations FROM events e LEFT JOIN registrations r ON r.event = e.id GROUP BY e.id ORDER BY e.date ASC LIMIT 10');
  const participation = participationResult.rows.map((row) => ({ name: row.name, registrations: Number(row.registrations) }));
  const [facultyCount, courseCount, labCount, noticeCount, eventCount, projectCount] = await Promise.all(['faculty', 'courses', 'labs', 'notices', 'events', 'projects'].map((key) => countRecords(key)));
  const typeResult = await execute('SELECT e.type AS name, COUNT(r.id) AS registrations FROM events e LEFT JOIN registrations r ON r.event = e.id GROUP BY e.type');
  const typeCounts = new Map(typeResult.rows.map((row) => [row.name, Number(row.registrations)]));
  const byType = ['Workshop', 'Seminar', 'Technical Event', 'Program'].map((name) => ({ name, registrations: typeCounts.get(name) || 0 }));
  const recent = [
    ...registrationRows.map((row) => ({ id: row._id, text: `${row.name} registered for ${row.eventTitle}`, at: row.createdAt })),
    ...recentMessages.map((row) => ({ id: row._id, text: `Message from ${row.name}: ${row.subject}`, at: row.createdAt })),
    ...pendingRows.map((row) => ({ id: row._id, text: `Pending approval: ${row.title}`, at: row.createdAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);
  return { totals: { faculty, courses, notices, events, registrations, pendingProjects, unreadMessages }, participation,
    content: [{ name: 'Faculty', count: facultyCount }, { name: 'Courses', count: courseCount }, { name: 'Labs', count: labCount }, { name: 'Notices', count: noticeCount }, { name: 'Events', count: eventCount }, { name: 'Projects', count: projectCount }], byType, recent };
}

export async function publicStats() {
  const keys = ['faculty', 'courses', 'labs', 'events', 'notices'];
  const counts = await Promise.all(keys.map((key) => countRecords(key, { where: key === 'notices' ? "status = 'published'" : '' })));
  return Object.fromEntries(keys.map((key, index) => [key, counts[index]]));
}