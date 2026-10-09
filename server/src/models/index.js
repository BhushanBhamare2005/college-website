import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;
const opts = { timestamps: true, strict: true, versionKey: false };
const textIndex = (schema, fields) => schema.index(Object.fromEntries(fields.map((field) => [field, 'text'])));

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'faculty', 'student'], required: true, default: 'student' },
  accountStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
  mustChangePassword: { type: Boolean, default: false },
}, opts);
const facultySchema = new Schema({
  name: { type: String, required: true, trim: true }, designation: { type: String, required: true },
  qualification: { type: String, required: true }, specialization: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true }, experience: String,
  bio: String, photoUrl: String, user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, opts);
const courseSchema = new Schema({ name: { type: String, required: true }, duration: String, level: String, description: String, subjects: [String] }, opts);
const labSchema = new Schema({ name: { type: String, required: true }, description: String, equipment: [String], incharge: String }, opts);
const noticeSchema = new Schema({
  title: { type: String, required: true }, category: { type: String, required: true }, description: String,
  date: { type: Date, default: Date.now }, pinned: { type: Boolean, default: false }, attachmentUrl: String,
  status: { type: String, enum: ['pending', 'published', 'rejected'], default: 'published', index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, opts);
const eventSchema = new Schema({
  title: { type: String, required: true }, type: { type: String, required: true }, date: { type: Date, required: true },
  deadline: { type: Date, required: true }, venue: { type: String, required: true }, capacity: { type: Number, min: 0, default: 0 },
  registeredCount: { type: Number, min: 0, default: 0 }, description: String, bannerUrl: String,
}, opts);
const registrationSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true }, eventTitle: { type: String, required: true },
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, lowercase: true, trim: true },
  department: String, user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, opts);
registrationSchema.index({ event: 1, email: 1 }, { unique: true });
const projectSchema = new Schema({
  type: { type: String, enum: ['project', 'achievement'], required: true }, title: { type: String, required: true },
  team: { type: String, required: true }, summary: { type: String, required: true }, link: String, documentUrl: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, opts);
const resourceSchema = new Schema({
  title: { type: String, required: true }, category: { type: String, required: true }, description: String,
  url: String, status: { type: String, enum: ['pending', 'published', 'rejected'], default: 'published', index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, opts);
const messageSchema = new Schema({
  name: { type: String, required: true }, email: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, required: true }, message: { type: String, required: true }, read: { type: Boolean, default: false },
}, opts);

for (const schema of [facultySchema, courseSchema, labSchema, noticeSchema, eventSchema, registrationSchema, projectSchema, resourceSchema, messageSchema]) {
  schema.add({ isDemo: { type: Boolean, default: false } });
}

textIndex(facultySchema, ['name', 'specialization', 'designation']);
textIndex(courseSchema, ['name', 'description']);
textIndex(labSchema, ['name', 'description']);
textIndex(resourceSchema, ['title', 'description']);
noticeSchema.index({ pinned: -1, date: -1 });
eventSchema.index({ date: 1 });
messageSchema.index({ createdAt: -1 });

const define = (name, schema) => models[name] || model(name, schema);
export const User = define('User', userSchema);
export const Faculty = define('Faculty', facultySchema);
export const Course = define('Course', courseSchema);
export const Lab = define('Lab', labSchema);
export const Notice = define('Notice', noticeSchema);
export const Event = define('Event', eventSchema);
export const EventRegistration = define('EventRegistration', registrationSchema);
export const Project = define('Project', projectSchema);
export const Resource = define('Resource', resourceSchema);
export const ContactMessage = define('ContactMessage', messageSchema);

export const collections = {
  faculty: Faculty, courses: Course, labs: Lab, notices: Notice, events: Event,
  registrations: EventRegistration, projects: Project, resources: Resource, messages: ContactMessage, users: User,
};