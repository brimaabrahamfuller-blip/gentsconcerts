const Event = require('../models/Event');
const User = require('../models/User');
const pushNotificationService = require('../services/pushNotificationService');
const { getStoredMediaValue } = require('../utils/mediaStorage');
const {
    storePromoVideo,
    deletePromoVideo,
    getPromoVideo,
    openPromoVideoRangeStream
} = require('../utils/promoVideoStorage');

const getUploadedFile = (req, fieldName) => (
    req.files?.[fieldName]?.[0]
    || (req.file?.fieldname === fieldName ? req.file : null)
);

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' }).populate('organizerId', 'fullName email');
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizerId', 'fullName email');
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.createEvent = async (req, res) => {
    let storedPromoVideo = null;

    try {
        console.log('[CREATE_EVENT] Starting for user:', req.user && req.user._id);
        const flyerFile = getUploadedFile(req, 'flyerImage');
        const promoVideoFile = getUploadedFile(req, 'promoVideo');
        if (flyerFile && flyerFile.size > 5 * 1024 * 1024) {
            throw new Error('Event flyer images may not exceed 5MB.');
        }

        // Persist the flyer as a durable media value. Legacy /uploads paths
        // remain supported when MongoDB media persistence is disabled.
        if (flyerFile) {
            req.body.flyerImage = getStoredMediaValue(flyerFile, 'events');
        }

        // Promotional videos are genuine uploads, retained in MongoDB GridFS so
        // Render's ephemeral local disk cannot remove them after a redeploy.
        if (promoVideoFile) {
            storedPromoVideo = await storePromoVideo(promoVideoFile, req.body.title);
            Object.assign(req.body, {
                promoVideoId: storedPromoVideo.id,
                promoVideoName: storedPromoVideo.filename,
                promoVideoContentType: storedPromoVideo.contentType,
                promoVideoSize: storedPromoVideo.size
            });
        }
        delete req.body.promoVideoUrl;

        req.body.organizerId = req.user._id;

        // Parse ticketTiers if it's a string (happens with FormData)
        if (typeof req.body.ticketTiers === 'string') {
            try {
                req.body.ticketTiers = JSON.parse(req.body.ticketTiers);
            } catch (e) {
                console.error('[CREATE_EVENT] Failed to parse ticketTiers:', e.message);
            }
        }

        // Set status to active if all required fields are present
        if (req.body.flyerImage && req.body.ticketTiers && req.body.ticketTiers.length > 0) {
            req.body.status = 'active';
        } else {
            req.body.status = 'pending';
        }

        console.log('[CREATE_EVENT] Final payload before save:', JSON.stringify(req.body));

        const newEvent = await Event.create(req.body);
        console.log('[CREATE_EVENT] Event created successfully:', newEvent._id);

        // Send push notifications to subscribers
        try {
            const subscribers = await User.find({
                'notificationPreferences.newEvents': true,
                expoPushToken: { $exists: true, $ne: null }
            });

            if (subscribers.length > 0) {
                await pushNotificationService.sendNewEventNotification(
                    subscribers.map(u => ({ expoPushToken: u.expoPushToken })),
                    newEvent.title,
                    newEvent.category
                );
            }
        } catch (notifError) {
            console.error('[CREATE_EVENT] Failed to send event notification:', notifError.message);
        }

        console.log('[CREATE_EVENT] Sending success response for:', newEvent._id);
        res.status(201).json({ success: true, data: newEvent });
    } catch (error) {
        if (storedPromoVideo?.id) await deletePromoVideo(storedPromoVideo.id);
        console.error('[CREATE_EVENT] Error creating event:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    let storedPromoVideo = null;

    try {
        const existingEvent = await Event.findOne({
            _id: req.params.id,
            organizerId: req.user._id
        });
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        }

        const flyerFile = getUploadedFile(req, 'flyerImage');
        const promoVideoFile = getUploadedFile(req, 'promoVideo');

        // Persist a replacement flyer only when one was uploaded. If an event
        // is edited without a new file, the existing flyer remains unchanged.
        if (flyerFile) {
            req.body.flyerImage = getStoredMediaValue(flyerFile, 'events');
        }

        if (promoVideoFile) {
            storedPromoVideo = await storePromoVideo(promoVideoFile, req.body.title || existingEvent.title);
            Object.assign(req.body, {
                promoVideoId: storedPromoVideo.id,
                promoVideoName: storedPromoVideo.filename,
                promoVideoContentType: storedPromoVideo.contentType,
                promoVideoSize: storedPromoVideo.size
            });
        }
        // Promotional video links are no longer accepted; uploads are the only
        // supported input while existing legacy values remain readable.
        delete req.body.promoVideoUrl;

        // Parse ticketTiers if it's a string (happens with FormData)
        if (typeof req.body.ticketTiers === 'string') {
            try {
                req.body.ticketTiers = JSON.parse(req.body.ticketTiers);
            } catch (e) {
                console.error('Failed to parse ticketTiers:', e);
            }
        }

        // Editing a title or video must never de-list an already active event.
        const flyerForStatus = req.body.flyerImage || existingEvent.flyerImage;
        const tiersForStatus = req.body.ticketTiers || existingEvent.ticketTiers;
        if (flyerForStatus && tiersForStatus && tiersForStatus.length > 0) {
            req.body.status = 'active';
        }

        const event = await Event.findByIdAndUpdate(
            existingEvent._id,
            req.body,
            { new: true, runValidators: true }
        );

        if (storedPromoVideo?.id && existingEvent.promoVideoId) {
            await deletePromoVideo(existingEvent.promoVideoId);
        }

        res.status(200).json({ success: true, data: event });
    } catch (error) {
        if (storedPromoVideo?.id) await deletePromoVideo(storedPromoVideo.id);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.streamPromoVideo = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).select('promoVideoId');
        if (!event?.promoVideoId) {
            return res.status(404).json({ success: false, message: 'Promotional video not found' });
        }

        const storedVideo = await getPromoVideo(event.promoVideoId);
        if (!storedVideo) {
            return res.status(404).json({ success: false, message: 'Promotional video file is unavailable' });
        }

        const totalSize = storedVideo.file.length;
        const contentType = storedVideo.file.contentType || 'video/mp4';
        const range = req.headers.range;

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Type', contentType);

        if (range) {
            const match = /bytes=(\d*)-(\d*)/.exec(range);
            const requestedStart = match?.[1] ? Number(match[1]) : 0;
            const requestedEnd = match?.[2] ? Number(match[2]) : totalSize - 1;
            const start = Math.min(Math.max(requestedStart, 0), totalSize - 1);
            const end = Math.min(Math.max(requestedEnd, start), totalSize - 1);

            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
            res.setHeader('Content-Length', end - start + 1);

            const stream = openPromoVideoRangeStream(event.promoVideoId, start, end + 1);
            stream.on('error', (error) => {
                console.error('[PROMO_VIDEO] Range stream failed:', error.message);
                res.destroy(error);
            });
            return stream.pipe(res);
        }

        res.setHeader('Content-Length', totalSize);
        storedVideo.stream.on('error', (error) => {
            console.error('[PROMO_VIDEO] Stream failed:', error.message);
            res.destroy(error);
        });
        return storedVideo.stream.pipe(res);
    } catch (error) {
        console.error('[PROMO_VIDEO] Unable to stream promotional video:', error.message);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Unable to stream promotional video.' });
        }
        res.destroy(error);
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, organizerId: req.user._id },
            { status: 'cancelled' },
            { new: true }
        );
        if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
        res.status(200).json({ success: true, message: 'Event cancelled' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizerId: req.user._id });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
