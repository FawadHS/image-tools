import heic2any from 'heic2any';
import { ConvertOptions, ConvertResult, OutputFormat } from '../types';

/**
 * Get MIME type for output format
 */
export const getMimeType = (format: OutputFormat): string => {
  const mimeTypes: Record<OutputFormat, string> = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    png: 'image/png',
    avif: 'image/avif',
  };
  return mimeTypes[format];
};

/**
 * Get file extension for output format
 */
export const getExtension = (format: OutputFormat): string => {
  const extensions: Record<OutputFormat, string> = {
    webp: '.webp',
    jpeg: '.jpg',
    png: '.png',
    avif: '.avif',
  };
  return extensions[format];
};

/**
 * Check if browser supports the output format
 */
export const isFormatSupported = async (format: OutputFormat): Promise<boolean> => {
  if (format === 'jpeg' || format === 'png') return true;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const dataUrl = canvas.toDataURL(getMimeType(format));
  return dataUrl.startsWith(`data:${getMimeType(format)}`);
};

/**
 * Check if a file is HEIC/HEIF format
 */
export const isHeicFile = (file: File): boolean => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
};

/**
 * Convert HEIC to a standard format (PNG blob)
 */
export const convertHeicToBlob = async (file: File): Promise<Blob> => {
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 1,
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert HEIC file');
  }
};

/**
 * Load an image from a blob and return dimensions
 */
export const loadImage = (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(blob);
  });
};

/**
 * Calculate new dimensions maintaining aspect ratio
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
 * Convert image to selected output format using Canvas API
 */
export const convertImage = async (
  file: File,
  options: ConvertOptions
): Promise<ConvertResult> => {
  const originalSize = file.size;
  let blob: Blob = file;

  // Convert HEIC first if needed
  if (isHeicFile(file)) {
    blob = await convertHeicToBlob(file);
  }

  // Load the image
  const img = await loadImage(blob);

  // Calculate dimensions
  const dimensions = calculateDimensions(
    img.width,
    img.height,
    options.maxWidth,
    options.maxHeight,
    options.maintainAspectRatio
  );

  // Create canvas and draw image
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw image with high quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

  // Get output format settings
  const outputFormat = options.outputFormat || 'webp';
  const mimeType = getMimeType(outputFormat);
  const extension = getExtension(outputFormat);
  
  // PNG is always lossless, so quality doesn't apply
  const quality = outputFormat === 'png' ? undefined : 
                  options.lossless ? 1 : options.quality / 100;

  // Convert to selected format
  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to create ${outputFormat.toUpperCase()} blob`));
        }
      },
      mimeType,
      quality
    );
  });

  // Generate filename
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${originalName}${extension}`;

  // Calculate reduction percentage
  const convertedSize = outputBlob.size;
  const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

  return {
    blob: outputBlob,
    originalSize,
    convertedSize,
    reduction,
    dimensions,
    filename,
  };
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use convertImage instead
 */
export const convertToWebP = async (
  file: File,
  options: ConvertOptions
): Promise<ConvertResult> => {
  return convertImage(file, { ...options, outputFormat: 'webp' });
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
