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

/**
 * E-commerce presets with Shopify-specific optimizations
 */
export const PRESETS = {
  // Existing presets
  'ecommerce-product': {
    id: 'ecommerce-product' as const,
    name: 'Product Image',
    description: 'Optimized for product pages (1200px, 85% quality)',
    quality: 85,
    maxWidth: 1200,
    maxHeight: 1200,
  },
  'ecommerce-thumbnail': {
    id: 'ecommerce-thumbnail' as const,
    name: 'Thumbnail',
    description: 'Small thumbnails for grids (400px, 70% quality)',
    quality: 70,
    maxWidth: 400,
    maxHeight: 400,
  },
  'hero-banner': {
    id: 'hero-banner' as const,
    name: 'Hero Banner',
    description: 'Full-width banners (1920px, 90% quality)',
    quality: 90,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  'blog-content': {
    id: 'blog-content' as const,
    name: 'Blog Image',
    description: 'Blog and article images (800px, 80% quality)',
    quality: 80,
    maxWidth: 800,
    maxHeight: 600,
  },
  'background': {
    id: 'background' as const,
    name: 'Background',
    description: 'Page backgrounds (1920px, 75% quality)',
    quality: 75,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  // NEW: Shopify-specific presets (v3.0)
  'shopify-collection': {
    id: 'shopify-collection' as const,
    name: 'Shopify Collection',
    description: 'Collection thumbnails (600×600, 85% quality)',
    quality: 85,
    maxWidth: 600,
    maxHeight: 600,
  },
  'shopify-product-detail': {
    id: 'shopify-product-detail' as const,
    name: 'Shopify Product Detail',
    description: 'High-res product images (2048×2048, 90% quality)',
    quality: 90,
    maxWidth: 2048,
    maxHeight: 2048,
  },
  // Social media presets
  'social-instagram': {
    id: 'social-instagram' as const,
    name: 'Instagram Square',
    description: 'Instagram posts (1080×1080, 85% quality)',
    quality: 85,
    maxWidth: 1080,
    maxHeight: 1080,
  },
  'social-pinterest': {
    id: 'social-pinterest' as const,
    name: 'Pinterest Pin',
    description: 'Pinterest pins (1000×1500, 85% quality)',
    quality: 85,
    maxWidth: 1000,
    maxHeight: 1500,
  },
  'custom': {
    id: 'custom' as const,
    name: 'Custom',
    description: 'Custom settings',
    quality: DEFAULT_QUALITY,
    maxWidth: undefined,
    maxHeight: undefined,
  },
} as const;

/** Type for preset configuration */
export type PresetConfig = typeof PRESETS[keyof typeof PRESETS];
