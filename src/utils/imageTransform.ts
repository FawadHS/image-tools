import { ImageTransform } from '../types';

// Runtime debug flag - enable in production browser console:
// localStorage.setItem('DEBUG_RENDER', 'true')
const DEBUG_RENDER = typeof window !== 'undefined' && 
                     typeof localStorage !== 'undefined' &&
                     localStorage.getItem('DEBUG_RENDER') === 'true';

/**
 * UNIFIED TRANSFORM PIPELINE - SINGLE SOURCE OF TRUTH
 * 
 * This is the ONLY function that applies image transformations.
 * It is used by:
 * - Preview rendering (CropTool, TextOverlayTool)
 * - Export/Conversion (converter.ts)
 * 
 * TRANSFORMATION ORDER (CRITICAL - DO NOT CHANGE):
 * 1. Normalize EXIF orientation (phone/WhatsApp images)
 * 2. Apply rotation (user-defined)
 * 3. Apply flip (horizontal/vertical)
 * 4. Apply filters (brightness, contrast, etc.)
 * 5. Apply crop (cuts the final region)
 * 6. Apply text overlay (optional)
 * 
 * This ensures preview and export produce IDENTICAL output.
 */

/**
 * Detect and extract EXIF orientation from image blob
 * Returns orientation value (1-8) as per EXIF spec
 */
const getExifOrientation = async (blob: Blob): Promise<number> => {
  try {
    // Read first 64KB which contains EXIF data
    const buffer = await blob.slice(0, 65536).arrayBuffer();
    const view = new DataView(buffer);
    
    // Check for JPEG signature
    if (view.getUint16(0) !== 0xFFD8) return 1;
    
    let offset = 2;
    while (offset < view.byteLength) {
      const marker = view.getUint16(offset);
      offset += 2;
      
      // Check for APP1 (EXIF) marker
      if (marker === 0xFFE1) {
        // Check for "Exif" signature
        if (view.getUint32(offset + 2) !== 0x45786966) return 1;
        
        // Get byte order
        const tiffOffset = offset + 6;
        const littleEndian = view.getUint16(tiffOffset) === 0x4949;
        offset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
        
        // Read IFD entries
        const tags = view.getUint16(offset, littleEndian);
        offset += 2;
        
        for (let i = 0; i < tags; i++) {
          const tag = view.getUint16(offset + i * 12, littleEndian);
          if (tag === 0x0112) { // Orientation tag
            return view.getUint16(offset + i * 12 + 8, littleEndian);
          }
        }
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += view.getUint16(offset);
      }
    }
  } catch (e) {
    console.warn('Failed to read EXIF orientation:', e);
  }
  return 1; // Default orientation
};

/**
 * Load and normalize image with EXIF orientation applied
 * This ensures phone/WhatsApp images display correctly
 */
export const loadImageWithExif = async (blob: Blob): Promise<HTMLImageElement> => {
  const orientation = await getExifOrientation(blob);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = async () => {
      URL.revokeObjectURL(url);
      
      // If orientation is 1 (normal), return as-is
      if (orientation === 1) {
        resolve(img);
        return;
      }
      
      // Normalize orientation by drawing to canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img);
        return;
      }
      
      // Calculate dimensions after orientation correction
      if (orientation >= 5 && orientation <= 8) {
        // Orientations 5-8 require dimension swap
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      ctx.save();
      
      // Apply orientation transforms
      switch (orientation) {
        case 2:
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          break;
        case 3:
          ctx.translate(canvas.width, canvas.height);
          ctx.rotate(Math.PI);
          break;
        case 4:
          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);
          break;
        case 5:
          ctx.rotate(0.5 * Math.PI);
          ctx.scale(1, -1);
          break;
        case 6:
          ctx.rotate(0.5 * Math.PI);
          ctx.translate(0, -canvas.height);
          break;
        case 7:
          ctx.rotate(0.5 * Math.PI);
          ctx.translate(canvas.width, -canvas.height);
          ctx.scale(-1, 1);
          break;
        case 8:
          ctx.rotate(-0.5 * Math.PI);
          ctx.translate(-canvas.width, 0);
          break;
      }
      
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      
      // Convert canvas back to image
      const normalizedImg = new Image();
      normalizedImg.onload = () => resolve(normalizedImg);
      normalizedImg.onerror = () => resolve(img); // Fallback to original
      normalizedImg.src = canvas.toDataURL();
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Apply rotation and flip transforms to a canvas context
 * This is used by ALL tools to ensure they see the same transformed image
 */
export const applyRotationAndFlip = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  transform: ImageTransform | undefined
) => {
  if (!transform) return;

  const { rotation = 0, flipHorizontal = false, flipVertical = false } = transform;

  // Apply rotation
  if (rotation !== 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // Apply flips
  if (flipHorizontal || flipVertical) {
    const scaleX = flipHorizontal ? -1 : 1;
    const scaleY = flipVertical ? -1 : 1;
    const translateX = flipHorizontal ? -canvas.width : 0;
    const translateY = flipVertical ? -canvas.height : 0;
    
    ctx.translate(translateX, translateY);
    ctx.scale(scaleX, scaleY);
  }
};

/**
 * Apply filter transforms to a canvas context
 * Returns the filter string to be applied to ctx.filter
 */
export const applyFilters = (
  transform: ImageTransform | undefined
): string => {
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
  ctx: CanvasRenderingContext2D,
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
  ctx: CanvasRenderingContext2D,
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
 * UNIFIED RENDER PIPELINE - SINGLE SOURCE OF TRUTH
 * 
 * This function applies ALL transformations in the correct order and returns
 * a canvas with the final processed pixels. This SAME canvas is used for:
 * - Preview rendering (what user sees in UI)
 * - Export/conversion (what gets saved to file)
 * 
 * This guarantees preview and export are IDENTICAL.
 * 
 * @param img - Image element (already EXIF-normalized)
 * @param transform - All transformations to apply
 * @param includeTextOverlay - Whether to bake text overlay into output (default: true for export, false for preview)
 * @returns Canvas with final processed pixels
 */
export const renderEditsToCanvas = (
  img: HTMLImageElement,
  transform: ImageTransform | undefined,
  includeTextOverlay: boolean = true
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Could not get canvas context');

  if (DEBUG_RENDER) {
    console.group('🎨 Render Pipeline');
    console.log('Original dimensions:', { 
      w: img.naturalWidth || img.width, 
      h: img.naturalHeight || img.height 
    });
    console.log('Rotation:', transform?.rotation || 0);
    console.log('Flip:', { 
      h: transform?.flipHorizontal || false, 
      v: transform?.flipVertical || false 
    });
  }

  // Step 1: Calculate dimensions after rotation
  const rotation = transform?.rotation || 0;
  const normalized = ((rotation % 360) + 360) % 360;

  let workingWidth = img.naturalWidth || img.width;
  let workingHeight = img.naturalHeight || img.height;

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

  if (DEBUG_RENDER) {
    console.log('Working dimensions (after rotation):', { w: workingWidth, h: workingHeight });
  }

  // Step 2: Create canvas for rotation + flip + filters
  // This is the "transformed" image before crop
  const transformCanvas = document.createElement('canvas');
  transformCanvas.width = workingWidth;
  transformCanvas.height = workingHeight;
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

  // Apply filters
  transformCtx.filter = applyFilters(transform);

  // Draw original image with transforms
  transformCtx.drawImage(
    img,
    -(img.naturalWidth || img.width) / 2,
    -(img.naturalHeight || img.height) / 2
  );

  transformCtx.filter = 'none';
  transformCtx.restore();

  applyAdvancedAdjustments(transformCtx, transformCanvas.width, transformCanvas.height, transform);

  // Step 3: Apply crop (if exists)
  // Crop coordinates are in natural pixel space of the TRANSFORMED image
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
      // For circle crops, create circular clip path
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
      
      if (DEBUG_RENDER) {
        console.log('Circle crop applied', { 
          radius: Math.min(cropWidth, cropHeight) / 2 
        });
      }
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
    
    if (DEBUG_RENDER) {
      console.log('Crop applied:', { 
        x: cropX, y: cropY, 
        width: cropWidth, height: cropHeight,
        shape: crop.shape || 'rectangle'
      });
    }
  } else {
    // No crop - use full transformed image
    canvas.width = workingWidth;
    canvas.height = workingHeight;
    ctx.drawImage(transformCanvas, 0, 0);
  }

  // Step 4: Apply text overlay(s) (if exists and requested)
  // Text coordinates are relative to the FINAL canvas (after crop)
  if (includeTextOverlay) {
    const overlays = transform?.textOverlays?.length
      ? transform.textOverlays
      : transform?.textOverlay
      ? [transform.textOverlay]
      : [];

    if (overlays.length > 0) {
      overlays.forEach((overlay) => {
        ctx.save();
        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
        ctx.fillStyle = overlay.color;
        ctx.globalAlpha = overlay.opacity;
        ctx.textBaseline = 'top';
        ctx.fillText(overlay.text, overlay.x, overlay.y);
        ctx.restore();

        if (DEBUG_RENDER) {
          console.log('Text overlay applied:', overlay.text);
        }
      });
    }
  }

  if (DEBUG_RENDER) {
    console.log('Final dimensions:', { w: canvas.width, h: canvas.height });
    console.groupEnd();
  }

  return canvas;
};

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use renderEditsToCanvas instead
 */
export const applyTransformationsToCanvas = (
  img: HTMLImageElement,
  transform: ImageTransform | undefined
): HTMLCanvasElement => {
  return renderEditsToCanvas(img, transform, true);
};

/**
 * Load image from canvas as an HTMLImageElement
 */
export const canvasToImage = (canvas: HTMLCanvasElement): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image from canvas'));    img.src = canvas.toDataURL();
  });
};
