import { ImageTransform } from '../types';

/**
 * Apply transformations to an image and return a canvas with the result
 * 
 * NEW SIMPLIFIED APPROACH:
 * - Text overlay coordinates are stored relative to the ORIGINAL image
 * - When crop is applied, text coordinates are adjusted by subtracting crop offset
 * - This matches how the tools work: each tool sees the "current" image state
 */
export const applyTransformationsToCanvas = (
  img: HTMLImageElement,
  transform: ImageTransform | undefined
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Step 1: Apply crop (if exists)
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

  // Set canvas size to cropped dimensions
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  // Step 2: Draw the image (with crop applied)
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

  // Step 3: Apply filters (if exists)
  if (transform?.filters) {
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

    if (filterArray.length > 0) {
      ctx.filter = filterArray.join(' ');
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }
  }

  // Step 4: Apply text overlay (if exists)
  // Text coordinates are in ORIGINAL image space, so subtract crop offset
  if (transform?.textOverlay) {
    const overlay = transform.textOverlay;
    
    ctx.save();
    
    // Adjust text position: subtract crop offset to get position on cropped canvas
    let textX = overlay.x;
    let textY = overlay.y;
    
    if (transform.crop) {
      textX = overlay.x - transform.crop.x;
      textY = overlay.y - transform.crop.y;
    }
    
    // Draw text
    ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
    ctx.fillStyle = overlay.color;
    ctx.globalAlpha = overlay.opacity;
    ctx.textBaseline = 'top';
    ctx.fillText(overlay.text, textX, textY);
    
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
