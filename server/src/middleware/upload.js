import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { fileTypeFromFile } from 'file-type';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const kinds = {
  'faculty-photo': { mime: ['image/jpeg', 'image/png', 'image/webp'], max: 2 * 1024 * 1024 },
  'event-banner': { mime: ['image/jpeg', 'image/png', 'image/webp'], max: 2 * 1024 * 1024 },
  'notice-attachment': { mime: ['application/pdf'], max: 10 * 1024 * 1024 },
  resource: { mime: ['application/pdf'], max: 10 * 1024 * 1024 },
  'project-doc': { mime: ['application/pdf'], max: 10 * 1024 * 1024 },
};

export function uploadFor(kind) {
  const rule = kinds[kind];
  if (!rule) throw new ApiError(400, 'Unknown upload category.');
  const directory = path.resolve(env.UPLOAD_DIR, kind);
  const middleware = multer({
    storage: multer.diskStorage({ destination: (_req, _file, callback) => callback(null, directory), filename: (_req, _file, callback) => callback(null, `${crypto.randomUUID()}.upload`) }),
    limits: { fileSize: rule.max, files: 1 },
  }).single('file');
  return async (req, res, next) => {
    try {
      await fs.mkdir(directory, { recursive: true });
      middleware(req, res, async (error) => {
        if (error) return next(error);
        if (!req.file) return next(new ApiError(400, 'Choose a file to upload.'));
        try {
          const detected = await fileTypeFromFile(req.file.path);
          if (!detected || !rule.mime.includes(detected.mime)) {
            await fs.rm(req.file.path, { force: true });
            return next(new ApiError(415, 'This file type is not allowed.'));
          }
          const filename = `${path.basename(req.file.filename, '.upload')}.${detected.ext}`;
          const finalPath = path.join(directory, filename);
          await fs.rename(req.file.path, finalPath);
          req.upload = { url: `${req.protocol}://${req.get('host')}/uploads/${kind}/${filename}`, originalName: path.basename(req.file.originalname), mime: detected.mime };
          next();
        } catch (checkError) {
          await fs.rm(req.file.path, { force: true });
          next(checkError);
        }
      });
    } catch (error) { next(error); }
  };
}