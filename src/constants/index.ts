export const MAX_FILES = 50;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

export const SUPPORTED_FORMATS = [
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
];

export const ACCEPTED_FILE_TYPES = {
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
};

export const DEFAULT_QUALITY = 80;

export const CONCURRENT_CONVERSIONS = 4;
