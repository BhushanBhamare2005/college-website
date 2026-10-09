import { ApiError } from '../utils/ApiError.js';

export function notFound(_req, _res, next) {
  next(new ApiError(404, 'Endpoint not found.'));
}

export function errorHandler(error, _req, res, _next) {
  if (error?.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Malformed JSON request.' });
  if (error?.code === 'CORS_ORIGIN_DENIED') return res.status(403).json({ success: false, message: 'Origin is not allowed.' });
  if (error?.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Request body is too large.' });
  if (error?.code === 11000) return res.status(409).json({ success: false, message: 'A record with these details already exists.' });
  if (error?.name === 'ValidationError') {
    const errors = Object.fromEntries(Object.entries(error.errors || {}).map(([field, issue]) => [field, issue.message]));
    return res.status(400).json({ success: false, message: 'Please check the submitted fields.', errors });
  }
  if (error instanceof ApiError) return res.status(error.status).json({ success: false, message: error.message, ...(error.errors ? { errors: error.errors } : {}) });
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'File is too large.' });
  if (process.env.NODE_ENV !== 'production') console.error(error);
  return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
}