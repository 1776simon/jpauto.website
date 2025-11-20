const multer = require('multer');
const path = require('path');

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE_MB) * 1024 * 1024 || 10 * 1024 * 1024; // 10MB default
const MAX_FILES = parseInt(process.env.MAX_IMAGES_PER_SUBMISSION) || 40;

// File filter - only allow images
const imageFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedExts.join(', ')} are allowed.`), false);
  }
};

// Configure multer for memory storage (we'll upload to R2)
const storage = multer.memoryStorage();

// Create upload middleware
const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('image');

// Middleware for multiple file upload
const uploadMultiple = upload.array('images', MAX_FILES);

// Error handling wrapper
const handleUploadError = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large',
            message: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
          });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            error: 'Too many files',
            message: `Maximum ${MAX_FILES} files allowed`
          });
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            error: 'Unexpected file field',
            message: err.message
          });
        }

        return res.status(400).json({
          error: 'Upload error',
          message: err.message
        });
      } else if (err) {
        // Other errors
        return res.status(400).json({
          error: 'Upload failed',
          message: err.message
        });
      }

      next();
    });
  };
};

// Export wrapped middleware
module.exports = {
  uploadSingle: handleUploadError(uploadSingle),
  uploadMultiple: handleUploadError(uploadMultiple),
  upload // Export raw upload for custom configurations
};
