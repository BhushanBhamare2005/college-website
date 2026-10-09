import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export function validateId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return next(new ApiError(400, 'Invalid record id.'));
  next();
}

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.') || 'body', issue.message]));
      return next(new ApiError(400, 'Please check the submitted fields.', errors));
    }
    req.validatedBody = result.data;
    next();
  };
}