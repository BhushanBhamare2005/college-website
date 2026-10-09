import { collections } from '../models/index.js';

export async function dashboardStats() {
  const [faculty, courses, labs, notices, events, registrations, projects, messages] = await Promise.all([
    ...['faculty', 'courses', 'labs', 'notices', 'events', 'registrations', 'projects', 'messages'].map((key) => collections[key].countDocuments()),
  ]);
  const [pendingProjects, unreadMessages, eventRows, registrationRows, recentMessages, pendingRows] = await Promise.all([
    collections.projects.countDocuments({ status: 'pending' }), collections.messages.countDocuments({ read: false }),
    collections.events.find().sort({ date: 1 }).limit(10).lean(), collections.registrations.find().sort({ createdAt: -1 }).limit(3).lean(),
    collections.messages.find().sort({ createdAt: -1 }).limit(3).lean(), collections.projects.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);
  const participation = await Promise.all(eventRows.map(async (event) => ({ name: event.title, registrations: await collections.registrations.countDocuments({ event: event._id }) })));
  const [facultyCount, courseCount, labCount, noticeCount, eventCount, projectCount] = await Promise.all(['faculty', 'courses', 'labs', 'notices', 'events', 'projects'].map((key) => collections[key].countDocuments()));
  const byType = await Promise.all(['Workshop', 'Seminar', 'Technical Event', 'Program'].map(async (name) => {
    const ids = await collections.events.find({ type: name }).distinct('_id');
    return { name, registrations: await collections.registrations.countDocuments({ event: { $in: ids } }) };
  }));
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
  const counts = await Promise.all(keys.map((key) => collections[key].countDocuments(key === 'notices' ? { status: 'published' } : {})));
  return Object.fromEntries(keys.map((key, index) => [key, counts[index]]));
}