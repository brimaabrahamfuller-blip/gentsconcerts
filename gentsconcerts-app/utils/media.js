import config from '../config';

export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (/^https?:\/\//i.test(mediaPath)) return mediaPath;
  return `${config.IMAGE_BASE_URL.replace(/\/$/, '')}/${String(mediaPath).replace(/^\/+/, '')}`;
};
