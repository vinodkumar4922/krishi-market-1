const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage configuration with random UUID naming and extension sanitization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt) ? rawExt : '.jpg';
    const safeName = `${uuidv4()}${safeExt}`;
    cb(null, safeName);
  },
});

// File filter restricting to trusted image formats and safe extensions
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const rawExt = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  // Prevent path traversal in originalname
  const sanitizedOriginal = path.basename(file.originalname);
  if (sanitizedOriginal !== file.originalname && !file.originalname.startsWith('blob')) {
    return cb(new Error('Invalid filename! Potential path traversal detected.'), false);
  }

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(rawExt)) {
    return cb(
      new Error('Invalid image file type! Only JPG, JPEG, PNG, and WEBP files are permitted.'),
      false
    );
  }

  cb(null, true);
};

// Maximum file size of 2MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});

/**
 * Validates actual binary magic bytes of the uploaded file to prevent polyglot
 * or fake extension executable attacks.
 */
const validateImageMagicBytes = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;

  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    const isWebp =
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      // Delete malicious or corrupt payload immediately
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({
        success: false,
        message: 'Security validation failed: File content does not match genuine image signatures.',
      });
    }

    next();
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(400).json({
      success: false,
      message: 'Failed to verify file integrity.',
    });
  }
};

module.exports = {
  upload,
  validateImageMagicBytes,
};
