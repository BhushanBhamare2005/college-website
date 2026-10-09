import { z } from 'zod';

const text = (max = 5000) => z.string().trim().max(max);
const required = (max = 5000) => text(max).min(1);
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const date = z.coerce.date();
const list = z.array(text(300)).max(100);
const eventFields = z.object({ title: required(240), type: required(100), date, deadline: date, venue: required(240), capacity: z.coerce.number().int().min(0).max(100000).optional(), description: text(5000).optional(), bannerUrl: text(1000).optional() });
const validEventWindow = (value) => !value.deadline || !value.date || value.deadline <= value.date;

export const schemas = {
  faculty: z.object({ name: required(120), designation: required(120), qualification: required(200), specialization: required(200), email: email.optional(), experience: text(120).optional(), bio: text(3000).optional(), photoUrl: text(1000).optional() }),
  courses: z.object({ name: required(200), duration: text(100).optional(), level: text(100).optional(), description: text(5000).optional(), subjects: list.optional() }),
  labs: z.object({ name: required(200), description: text(5000).optional(), equipment: list.optional(), incharge: text(200).optional() }),
  notices: z.object({ title: required(240), category: required(100), description: text(5000).optional(), date: date.optional(), pinned: z.coerce.boolean().optional(), attachmentUrl: text(1000).optional(), status: z.enum(['pending', 'published', 'rejected']).optional() }),
  events: eventFields.refine(validEventWindow, { path: ['deadline'], message: 'Deadline must be on or before the event date.' }),
  projects: z.object({ type: z.enum(['project', 'achievement']), title: required(240), team: required(500), summary: required(5000), link: text(1000).optional(), documentUrl: text(1000).optional(), status: z.enum(['pending', 'approved', 'rejected']).optional() }),
  resources: z.object({ title: required(240), category: required(100), description: text(5000).optional(), url: text(1000).optional(), status: z.enum(['pending', 'published', 'rejected']).optional() }),
  registrations: z.object({ name: required(120), email, department: text(200).optional() }),
  messages: z.object({ read: z.coerce.boolean() }),
  users: z.object({ name: required(120), email, role: z.enum(['admin', 'faculty', 'student']), accountStatus: z.enum(['pending', 'approved', 'rejected']).optional(), password: z.string().min(12).max(200).optional() }),
};

export const studentSignupSchema = z.object({ name: required(120), email, password: z.string().min(10).max(200) });
export const contactSchema = z.object({
  name: required(120), email, subject: required(200), message: required(3000), website: text(300).optional(),
});
export const loginSchema = z.object({ email, password: z.string().min(1).max(200) });
export const passwordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(10).max(200) });
export const parsePayload = (schema, input) => {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const errors = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.') || 'body', issue.message]));
  return { error: errors };
};

export const updateSchemas = {
  ...Object.fromEntries(Object.entries(schemas).filter(([key]) => key !== 'events').map(([key, schema]) => [key, schema.partial()])),
  events: eventFields.partial().refine(validEventWindow, { path: ['deadline'], message: 'Deadline must be on or before the event date.' }),
};