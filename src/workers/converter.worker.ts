/**
 * Web Worker for image conversion
 * Handles heavy image processing off the main thread
 */

import { ConvertOptions, ConvertResult, OutputFormat } from '../types';

// Helper functions duplicated in worker context
const getMimeType = (format: OutputFormat): string => {
  const mimeTypes: Record<OutputFormat, string> = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    png: 'image/png',
    avif: 'image/avif',
  };
  return mimeTypes[format];
};

const getExtension = (format: OutputFormat): string => {
  const extensions: Record<OutputFormat, string> = {
    webp: '.webp',
    jpeg: '.jpg',
    png: '.png',
    avif: '.avif',
  };
  return extensions[format];
};

const calculateDimensions = (
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

const loadImage = (blob: Blob): Promise<ImageBitmap> => {
  return createImageBitmap(blob);
};

interface WorkerMessage {
  type: 'convert';
  payload: {
    blob: Blob;
    filename: string;
    originalSize: number;
    options: ConvertOptions;
  };
}

interface WorkerResponse {
  type: 'success' | 'error' | 'progress';
  payload?: ConvertResult;
  error?: string;
  progress?: number;
}

// Worker message handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  if (type !== 'convert') {
    return;
  }

  try {
    const { blob, filename, originalSize, options } = payload;

    // Report progress
    postMessage({ type: 'progress', progress: 10 } as WorkerResponse);

    // Load the image
    const img = await loadImage(blob);
    postMessage({ type: 'progress', progress: 30 } as WorkerResponse);

    // Calculate dimensions
    const dimensions = calculateDimensions(
      img.width,
      img.height,
      options.maxWidth,
      options.maxHeight,
      options.maintainAspectRatio
    );
    postMessage({ type: 'progress', progress: 50 } as WorkerResponse);

    // Apply rotation if needed - swap dimensions for 90/270 degree rotations
    const transform = options.transform;
    const rotation = transform?.rotation || 0;
    const flipH = transform?.flipHorizontal || false;
    const flipV = transform?.flipVertical || false;
    
    // For 90 or 270 degree rotation, swap width and height
    const needsDimensionSwap = rotation === 90 || rotation === 270;
    const canvasWidth = needsDimensionSwap ? dimensions.height : dimensions.width;
    const canvasHeight = needsDimensionSwap ? dimensions.width : dimensions.height;

    // Create canvas using OffscreenCanvas if available
    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw image with high quality and transformations
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Save context state
    ctx.save();
    
    // Apply transformations in the correct order
    // 1. Translate to center
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    
    // 2. Apply rotation
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    
    // 3. Apply flips
    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;
    ctx.scale(scaleX, scaleY);
    
    // 4. Draw image centered (accounting for rotation dimension swap)
    const drawWidth = needsDimensionSwap ? dimensions.height : dimensions.width;
    const drawHeight = needsDimensionSwap ? dimensions.width : dimensions.height;
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    
    // Restore context
    ctx.restore();
    
    postMessage({ type: 'progress', progress: 70 } as WorkerResponse);

    // Get output format settings
    const outputFormat = options.outputFormat || 'webp';
    const mimeType = getMimeType(outputFormat);
    const extension = getExtension(outputFormat);
    
    // PNG is always lossless, so quality doesn't apply
    const quality = outputFormat === 'png' ? undefined : 
                    options.lossless ? 1 : options.quality / 100;

    // Convert to selected format
    const outputBlob = await canvas.convertToBlob({
      type: mimeType,
      quality,
    });
    postMessage({ type: 'progress', progress: 90 } as WorkerResponse);

    // Generate filename
    const originalName = filename.replace(/\.[^/.]+$/, '');
    const outputFilename = `${originalName}${extension}`;

    // Calculate reduction percentage
    const convertedSize = outputBlob.size;
    const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

    const result: ConvertResult = {
      blob: outputBlob,
      originalSize,
      convertedSize,
      reduction,
      dimensions,
      filename: outputFilename,
    };

    postMessage({ type: 'success', payload: result } as WorkerResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
    postMessage({ type: 'error', error: errorMessage } as WorkerResponse);
  }
};

export {};
