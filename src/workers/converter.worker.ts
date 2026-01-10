/**
 * Web Worker for image conversion
 * Handles heavy image processing off the main thread to prevent UI blocking
 * @packageDocumentation
 */

import { ConvertOptions, ConvertResult } from '../types';

// Import shared utilities to avoid code duplication
import { getMimeType, getExtension, calculateDimensions } from '../utils/imageHelpers';

/**
 * Load an image from a blob and return ImageBitmap (Worker-optimized)
 * @param blob - The image blob to load
 * @returns Promise resolving to ImageBitmap
 */
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

    // Get transformation options
    const transform = options.transform;
    
    // Apply crop if specified
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.width;
    let sourceHeight = img.height;
    
    if (transform?.crop) {
      sourceX = transform.crop.x;
      sourceY = transform.crop.y;
      sourceWidth = transform.crop.width;
      sourceHeight = transform.crop.height;
    }

    // Calculate dimensions based on cropped size
    const dimensions = calculateDimensions(
      sourceWidth,
      sourceHeight,
      options.maxWidth,
      options.maxHeight,
      options.maintainAspectRatio
    );
    postMessage({ type: 'progress', progress: 50 } as WorkerResponse);

    // Apply rotation if needed - swap dimensions for 90/270 degree rotations
    const rotation = transform?.rotation || 0;
    const flipH = transform?.flipHorizontal || false;
    const flipV = transform?.flipVertical || false;
    const filters = transform?.filters;
    
    // For 90 or 270 degree rotation, swap width and height
    const needsDimensionSwap = rotation === 90 || rotation === 270;
    const canvasWidth = needsDimensionSwap ? dimensions.height : dimensions.width;
    const canvasHeight = needsDimensionSwap ? dimensions.width : dimensions.height;

    // Create canvas using OffscreenCanvas if available
    const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d', { willReadFrequently: filters !== undefined });
    
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
    
    // Draw with crop applied via source parameters
    ctx.drawImage(
      img, 
      sourceX, sourceY, sourceWidth, sourceHeight,
      -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
    );
    
    // Restore context
    ctx.restore();
    
    // Apply filters if specified
    if (filters) {
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imageData.data;
      
      // Apply grayscale filter
      if (filters.grayscale) {
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
      }
      // Apply sepia filter (mutually exclusive with grayscale)
      else if (filters.sepia) {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
          data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
          data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
        }
      }
      
      // Apply brightness, contrast, saturation
      const brightness = filters.brightness / 100;
      const contrast = filters.contrast / 100;
      const saturation = filters.saturation / 100;
      
      if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          
          // Brightness
          r *= brightness;
          g *= brightness;
          b *= brightness;
          
          // Contrast
          r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
          g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
          b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
          
          // Saturation
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * saturation;
          g = gray + (g - gray) * saturation;
          b = gray + (b - gray) * saturation;
          
          // Clamp values
          data[i] = Math.max(0, Math.min(255, r));
          data[i + 1] = Math.max(0, Math.min(255, g));
          data[i + 2] = Math.max(0, Math.min(255, b));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    // Apply text overlay if specified
    if (transform?.textOverlay) {
      const overlay = transform.textOverlay;
      
      // Text coordinates are already stored relative to the cropped/transformed image
      // No adjustment needed - they're positioned correctly by TextOverlayTool
      const textX = overlay.x;
      const textY = overlay.y;
      
      // Calculate scale factor if canvas was resized
      const scaleFactor = canvasWidth / sourceWidth;
      
      ctx.save();
      ctx.font = `${overlay.fontSize * scaleFactor}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.globalAlpha = overlay.opacity;
      ctx.textBaseline = 'top';
      ctx.fillText(overlay.text, textX * scaleFactor, textY * scaleFactor);
      ctx.restore();
    }
    
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
