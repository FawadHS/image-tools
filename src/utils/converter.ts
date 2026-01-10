import heic2any from 'heic2any';
import { ConvertOptions, ConvertResult, OutputFormat } from '../types';
import { getMimeType, getExtension, calculateDimensions } from './imageHelpers';

/**
 * Check if Web Workers are supported in the current browser
 * @returns True if both Worker and OffscreenCanvas are supported
 */
export const isWorkerSupported = (): boolean => {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
};

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
 * Check if a file is in HEIC/HEIF format
 * @param file - The file to check
 * @returns True if the file is HEIC or HEIF
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
 * Convert HEIC file to a standard PNG blob
 * Uses heic2any library for conversion
 * @param file - The HEIC file to convert
 * @returns Promise resolving to PNG blob
 * @throws {Error} If conversion fails
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
  }HTMLImageElement
 * Automatically revokes object URL after loading
 * @param blob - The image blob to load
 * @returns Promise resolving to loaded image element
 * @throws {Error} If image fails to load
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
  
  // Apply crop if specified
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;
  
  if (options.transform?.crop) {
    sourceX = options.transform.crop.x;
    sourceY = options.transform.crop.y;
    sourceWidth = options.transform.crop.width;
    sourceHeight = options.transform.crop.height;
    
    // Recalculate dimensions based on cropped size
    const croppedDimensions = calculateDimensions(
      sourceWidth,
      sourceHeight,
      options.maxWidth,
      options.maxHeight,
      options.maintainAspectRatio
    );
    canvas.width = croppedDimensions.width;
    canvas.height = croppedDimensions.height;
  } else {
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Apply transformations
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Save context for transformations
  ctx.save();

  // Apply rotation if specified
  if (options.transform?.rotation) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((options.transform.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  // Apply flip transformations
  if (options.transform?.flipHorizontal || options.transform?.flipVertical) {
    const scaleX = options.transform.flipHorizontal ? -1 : 1;
    const scaleY = options.transform.flipVertical ? -1 : 1;
    const translateX = options.transform.flipHorizontal ? canvas.width : 0;
    const translateY = options.transform.flipVertical ? canvas.height : 0;
    ctx.translate(translateX, translateY);
    ctx.scale(scaleX, scaleY);
  }

  // Draw the image (with crop applied via source parameters)
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.restore();

  // Apply filters if specified
  if (options.transform?.filters) {
    const filters = options.transform.filters;
    const filterArray: string[] = [];

    if (filters.brightness !== 100) {
      filterArray.push(`brightness(${filters.brightness}%)`);
    }
    if (filters.contrast !== 100) {
      filterArray.push(`contrast(${filters.contrast}%)`);
    }
    if (filters.saturation !== 100) {
      filterArray.push(`saturate(${filters.saturation}%)`);
    }
    if (filters.grayscale) {
      filterArray.push('grayscale(100%)');
    }
    if (filters.sepia) {
      filterArray.push('sepia(100%)');
    }

    if (filterArray.length > 0) {
      ctx.filter = filterArray.join(' ');
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }
  }

  // Apply text overlay if specified
  if (options.transform?.textOverlay) {
    const overlay = options.transform.textOverlay;
    
    // Calculate text position relative to the canvas
    // Text coordinates are stored relative to the original image
    let textX = overlay.x;
    let textY = overlay.y;
    
    // If crop is applied, adjust text position by subtracting crop offset
    if (options.transform?.crop) {
      textX = overlay.x - options.transform.crop.x;
      textY = overlay.y - options.transform.crop.y;
    }
    
    // Calculate scale factor based on canvas vs source dimensions
    const scaleFactor = canvas.width / sourceWidth;
    
    ctx.save();
    ctx.font = `${overlay.fontSize * scaleFactor}px ${overlay.fontFamily}`;
    ctx.fillStyle = overlay.color;
    ctx.globalAlpha = overlay.opacity;
    ctx.textBaseline = 'top';
    ctx.fillText(overlay.text, textX * scaleFactor, textY * scaleFactor);
    ctx.restore();
  }

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
  const prefix = options.namePrefix || '';
  const suffix = options.nameSuffix || '';
  const timestamp = options.addTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
  const dimensionStr = options.addDimensions ? `_${dimensions.width}x${dimensions.height}` : '';
  
  const filename = `${prefix}${originalName}${suffix}${timestamp}${dimensionStr}${extension}`;

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
