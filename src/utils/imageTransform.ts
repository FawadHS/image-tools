import { ImageTransform } from '../types';

/**
 * TRANSFORM PIPELINE ORDER:
 * 1. ImageEditor: rotation, flip, filters (applied to original image)
 * 2. CropTool: crop area (applied to transformed image from step 1)
 * 3. TextOverlay: text overlay (applied to cropped image from step 2)
 * 
 * Each tool must see the accumulated transforms from previous tools!
 */

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

  return filterArray.length > 0 ? filterArray.join(' ') : 'none';
};

/**
 * Apply transformations to an image and return a canvas with the result
 * This is used by the Web Worker for final conversion
 */
export const applyTransformationsToCanvas = (
  img: HTMLImageElement,
  transform: ImageTransform | undefined
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Step 1: Calculate dimensions after rotation
  const rotation = transform?.rotation || 0;
  const needsDimensionSwap = rotation === 90 || rotation === 270;
  
  let width = img.width;
  let height = img.height;
  
  if (needsDimensionSwap) {
    [width, height] = [height, width];
  }

  // Step 2: Apply crop (if exists) - crop is defined in rotated/flipped space
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = width;
  let sourceHeight = height;

  if (transform?.crop) {
    sourceX = transform.crop.x;
    sourceY = transform.crop.y;
    sourceWidth = transform.crop.width;
    sourceHeight = transform.crop.height;
  }

  // Set canvas size to final dimensions
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  ctx.save();

  // Step 3: Apply rotation and flip
  applyRotationAndFlip(ctx, canvas, transform);

  // Step 4: Apply filters
  ctx.filter = applyFilters(transform);

  // Step 5: Draw the image (with crop applied)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
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

  ctx.filter = 'none';
  ctx.restore();

  // Step 6: Apply text overlay (if exists)
  if (transform?.textOverlay) {
    const overlay = transform.textOverlay;
    
    ctx.save();
    
    // Text coordinates are stored relative to the transformed+cropped image
    ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
    ctx.fillStyle = overlay.color;
    ctx.globalAlpha = overlay.opacity;
    ctx.textBaseline = 'top';
    ctx.fillText(overlay.text, overlay.x, overlay.y);
    
    ctx.restore();
  }

  return canvas;
};

/**
 * Load image from canvas as an HTMLImageElement
 */
export const canvasToImage = (canvas: HTMLCanvasElement): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image from canvas'));
    };
    img.src = canvas.toDataURL();
  });
};
