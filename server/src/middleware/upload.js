import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_MB || '20', 10);

// Ensure upload directory exists
const absoluteUploadDir = path.resolve(process.cwd(), UPLOAD_DIR);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, absoluteUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure unique file key: UUID + sanitized extension
    const uniqueKey = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueKey);
  },
});

// File filter: strict PDF checking
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' && ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF documents (.pdf) are accepted.'), false);
  }
};

export const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024, // e.g. 20MB
    files: 1,
  },
});

/**
 * Validates PDF magic bytes (%PDF-) to prevent spoofed MIME extensions.
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
export async function verifyPdfSignature(filePath) {
  try {
    const handle = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(5);
    await handle.read(buffer, 0, 5, 0);
    await handle.close();
    return buffer.toString('utf-8') === '%PDF-';
  } catch {
    return false;
  }
}
