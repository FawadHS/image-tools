/**
 * Web Worker for image conversion - UNIFIED PIPELINE IMPLEMENTATION
 * 
 * This worker implements the EXACT SAME transformation pipeline as renderEditsToCanvas()
 * but using worker-compatible APIs (OffscreenCanvas, ImageBitmap).
 * 
 * TRANSFORMATION ORDER (MUST MATCH renderEditsToCanvas):
 * 1. Normalize EXIF orientation (handled on main thread before sending to worker)
 * 2. Apply rotation (user-defined)
 * 3. Apply flip (horizontal/vertical)
 * 4. Apply filters (brightness, contrast, etc.) - using CSS filters
 * 5. Apply crop (cuts the final region)
 * 6. Apply text overlay (optional)
 * 
 * @packageDocumentation
 */

import { ConvertOptions, ConvertResult, ImageTransform } from '../types';

// Import shared utilities to avoid code duplication
import { getMimeType, getExtension, calculateDimensions } from '../utils/imageHelpers';
import { buildOutputFilename } from '../utils/filename';

/**
 * Load an image from a blob and return ImageBitmap (Worker-optimized)
 * NOTE: EXIF normalization must be done on main thread before sending to worker
 * @param blob - The image blob to load (already EXIF-normalized)
 * @returns Promise resolving to ImageBitmap
 */
const loadImage = (blob: Blob): Promise<ImageBitmap> => {
  return createImageBitmap(blob);
};

/**
 * Apply filter transforms to a canvas context
 * Returns the filter string to be applied to ctx.filter
 * MUST MATCH: imageTransform.ts applyFilters()
 */
const applyFilters = (transform: ImageTransform | undefined): string => {
  if (!transform?.filters) return 'none';

  const filters = transform.filters;
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

  const blurValue = filters.blur ?? 0;
  if (blurValue > 0) {
    const blurPx = Math.min(8, blurValue * 0.6);
    filterArray.push(`blur(${blurPx}px)`);
  }

  return filterArray.length > 0 ? filterArray.join(' ') : 'none';
};


const clampChannel = (value: number) => Math.max(0, Math.min(255, value));

const applyAdvancedAdjustments = (
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  transform: ImageTransform | undefined
) => {
  const filters = transform?.filters;
  if (!filters) return;

  const clarity = filters.clarity ?? 0;
  const vibrance = filters.vibrance ?? 0;
  const highlights = filters.highlights ?? 0;
  const shadows = filters.shadows ?? 0;
  const temperature = filters.temperature ?? 0;
  const sharpen = filters.sharpen ?? 0;

  const minAdjust = 1;
  const tunedClarity = Math.abs(clarity) < minAdjust ? 0 : clarity;
  const tunedVibrance = Math.abs(vibrance) < minAdjust ? 0 : vibrance;
  const tunedHighlights = Math.abs(highlights) < minAdjust ? 0 : highlights;
  const tunedShadows = Math.abs(shadows) < minAdjust ? 0 : shadows;
  const tunedTemperature = Math.abs(temperature) < minAdjust ? 0 : temperature;
  const tunedSharpen = Math.abs(sharpen) < minAdjust ? 0 : sharpen;

  const needsAdvanced =
    tunedClarity !== 0 ||
    tunedVibrance !== 0 ||
    tunedHighlights !== 0 ||
    tunedShadows !== 0 ||
    tunedTemperature !== 0;

  if (!needsAdvanced && tunedSharpen <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (needsAdvanced) {
    const clarityFactor = tunedClarity / 100;
    const vibranceFactor = tunedVibrance / 100;
    const highlightFactor = tunedHighlights / 100;
    const shadowFactor = tunedShadows / 100;
    const tempFactor = tunedTemperature / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (tempFactor !== 0) {
        r = clampChannel(r + tempFactor * 20);
        b = clampChannel(b - tempFactor * 20);
      }

      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const lumNorm = lum / 255;

      if (shadowFactor !== 0) {
        const shadowScale = (1 - lumNorm) * shadowFactor;
        r = clampChannel(r + (255 - r) * shadowScale);
        g = clampChannel(g + (255 - g) * shadowScale);
        b = clampChannel(b + (255 - b) * shadowScale);
      }

      if (highlightFactor !== 0) {
        const highlightScale = lumNorm * highlightFactor;
        r = clampChannel(r + (255 - r) * highlightScale);
        g = clampChannel(g + (255 - g) * highlightScale);
        b = clampChannel(b + (255 - b) * highlightScale);
      }

      if (vibranceFactor !== 0) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const boost = (1 - sat) * vibranceFactor;
        const avg = (r + g + b) / 3;
        r = clampChannel(r + (r - avg) * boost);
        g = clampChannel(g + (g - avg) * boost);
        b = clampChannel(b + (b - avg) * boost);
      }

      if (clarityFactor !== 0) {
        const contrastScale = 1 + clarityFactor;
        r = clampChannel(((r / 255 - 0.5) * contrastScale + 0.5) * 255);
        g = clampChannel(((g / 255 - 0.5) * contrastScale + 0.5) * 255);
        b = clampChannel(((b / 255 - 0.5) * contrastScale + 0.5) * 255);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  if (tunedSharpen > 0) {
    applySharpen(ctx, width, height, tunedSharpen);
  }
};

const applySharpen = (
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) => {
  if (amount <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);
  const strength = Math.min(1, amount / 100);

  const getIndex = (x: number, y: number) => (y * width + x) * 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      let count = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = getIndex(px, py);
          r += original[idx];
          g += original[idx + 1];
          b += original[idx + 2];
          count += 1;
        }
      }
      const blurR = r / count;
      const blurG = g / count;
      const blurB = b / count;

      const idx = getIndex(x, y);
      const origR = original[idx];
      const origG = original[idx + 1];
      const origB = original[idx + 2];

      data[idx] = clampChannel(origR + (origR - blurR) * strength);
      data[idx + 1] = clampChannel(origG + (origG - blurG) * strength);
      data[idx + 2] = clampChannel(origB + (origB - blurB) * strength);
    }
  }

  ctx.putImageData(imageData, 0, 0);
};
/**
 * UNIFIED RENDER PIPELINE - Worker Implementation
 * 
 * This function replicates renderEditsToCanvas() but uses OffscreenCanvas.
 * It applies ALL transformations in the correct order to ensure preview and
 * export produce IDENTICAL output.
 * 
 * @param img - ImageBitmap (already EXIF-normalized)
 * @param transform - All transformations to apply
 * @param includeTextOverlay - Whether to bake text overlay into output
 * @returns OffscreenCanvas with final processed pixels
 */
const renderEditsToOffscreenCanvas = (
  img: ImageBitmap,
  transform: ImageTransform | undefined,
  includeTextOverlay: boolean = true
): OffscreenCanvas => {
  // Step 1: Calculate dimensions after rotation
  const rotation = transform?.rotation || 0;
  const normalized = ((rotation % 360) + 360) % 360;

  let workingWidth = img.width;
  let workingHeight = img.height;

  if (normalized === 90 || normalized === 270) {
    [workingWidth, workingHeight] = [workingHeight, workingWidth];
  } else if (normalized !== 0 && normalized !== 180) {
    const radians = (normalized * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const rotatedWidth = workingWidth * cos + workingHeight * sin;
    const rotatedHeight = workingWidth * sin + workingHeight * cos;
    workingWidth = Math.ceil(rotatedWidth);
    workingHeight = Math.ceil(rotatedHeight);
  }

  // Step 2: Create canvas for rotation + flip + filters
  const transformCanvas = new OffscreenCanvas(workingWidth, workingHeight);
  const transformCtx = transformCanvas.getContext('2d', { alpha: true });
  if (!transformCtx) throw new Error('Could not get transform canvas context');

  transformCtx.save();
  transformCtx.imageSmoothingEnabled = true;
  transformCtx.imageSmoothingQuality = 'high';

  // Apply rotation and flip
  transformCtx.translate(workingWidth / 2, workingHeight / 2);
  
  if (rotation !== 0) {
    transformCtx.rotate((rotation * Math.PI) / 180);
  }
  
  const flipH = transform?.flipHorizontal || false;
  const flipV = transform?.flipVertical || false;
  const scaleX = flipH ? -1 : 1;
  const scaleY = flipV ? -1 : 1;
  transformCtx.scale(scaleX, scaleY);

  // Apply filters using CSS filters (same as main thread)
  transformCtx.filter = applyFilters(transform);

  // Draw original image with transforms
  transformCtx.drawImage(img, -img.width / 2, -img.height / 2);

  transformCtx.filter = 'none';
  transformCtx.restore();

  applyAdvancedAdjustments(transformCtx, transformCanvas.width, transformCanvas.height, transform);

  // Step 3: Apply crop (if exists)
  const canvas = new OffscreenCanvas(workingWidth, workingHeight);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Could not get canvas context');

  if (transform?.crop) {
    const crop = transform.crop;
    
    // Validate crop dimensions
    const cropX = Math.max(0, Math.min(crop.x, workingWidth));
    const cropY = Math.max(0, Math.min(crop.y, workingHeight));
    const cropWidth = Math.max(1, Math.min(crop.width, workingWidth - cropX));
    const cropHeight = Math.max(1, Math.min(crop.height, workingHeight - cropY));
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Handle circle crop with clipping
    if (crop.shape === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        cropWidth / 2,
        cropHeight / 2,
        Math.min(cropWidth, cropHeight) / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
    }
    
    // Draw cropped region from transformed image
    ctx.drawImage(
      transformCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    
    if (crop.shape === 'circle') {
      ctx.restore();
    }
  } else {
    // No crop - use full transformed image
    canvas.width = workingWidth;
    canvas.height = workingHeight;
    ctx.drawImage(transformCanvas, 0, 0);
  }

  // Step 4: Apply text overlay(s) (if exists and requested)
  if (includeTextOverlay) {
    const overlays = transform?.textOverlays?.length
      ? transform.textOverlays
      : transform?.textOverlay
      ? [transform.textOverlay]
      : [];

    overlays.forEach((overlay) => {
      ctx.save();
      ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.globalAlpha = overlay.opacity;
      ctx.textBaseline = 'top';
      ctx.fillText(overlay.text, overlay.x, overlay.y);
      ctx.restore();
    });
  }

  return canvas;
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

    // Load the image (already EXIF-normalized by main thread)
    const img = await loadImage(blob);
    postMessage({ type: 'progress', progress: 30 } as WorkerResponse);

    // Use UNIFIED render pipeline to get final canvas
    // This applies: rotation -> flip -> filters -> crop -> text overlay
    // in the EXACT same order as main thread renderEditsToCanvas()
    const processedCanvas = renderEditsToOffscreenCanvas(img, options.transform, true);
    
    postMessage({ type: 'progress', progress: 60 } as WorkerResponse);

    // Handle JPEG + Circle Crop: Fill background (no alpha support)
    const outputFormat = options.outputFormat || 'webp';
    let finalCanvas = processedCanvas;
    
    if (outputFormat === 'jpeg' && options.transform?.crop?.shape === 'circle') {
      const jpegCanvas = new OffscreenCanvas(processedCanvas.width, processedCanvas.height);
      const jpegCtx = jpegCanvas.getContext('2d', { alpha: false });
      if (!jpegCtx) throw new Error('Could not get JPEG canvas context');
      
      // Fill with white background
      jpegCtx.fillStyle = '#FFFFFF';
      jpegCtx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
      
      // Draw the processed canvas (with transparent circle) on top
      jpegCtx.drawImage(processedCanvas, 0, 0);
      
      finalCanvas = jpegCanvas;
    }

    // Apply resize if needed (maintaining aspect ratio)
    let outputCanvas = finalCanvas;
    if (options.maxWidth || options.maxHeight) {
      const dimensions = calculateDimensions(
        finalCanvas.width,
        finalCanvas.height,
        options.maxWidth,
        options.maxHeight,
        options.maintainAspectRatio
      );

      if (dimensions.width !== finalCanvas.width || dimensions.height !== finalCanvas.height) {
        const resizedCanvas = new OffscreenCanvas(dimensions.width, dimensions.height);
        const resizedCtx = resizedCanvas.getContext('2d', { alpha: outputFormat !== 'jpeg' });
        if (!resizedCtx) throw new Error('Could not get resize canvas context');

        if (outputFormat === 'jpeg') {
          resizedCtx.fillStyle = '#FFFFFF';
          resizedCtx.fillRect(0, 0, dimensions.width, dimensions.height);
        }

        resizedCtx.imageSmoothingEnabled = true;
        resizedCtx.imageSmoothingQuality = 'high';
        resizedCtx.drawImage(finalCanvas, 0, 0, dimensions.width, dimensions.height);

        outputCanvas = resizedCanvas;
      }
    }

    postMessage({ type: 'progress', progress: 80 } as WorkerResponse);

    // Get output format settings
    const mimeType = getMimeType(outputFormat);
    const extension = getExtension(outputFormat);
    
    // PNG is always lossless, so quality doesn't apply
    const quality = outputFormat === 'png' ? undefined : 
                    options.lossless ? 1 : options.quality / 100;

    // Convert to selected format
    const outputBlob = await outputCanvas.convertToBlob({
      type: mimeType,
      quality,
    });
    postMessage({ type: 'progress', progress: 95 } as WorkerResponse);

    const outputFilename = buildOutputFilename(
      filename,
      extension,
      outputCanvas.width,
      outputCanvas.height,
      options
    );

    // Calculate reduction percentage
    const convertedSize = outputBlob.size;
    const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

    const result: ConvertResult = {
      blob: outputBlob,
      originalSize,
      convertedSize,
      reduction,
      dimensions: {
        width: outputCanvas.width,
        height: outputCanvas.height,
      },
      filename: outputFilename,
    };

    postMessage({ type: 'success', payload: result } as WorkerResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
    postMessage({ type: 'error', error: errorMessage } as WorkerResponse);
  }
};

export {};
