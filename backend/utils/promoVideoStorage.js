const fs = require('fs');
const mongoose = require('mongoose');

const BUCKET_NAME = 'event_promo_videos';

const getBucket = () => {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        throw new Error('Video storage is not available because MongoDB is not connected.');
    }

    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: BUCKET_NAME
    });
};

const toObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
};

const safeFilename = (filename = 'event-promo-video') => filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-120);

exports.storePromoVideo = (file, eventTitle = '') => new Promise((resolve, reject) => {
    if (!file?.path) {
        reject(new Error('No promotional video file was received.'));
        return;
    }

    let bucket;
    try {
        bucket = getBucket();
    } catch (error) {
        reject(error);
        return;
    }

    const filename = `${Date.now()}-${safeFilename(file.originalname)}`;
    const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: {
            originalName: file.originalname,
            eventTitle,
            uploadedAt: new Date()
        }
    });
    const source = fs.createReadStream(file.path);
    let completed = false;

    const cleanUp = () => {
        fs.unlink(file.path, () => {});
    };

    const fail = (error) => {
        if (completed) return;
        completed = true;
        cleanUp();
        reject(error);
    };

    source.on('error', fail);
    uploadStream.on('error', fail);
    uploadStream.on('finish', () => {
        if (completed) return;
        completed = true;
        cleanUp();
        resolve({
            id: uploadStream.id.toString(),
            filename: file.originalname,
            contentType: file.mimetype,
            size: file.size
        });
    });

    source.pipe(uploadStream);
});

exports.deletePromoVideo = async (videoId) => {
    const objectId = toObjectId(videoId);
    if (!objectId) return;

    try {
        await getBucket().delete(objectId);
    } catch (error) {
        // A failed cleanup must never prevent a successfully saved event update.
        if (error?.message !== 'FileNotFound: file not found') {
            console.error('[PROMO_VIDEO] Failed to delete previous video:', error.message);
        }
    }
};

exports.getPromoVideo = async (videoId) => {
    const objectId = toObjectId(videoId);
    if (!objectId) return null;

    const bucket = getBucket();
    const file = await mongoose.connection.db
        .collection(`${BUCKET_NAME}.files`)
        .findOne({ _id: objectId });

    if (!file) return null;

    return {
        id: objectId,
        file,
        stream: bucket.openDownloadStream(objectId),
        bucket
    };
};

exports.openPromoVideoRangeStream = (videoId, start, endExclusive) => {
    const objectId = toObjectId(videoId);
    if (!objectId) return null;

    return getBucket().openDownloadStream(objectId, {
        start,
        end: endExclusive
    });
};
