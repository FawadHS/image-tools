import { ImageTransform } from '../types';

/**
 * Apply transformations to an image and return a canvas with the result
 */
export const applyTransformationsToCanvas = (
  img: HTMLImageElement,
  transform: ImageTransform | undefined,
  excludeCrop: boolean = false,
  excludeText: boolean = false
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Determine source dimensions (with or without crop)
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;

  if (!excludeCrop && transform?.crop) {
    sourceX = transform.crop.x;
    sourceY = transform.crop.y;
    sourceWidth = transform.crop.width;
    sourceHeight = transform.crop.height;
  }

  // Set canvas size
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  // Apply rotation transformation
  ctx.save();
  if (transform?.rotation) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
  }

  // Apply flip transformations
  if (transform?.flipHorizontal || transform?.flipVertical) {
    const scaleX = transform.flipHorizontal ? -1 : 1;
    const scaleY = transform.flipVertical ? -1 : 1;
    const translateX = transform.flipHorizontal ? canvas.width : 0;
    const translateY = transform.flipVertical ? canvas.height : 0;
    ctx.translate(translateX, translateY);
    ctx.scale(scaleX, scaleY);
  }

  // Draw the image
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

  ctx.restore();

  // Apply filters
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

  // Apply text overlay
  if (!excludeText && transform?.textOverlay) {
    const overlay = transform.textOverlay;
    
    ctx.save();
    
    // Calculate text position based on crop state
    let textX = overlay.x;
    let textY = overlay.y;
    
    // If crop is applied (not excluded), adjust text position relative to crop area
    if (!excludeCrop && transform?.crop) {
      textX = overlay.x - transform.crop.x;
      textY = overlay.y - transform.crop.y;
    }
    
    // Scale font size based on canvas dimensions
    const scaleFactor = canvas.width / (excludeCrop ? img.width : sourceWidth);
    ctx.font = `${overlay.fontSize * scaleFactor}px ${overlay.fontFamily}`;
    ctx.fillStyle = overlay.color;
    ctx.globalAlpha = overlay.opacity;
    ctx.textBaseline = 'top';
    
    // Apply scaled position
    ctx.fillText(overlay.text, textX * scaleFactor, textY * scaleFactor);
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
