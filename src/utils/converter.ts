import { ConvertOptions, ConvertResult, OutputFormat } from '../types';
import { getMimeType as getImageMimeType, getExtension as getImageExtension, calculateDimensions as calcDimensions } from './imageHelpers';
import { buildOutputFilename } from './filename';
import { maybePreserveMetadata } from './metadata';
import { encodeWithWasm } from './wasmEncoders';
import { runAiEnhancement } from './aiEnhance';
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
 * Accepts either a File object or a filename string
 * @param fileOrName - The file to check or filename
 * @returns True if the file is HEIC or HEIF
 */
export const isHeicFile = (fileOrName: File | string): boolean => {
  if (typeof fileOrName === 'string') {
    const name = fileOrName.toLowerCase();
    return name.endsWith('.heic') || name.endsWith('.heif');
  }
  const type = fileOrName.type.toLowerCase();
  const name = fileOrName.name.toLowerCase();
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
 * @param file - The HEIC file or blob to convert
 * @returns Promise resolving to PNG blob
 * @throws {Error} If conversion fails
 */
export const convertHeicToBlob = async (file: File | Blob): Promise<Blob> => {
  try {
    const { heicTo } = await import('heic-to');
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
  options: ConvertOptions,
  onAiStatus?: (status: { status: 'queued' | 'processing' | 'polling' | 'done' | 'error'; message?: string; jobId?: string }) => void
): Promise<ConvertResult> => {
  const originalSize = file.size;
  let blob: Blob = file;
  const outputFormat = options.outputFormat || 'webp';
  let nativeSupported = true;

  if (outputFormat !== 'jpeg' && outputFormat !== 'png') {
    nativeSupported = await isFormatSupported(outputFormat);
    const wasmEligible =
      Boolean(options.useWasmEncoders) && (outputFormat === 'webp' || outputFormat === 'avif');
    if (!nativeSupported && !wasmEligible) {
      throw new Error(`${outputFormat.toUpperCase()} is not supported in this browser`);
    }
  }

  const wasmOnlyEncoding =
    !nativeSupported &&
    Boolean(options.useWasmEncoders) &&
    (outputFormat === 'webp' || outputFormat === 'avif');

  const createStandardBlob = async (
    canvas: HTMLCanvasElement,
    format: OutputFormat,
    qualityValue: number | undefined,
    aiMode?: string,
    aiInputMime?: string,
    aiInputQuality?: number
  ): Promise<Blob> => {
    if (aiMode && aiMode !== 'none') {
      const aiInput = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to prepare AI input'));
          },
          aiInputMime || 'image/png',
          aiInputQuality
        );
      });
      return runAiEnhancement(aiInput, options, format, onAiStatus);
    }

    const wasmBlob = await encodeWithWasm(canvas, format, options);
    if (wasmBlob) return wasmBlob;
    if (wasmOnlyEncoding) {
      throw new Error(`${format.toUpperCase()} encoding requires WASM encoders`);
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
          }
        },
        getMimeType(format),
        qualityValue
      );
    });
  };

  // Convert HEIC first if needed
  if (isHeicFile(file)) {
    blob = await convertHeicToBlob(file);
  }

  // Load the image with EXIF normalization (Problem 6 fix)
  const img = await loadImage(blob);

  // Use the UNIFIED render pipeline to get final canvas
  // This applies: rotation -> flip -> filters -> crop -> text overlay
  // in the correct order (Problem 5 fix)
  const processedCanvas = renderEditsToCanvas(img, options.transform, true);

  // Handle JPEG + Circle Crop: Fill background (no alpha support)
  // This must happen AFTER renderEditsToCanvas which already applied the circular clip
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
    const extension = getExtension(outputFormat);
    const quality = options.lossless ? 1 : options.quality / 100;

    let outputBlob: Blob;
    let aiFallback = false;
    let aiSkippedReason: string | undefined;
    const aiMaxPixels = options.aiMaxPixels ?? 12_000_000;
    const aiPixels = outputCanvas.width * outputCanvas.height;
    const aiTooLarge = options.aiMode && options.aiMode !== 'none' && aiPixels > aiMaxPixels;

    if (options.aiMode === 'compress') {
      const standardBlob = await createStandardBlob(outputCanvas, outputFormat, quality, 'none');
      if (aiTooLarge) {
        aiSkippedReason = `Image exceeds ${Math.round(aiMaxPixels / 1_000_000)}MP limit`;
        outputBlob = standardBlob;
      } else {
        let aiBlob: Blob | null = null;
        try {
          aiBlob = await createStandardBlob(
            outputCanvas,
            outputFormat,
            quality,
            options.aiMode,
            'image/jpeg',
            0.92
          );
        } catch {
          aiBlob = null;
        }
        const shouldPreferSmaller = options.aiOnlyIfSmaller ?? true;
        if (!aiBlob) {
          aiFallback = true;
          aiSkippedReason = 'AI failed or timed out';
          outputBlob = standardBlob;
        } else if (shouldPreferSmaller && aiBlob.size > standardBlob.size) {
          aiFallback = true;
          aiSkippedReason = 'AI result was larger';
          outputBlob = standardBlob;
        } else {
          outputBlob = aiBlob;
        }
      }
    } else {
      if (aiTooLarge) {
        aiSkippedReason = `Image exceeds ${Math.round(aiMaxPixels / 1_000_000)}MP limit`;
        outputBlob = await createStandardBlob(outputCanvas, outputFormat, quality, 'none');
      } else {
        outputBlob = await createStandardBlob(outputCanvas, outputFormat, quality, options.aiMode);
      }
    }

    const filename = buildOutputFilename(
      file.name,
      extension,
      outputCanvas.width,
      outputCanvas.height,
      options
    );

    const finalBlob = await maybePreserveMetadata(outputBlob, file, outputFormat, options);

    // Calculate reduction percentage
    const convertedSize = finalBlob.size;
    const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

    return {
      blob: finalBlob,
      originalSize,
      convertedSize,
      reduction,
      dimensions: { width: outputCanvas.width, height: outputCanvas.height },
      filename,
      aiFallback,
      aiSkippedReason,
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
  const extension = getExtension(finalOutputFormat);
  
  // PNG is always lossless, so quality doesn't apply
  const quality = finalOutputFormat === 'png' ? undefined : 
                  options.lossless ? 1 : options.quality / 100;

  // Convert to selected format
  let outputBlob: Blob;

  let aiFallback = false;
  let aiSkippedReason: string | undefined;
  const aiMaxPixels = options.aiMaxPixels ?? 12_000_000;
  const aiPixels = outputCanvas.width * outputCanvas.height;
  const aiTooLarge = options.aiMode && options.aiMode !== 'none' && aiPixels > aiMaxPixels;

  if (options.aiMode === 'compress') {
    const standardBlob = await createStandardBlob(outputCanvas, finalOutputFormat, quality, 'none');
    if (aiTooLarge) {
      aiSkippedReason = `Image exceeds ${Math.round(aiMaxPixels / 1_000_000)}MP limit`;
      outputBlob = standardBlob;
    } else {
      let aiBlob: Blob | null = null;
      try {
        aiBlob = await createStandardBlob(
          outputCanvas,
          finalOutputFormat,
          quality,
          options.aiMode,
          'image/jpeg',
          0.92
        );
      } catch {
        aiBlob = null;
      }
      const shouldPreferSmaller = options.aiOnlyIfSmaller ?? true;
      if (!aiBlob) {
        aiFallback = true;
        aiSkippedReason = 'AI failed or timed out';
        outputBlob = standardBlob;
      } else if (shouldPreferSmaller && aiBlob.size > standardBlob.size) {
        aiFallback = true;
        aiSkippedReason = 'AI result was larger';
        outputBlob = standardBlob;
      } else {
        outputBlob = aiBlob;
      }
    }
  } else {
    if (aiTooLarge) {
      aiSkippedReason = `Image exceeds ${Math.round(aiMaxPixels / 1_000_000)}MP limit`;
      outputBlob = await createStandardBlob(outputCanvas, finalOutputFormat, quality, 'none');
    } else {
      outputBlob = await createStandardBlob(outputCanvas, finalOutputFormat, quality, options.aiMode);
    }
  }

  const filename = buildOutputFilename(
    file.name,
    extension,
    outputCanvas.width,
    outputCanvas.height,
    options
  );

  const finalBlob = await maybePreserveMetadata(outputBlob, file, finalOutputFormat, options);

  // Calculate reduction percentage
  const convertedSize = finalBlob.size;
  const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

  return {
    blob: finalBlob,
    originalSize,
    convertedSize,
    reduction,
    dimensions: { width: outputCanvas.width, height: outputCanvas.height },
    filename,
    aiFallback,
    aiSkippedReason,
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
