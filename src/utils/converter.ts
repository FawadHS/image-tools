import { heicTo } from 'heic-to';
import { ConvertOptions, ConvertResult, OutputFormat } from '../types';
import { getMimeType as getImageMimeType, getExtension as getImageExtension, calculateDimensions as calcDimensions } from './imageHelpers';
import { loadImageWithExif, renderEditsToCanvas } from './imageTransform';

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
export const getMimeType = getImageMimeType;

/**
 * Get file extension for output format
 */
export const getExtension = getImageExtension;

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
 * Uses heic-to library for conversion
 * @param file - The HEIC file to convert
 * @returns Promise resolving to PNG blob
 * @throws {Error} If conversion fails
 */
export const convertHeicToBlob = async (file: File): Promise<Blob> => {
  try {
    const result = await heicTo({
      blob: file,
      type: 'image/png',
      quality: 1,
    });
    return result;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert HEIC file');
  }
};

/**
 * Load an image from a blob into an HTMLImageElement with EXIF normalization
 * Automatically revokes object URL after loading
 * @param blob - The image blob to load
 * @returns Promise resolving to loaded and EXIF-normalized image element
 * @throws {Error} If image fails to load
 */
const loadImage = async (blob: Blob): Promise<HTMLImageElement> => {
  // Use the unified EXIF-aware loader
  return loadImageWithExif(blob);
};

/**
 * Calculate new dimensions maintaining aspect ratio
 */
export const calculateDimensions = calcDimensions;

/**
 * Convert image to selected output format using unified render pipeline
 * This ensures preview and export are IDENTICAL
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

  // Load the image with EXIF normalization (Problem 6 fix)
  const img = await loadImage(blob);

  // Use the UNIFIED render pipeline to get final canvas
  // This applies: rotation → flip → filters → crop → text overlay
  // in the correct order (Problem 5 fix)
  const processedCanvas = renderEditsToCanvas(img, options.transform, true);

  // Handle JPEG + Circle Crop: Fill background (no alpha support)
  // This must happen AFTER renderEditsToCanvas which already applied the circular clip
  const outputFormat = options.outputFormat || 'webp';
  if (outputFormat === 'jpeg' && options.transform?.crop?.shape === 'circle') {
    // JPEG doesn't support transparency, so we need to fill the background
    // The circular clip has already been applied by renderEditsToCanvas,
    // leaving transparent pixels outside the circle. We need to composite
    // onto a white (or configured) background.
    const jpegCanvas = document.createElement('canvas');
    jpegCanvas.width = processedCanvas.width;
    jpegCanvas.height = processedCanvas.height;
    const jpegCtx = jpegCanvas.getContext('2d', { alpha: false });
    if (!jpegCtx) throw new Error('Could not get JPEG canvas context');
    
    // Fill with white background (configurable via options in future)
    jpegCtx.fillStyle = '#FFFFFF';
    jpegCtx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
    
    // Draw the processed canvas (with transparent circle) on top
    jpegCtx.drawImage(processedCanvas, 0, 0);
    
    // Use the JPEG canvas for export instead
    const finalWidth = jpegCanvas.width;
    const finalHeight = jpegCanvas.height;
    
    // Apply resize if needed (maintaining aspect ratio)
    let outputCanvas = jpegCanvas;
    if (options.maxWidth || options.maxHeight) {
      const dimensions = calculateDimensions(
        finalWidth,
        finalHeight,
        options.maxWidth,
        options.maxHeight,
        options.maintainAspectRatio
      );

      // Only create new canvas if dimensions changed
      if (dimensions.width !== finalWidth || dimensions.height !== finalHeight) {
        outputCanvas = document.createElement('canvas');
        outputCanvas.width = dimensions.width;
        outputCanvas.height = dimensions.height;
        
        const ctx = outputCanvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Could not get output canvas context');
        
        // Fill background for JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(jpegCanvas, 0, 0, dimensions.width, dimensions.height);
      }
    }
    
    // Continue with JPEG export using outputCanvas
    const mimeType = getMimeType(outputFormat);
    const extension = getExtension(outputFormat);
    const quality = options.lossless ? 1 : options.quality / 100;

    const outputBlob = await new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob(
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
    const originalName = file.name.replace(/\\.[^/.]+$/, '');
    const prefix = options.namePrefix || '';
    const suffix = options.nameSuffix || '';
    const timestamp = options.addTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
    const dimensionStr = options.addDimensions ? `_${outputCanvas.width}x${outputCanvas.height}` : '';
    
    const filename = `${prefix}${originalName}${suffix}${timestamp}${dimensionStr}${extension}`;

    // Calculate reduction percentage
    const convertedSize = outputBlob.size;
    const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

    return {
      blob: outputBlob,
      originalSize,
      convertedSize,
      reduction,
      dimensions: { width: outputCanvas.width, height: outputCanvas.height },
      filename,
    };
  }

  // Standard path (non-JPEG or non-circle crop)
  const finalWidth = processedCanvas.width;
  const finalHeight = processedCanvas.height;

  // Apply resize if needed (maintaining aspect ratio)
  let outputCanvas = processedCanvas;
  if (options.maxWidth || options.maxHeight) {
    const dimensions = calculateDimensions(
      finalWidth,
      finalHeight,
      options.maxWidth,
      options.maxHeight,
      options.maintainAspectRatio
    );

    // Only create new canvas if dimensions changed
    if (dimensions.width !== finalWidth || dimensions.height !== finalHeight) {
      outputCanvas = document.createElement('canvas');
      outputCanvas.width = dimensions.width;
      outputCanvas.height = dimensions.height;
      
      const ctx = outputCanvas.getContext('2d', { alpha: true });
      if (!ctx) throw new Error('Could not get output canvas context');
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(processedCanvas, 0, 0, dimensions.width, dimensions.height);
    }
  }

  // Get output format settings
  const finalOutputFormat = options.outputFormat || 'webp';
  const mimeType = getMimeType(finalOutputFormat);
  const extension = getExtension(finalOutputFormat);
  
  // PNG is always lossless, so quality doesn't apply
  const quality = finalOutputFormat === 'png' ? undefined : 
                  options.lossless ? 1 : options.quality / 100;

  // Convert to selected format
  const outputBlob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Failed to create ${finalOutputFormat.toUpperCase()} blob`));
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
  const dimensionStr = options.addDimensions ? `_${outputCanvas.width}x${outputCanvas.height}` : '';
  
  const filename = `${prefix}${originalName}${suffix}${timestamp}${dimensionStr}${extension}`;

  // Calculate reduction percentage
  const convertedSize = outputBlob.size;
  const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

  return {
    blob: outputBlob,
    originalSize,
    convertedSize,
    reduction,
    dimensions: { width: outputCanvas.width, height: outputCanvas.height },
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
