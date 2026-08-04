const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const eventFlyerDir = path.join(uploadDir, 'events');
const profileDir = path.join(uploadDir, 'profiles');

[uploadDir, eventFlyerDir, profileDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = file.fieldname === 'profileImage' ? profileDir : eventFlyerDir;
        console.log('[UPLOAD] destination callback, fieldname:', file.fieldname, '-> dir:', dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        let ext = path.extname(file.originalname).toLowerCase();
        if (!ext) {
            // originalname had no extension (e.g. a raw UUID) - derive from mimetype instead
            const mimeExtMap = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
                'image/svg+xml': '.svg'
            };
            ext = mimeExtMap[file.mimetype] || '';
        }
        const finalName = `${file.fieldname}-${uniqueSuffix}${ext}`;
        console.log('[UPLOAD] filename callback, generated:', finalName);
        cb(null, finalName);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    console.log('[UPLOAD] fileFilter called for:', file.originalname, file.mimetype);
    // Trust mimetype primarily: some clients (e.g. mobile web image pickers)
    // send filenames without extensions (e.g. a raw UUID with no ".jpg" etc.),
    // so relying on the filename extension incorrectly rejects valid images.
    const allowedMimetypes = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/;
    const mimetype = allowedMimetypes.test(file.mimetype);

    if (mimetype) {
        cb(null, true);
    } else {
        console.error('[UPLOAD] fileFilter rejected file:', file.originalname, file.mimetype);
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'), false);
    }
};

// Upload middleware for event flyers
exports.uploadEventFlyer = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
}).single('flyerImage');

// Upload middleware for profile images
exports.uploadProfileImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB max
    }
}).single('profileImage');

// Error handling middleware for multer
exports.handleUploadError = (err, req, res, next) => {
    console.log('[UPLOAD] handleUploadError reached. Error present:', !!err);
    if (err instanceof multer.MulterError) {
        console.error('[UPLOAD] MulterError:', err.code, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File is too large. Maximum size is 5MB for flyers and 2MB for profile images.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    }
    if (err) {
        console.error('[UPLOAD] Non-multer error:', err.message);
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    console.log('[UPLOAD] No error, proceeding to next middleware/controller');
    next();
};
