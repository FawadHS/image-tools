/**
 * Pure mathematical helper functions for image transformations
 * These functions have no side effects and are easy to unit test
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Convert display coordinates (CSS pixels) to natural pixel coordinates
 * Handles non-uniform scaling when canvas display size differs from natural size
 * 
 * @param displayX - Mouse X position in CSS pixels
 * @param displayY - Mouse Y position in CSS pixels
 * @param rect - Canvas bounding rect from getBoundingClientRect()
 * @param naturalWidth - Image natural width in pixels
 * @param naturalHeight - Image natural height in pixels
 * @returns Natural pixel coordinates
 */
export function displayToNatural(
  displayX: number,
  displayY: number,
  rect: DOMRect,
  naturalWidth: number,
  naturalHeight: number
): Coordinates {
  // Use separate scales to handle non-square scaling (letterboxing, rounding)
  const scaleX = naturalWidth / rect.width;
  const scaleY = naturalHeight / rect.height;
  
  return {
    x: (displayX - rect.left) * scaleX,
    y: (displayY - rect.top) * scaleY,
  };
}

/**
 * Clamp crop rectangle to stay within image bounds
 * Ensures minimum 1×1 crop size
 * 
 * @param crop - Proposed crop rectangle
 * @param maxWidth - Maximum width (image width)
 * @param maxHeight - Maximum height (image height)
 * @returns Clamped crop rectangle
 */
export function clampCropRect(
  crop: CropRect,
  maxWidth: number,
  maxHeight: number
): CropRect {
  const x = Math.max(0, Math.min(crop.x, maxWidth - 1));
  const y = Math.max(0, Math.min(crop.y, maxHeight - 1));
  
  // Ensure crop doesn't extend beyond image bounds
  const availableWidth = maxWidth - x;
  const availableHeight = maxHeight - y;
  
  const width = Math.max(1, Math.min(crop.width, availableWidth));
  const height = Math.max(1, Math.min(crop.height, availableHeight));
  
  return { x, y, width, height };
}

/**
 * Compute dimensions after rotation
 * 90° and 270° rotations swap width/height
 * 
 * @param width - Original width
 * @param height - Original height
 * @param rotation - Rotation angle in degrees (0, 90, 180, 270)
 * @returns Dimensions after rotation
 */
export function computeWorkingDimensionsAfterRotation(
  width: number,
  height: number,
  rotation: number
): Dimensions {
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

/**
 * Compute aspect ratio from width and height
 * 
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns Aspect ratio (width / height)
 */
export function computeAspectRatio(width: number, height: number): number {
  return height > 0 ? width / height : 1;
}

/**
 * Apply aspect ratio constraint to dimensions
 * 
 * @param width - Current width
 * @param height - Current height
 * @param targetRatio - Target aspect ratio (width/height)
 * @param mode - 'width' to adjust height, 'height' to adjust width
 * @returns Constrained dimensions
 */
export function applyAspectRatio(
  width: number,
  height: number,
  targetRatio: number,
  mode: 'width' | 'height' = 'width'
): Dimensions {
  if (mode === 'width') {
    return { width, height: width / targetRatio };
  } else {
    return { width: height * targetRatio, height };
  }
}

/**
 * Calculate canvas scale factors for rendering
 * Returns separate X and Y scales to handle non-uniform display sizing
 * 
 * @param canvasWidth - Canvas element width in pixels
 * @param canvasHeight - Canvas element height in pixels
 * @param naturalWidth - Image natural width
 * @param naturalHeight - Image natural height
 * @returns Scale factors for X and Y
 */
export function calculateCanvasScales(
  canvasWidth: number,
  canvasHeight: number,
  naturalWidth: number,
  naturalHeight: number
): { scaleX: number; scaleY: number } {
  return {
    scaleX: canvasWidth / naturalWidth,
    scaleY: canvasHeight / naturalHeight,
  };
}
