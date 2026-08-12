import config from '../config';

export const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (/^(https?:\/\/|data:|blob:|file:|content:)/i.test(mediaPath)) return mediaPath;
  return `${config.IMAGE_BASE_URL.replace(/\/$/, '')}/${String(mediaPath).replace(/^\/+/, '')}`;
};
