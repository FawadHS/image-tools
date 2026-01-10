/**
 * Shared image processing utilities
 * Used by both main thread and Web Worker to avoid code duplication
 * @packageDocumentation
 */

import { OutputFormat } from '../types';

/**
 * MIME type mapping for output formats
 */
const MIME_TYPES: Readonly<Record<OutputFormat, string>> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
} as const;

/**
 * File extension mapping for output formats
 */
const EXTENSIONS: Readonly<Record<OutputFormat, string>> = {
  webp: '.webp',
  jpeg: '.jpg',
  png: '.png',
  avif: '.avif',
} as const;

/**
 * Get MIME type for output format
 * @param format - The output format
 * @returns The corresponding MIME type
 * @example
 * getMimeType('webp') // 'image/webp'
 */
export const getMimeType = (format: OutputFormat): string => {
  return MIME_TYPES[format];
};

/**
 * Get file extension for output format
 * @param format - The output format
 * @returns The corresponding file extension including the dot
 * @example
 * getExtension('jpeg') // '.jpg'
 */
export const getExtension = (format: OutputFormat): string => {
  return EXTENSIONS[format];
};

/**
 * Calculate new dimensions maintaining aspect ratio
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum allowed width (optional)
 * @param maxHeight - Maximum allowed height (optional)
 * @param maintainAspectRatio - Whether to maintain aspect ratio
 * @returns Calculated dimensions
 */
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } => {
  if (!maxWidth && !maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (maintainAspectRatio) {
    const aspectRatio = originalWidth / originalHeight;

    if (maxWidth && newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(newWidth / aspectRatio);
    }

    if (maxHeight && newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * aspectRatio);
    }
  } else {
    if (maxWidth) newWidth = Math.min(originalWidth, maxWidth);
    if (maxHeight) newHeight = Math.min(originalHeight, maxHeight);
  }

  return { width: newWidth, height: newHeight };
};

/**
 * Generate a unique ID for files or records
 * @returns Unique timestamp-based ID
 * @example
 * generateId() // '1704891234567-abc123def'
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if a format supports lossless compression
 * @param format - The output format to check
 * @returns True if format supports lossless
 */
export const isLosslessFormat = (format: OutputFormat): boolean => {
  return format === 'png';
};

/**
 * Get recommended quality for a format
 * @param format - The output format
 * @returns Recommended quality value (1-100)
 */
export const getRecommendedQuality = (format: OutputFormat): number => {
  const recommendations: Record<OutputFormat, number> = {
    webp: 80,
    jpeg: 85,
    png: 100, // PNG is always lossless
    avif: 75,
  };
  return recommendations[format];
};
