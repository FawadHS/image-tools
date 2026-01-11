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

  return filterArray.length > 0 ? filterArray.join(' ') : 'none';
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
  const needsDimensionSwap = rotation === 90 || rotation === 270;
  
  let workingWidth = img.width;
  let workingHeight = img.height;
  
  if (needsDimensionSwap) {
    [workingWidth, workingHeight] = [workingHeight, workingWidth];
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

  // Step 4: Apply text overlay (if exists and requested)
  if (includeTextOverlay && transform?.textOverlay) {
    const overlay = transform.textOverlay;
    
    ctx.save();
    ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
    ctx.fillStyle = overlay.color;
    ctx.globalAlpha = overlay.opacity;
    ctx.textBaseline = 'top';
    ctx.fillText(overlay.text, overlay.x, overlay.y);
    ctx.restore();
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
    // This applies: rotation → flip → filters → crop → text overlay
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
