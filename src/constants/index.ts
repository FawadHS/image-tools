/**
 * Application-wide constants
 * @packageDocumentation
 */

/** Maximum number of files that can be processed at once */
export const MAX_FILES = 50;

/** Maximum individual file size in bytes (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Maximum total size of all files combined in bytes (500MB) */
export const MAX_TOTAL_SIZE = 500 * 1024 * 1024;

/** Delay between sequential conversions to allow memory cleanup (ms) */
export const CONVERSION_DELAY_MS = 100;

/** Small delay before starting conversion to allow UI update (ms) */
export const UI_UPDATE_DELAY_MS = 50;

/** Canvas preview max width for editor tools (px) */
export const CANVAS_PREVIEW_MAX_WIDTH = 300;

/** List of supported image MIME types */
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
] as const;

/** Mapping of MIME types to file extensions */
export const ACCEPTED_FILE_TYPES = {
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
} as const;

/** Default compression quality (1-100) */
export const DEFAULT_QUALITY = 80;

/** Number of concurrent conversions (deprecated - now sequential) */
export const CONCURRENT_CONVERSIONS = 4;
