const fs = require('fs');
const path = require('path');

// Render's local filesystem is ephemeral. Persist uploaded media in MongoDB by
// default so flyer/profile URLs remain valid after a redeploy. Set this flag to
// false only when a durable object-storage service is configured separately.
const PERSIST_MEDIA_IN_MONGODB = String(
    process.env.PERSIST_MEDIA_IN_MONGODB ?? 'true'
).toLowerCase() === 'true';

const toLegacyUploadPath = (file, folder) => `/uploads/${folder}/${file.filename}`;

/**
 * Convert a multer file into a self-contained data URL for MongoDB storage.
 * The existing local path is returned if persistence is disabled or conversion
 * fails, preserving backwards compatibility with the static /uploads route.
 */
const getStoredMediaValue = (file, folder) => {
    if (!file) return undefined;

    const legacyPath = toLegacyUploadPath(file, folder);
    if (!PERSIST_MEDIA_IN_MONGODB || !file.path) return legacyPath;

    try {
        const bytes = fs.readFileSync(file.path);
        const mimeType = file.mimetype || 'application/octet-stream';
        const dataUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;

        // The database copy is authoritative. Removing the temporary local
        // file avoids accumulating files on the ephemeral Render disk.
        try {
            fs.unlinkSync(file.path);
        } catch (unlinkError) {
            console.warn('[MEDIA] Could not remove temporary upload:', unlinkError.message);
        }

        return dataUrl;
    } catch (error) {
        console.error('[MEDIA] Failed to persist upload in MongoDB:', error.message);
        return legacyPath;
    }
};

const getLocalMediaPath = (mediaValue) => {
    if (!mediaValue || /^data:/i.test(mediaValue) || /^https?:\/\//i.test(mediaValue)) {
        return null;
    }

    return path.join(__dirname, '..', String(mediaValue).replace(/^\/+/, ''));
};

module.exports = {
    PERSIST_MEDIA_IN_MONGODB,
    getStoredMediaValue,
    getLocalMediaPath
};
