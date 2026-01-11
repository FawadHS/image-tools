import { describe, test, expect } from '@jest/globals';
import {
  displayToNatural,
  clampCropRect,
  computeWorkingDimensionsAfterRotation,
  computeAspectRatio,
  applyAspectRatio,
  calculateCanvasScales,
  type CropRect,
} from '../../src/utils/mathHelpers';

describe('displayToNatural coordinate conversion', () => {
  test('uniform scaling (square container)', () => {
    // Natural: 4000×3000, Display rect: 400×300
    // Click at (100, 100) display
    const rect = new DOMRect(0, 0, 400, 300);
    
    const result = displayToNatural(100, 100, rect, 4000, 3000);
    
    expect(result.x).toBe(1000);
    expect(result.y).toBe(1000);
  });

  test('non-uniform scaling (letterboxed/constrained)', () => {
    // Natural: 1000×800, Display rect: 400×250 (rounding or constraint)
    // This tests the critical scaleX ≠ scaleY case
    const rect = new DOMRect(0, 0, 400, 250);
    
    const result = displayToNatural(200, 100, rect, 1000, 800);
    
    // scaleX = 1000/400 = 2.5, scaleY = 800/250 = 3.2
    expect(result.x).toBe(500);  // 200 * 2.5
    expect(result.y).toBe(320);  // 100 * 3.2
    
    // Prove non-uniform case
    const scaleX = 1000 / 400;
    const scaleY = 800 / 250;
    expect(scaleX).not.toBe(scaleY);
  });
  
  test('offset container (scrolled/positioned)', () => {
    // Natural: 2000×1500, Display rect at (50, 30) with 400×300 size
    const rect = new DOMRect(50, 30, 400, 300);
    
    // Mouse at screen position (150, 130) = display position (100, 100) relative to container
    const result = displayToNatural(150, 130, rect, 2000, 1500);
    
    // scaleX = 2000/400 = 5, scaleY = 1500/300 = 5
    expect(result.x).toBe(500);  // (150-50) * 5
    expect(result.y).toBe(500);  // (130-30) * 5
  });
  
  test('extreme non-uniform scaling', () => {
    // Natural: 3000×1000, Display: 300×500 (very different aspect ratios)
    const rect = new DOMRect(0, 0, 300, 500);
    
    const result = displayToNatural(150, 250, rect, 3000, 1000);
    
    // scaleX = 3000/300 = 10, scaleY = 1000/500 = 2
    expect(result.x).toBe(1500);  // 150 * 10
    expect(result.y).toBe(500);   // 250 * 2
  });
});

describe('crop clamping', () => {
  test('clamps crop extending beyond bounds', () => {
    const crop: CropRect = { x: 900, y: 700, width: 200, height: 200 };
    
    const result = clampCropRect(crop, 1000, 800);
    
    expect(result).toEqual({ x: 900, y: 700, width: 100, height: 100 });
  });
  
  test('ensures minimum 1×1 crop', () => {
    const crop: CropRect = { x: 1000, y: 800, width: 0, height: 0 };
    
    const result = clampCropRect(crop, 1000, 800);
    
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });
  
  test('clamps negative coordinates to 0', () => {
    const crop: CropRect = { x: -50, y: -30, width: 100, height: 100 };
    
    const result = clampCropRect(crop, 1000, 800);
    
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });
  
  test('handles crop entirely outside bounds (x beyond width)', () => {
    const crop: CropRect = { x: 1100, y: 100, width: 100, height: 100 };
    
    const result = clampCropRect(crop, 1000, 800);
    
    // x clamped to maxWidth-1, width clamped to 1
    expect(result.x).toBe(999);
    expect(result.width).toBe(1);
  });
  
  test('handles crop entirely outside bounds (y beyond height)', () => {
    const crop: CropRect = { x: 100, y: 900, width: 100, height: 100 };
    
    const result = clampCropRect(crop, 1000, 800);
    
    // y clamped to maxHeight-1, height clamped to 1
    expect(result.y).toBe(799);
    expect(result.height).toBe(1);
  });
  
  test('preserves valid crop within bounds', () => {
    const crop: CropRect = { x: 100, y: 100, width: 400, height: 300 };
    
    const result = clampCropRect(crop, 1000, 800);
    
    expect(result).toEqual({ x: 100, y: 100, width: 400, height: 300 });
  });
});

describe('rotation dimension swap', () => {
  test('90° rotation swaps dimensions', () => {
    const result = computeWorkingDimensionsAfterRotation(1000, 800, 90);
    
    expect(result).toEqual({ width: 800, height: 1000 });
  });
  
  test('180° rotation keeps dimensions', () => {
    const result = computeWorkingDimensionsAfterRotation(1000, 800, 180);
    
    expect(result).toEqual({ width: 1000, height: 800 });
  });
  
  test('270° rotation swaps dimensions', () => {
    const result = computeWorkingDimensionsAfterRotation(1000, 800, 270);
    
    expect(result).toEqual({ width: 800, height: 1000 });
  });
  
  test('0° rotation keeps dimensions', () => {
    const result = computeWorkingDimensionsAfterRotation(1000, 800, 0);
    
    expect(result).toEqual({ width: 1000, height: 800 });
  });
});

describe('aspect ratio calculations', () => {
  test('computes aspect ratio correctly', () => {
    expect(computeAspectRatio(1600, 900)).toBeCloseTo(16/9, 5);
    expect(computeAspectRatio(1920, 1080)).toBeCloseTo(16/9, 5);
    expect(computeAspectRatio(1000, 1000)).toBe(1);
  });
  
  test('handles zero height gracefully', () => {
    expect(computeAspectRatio(1000, 0)).toBe(1);
  });
  
  test('applies aspect ratio constraint (width mode)', () => {
    const result = applyAspectRatio(1600, 900, 16/9, 'width');
    
    expect(result.width).toBe(1600);
    expect(result.height).toBeCloseTo(900, 0);
  });
  
  test('applies aspect ratio constraint (height mode)', () => {
    const result = applyAspectRatio(1600, 900, 16/9, 'height');
    
    expect(result.height).toBe(900);
    expect(result.width).toBeCloseTo(1600, 0);
  });
});

describe('canvas scale calculations', () => {
  test('calculates uniform scales', () => {
    const result = calculateCanvasScales(400, 300, 4000, 3000);
    
    expect(result.scaleX).toBe(0.1);
    expect(result.scaleY).toBe(0.1);
  });
  
  test('calculates non-uniform scales', () => {
    const result = calculateCanvasScales(400, 250, 1000, 800);
    
    expect(result.scaleX).toBe(0.4);   // 400/1000
    expect(result.scaleY).toBe(0.3125); // 250/800
    expect(result.scaleX).not.toBe(result.scaleY);
  });
  
  test('handles 1:1 scaling', () => {
    const result = calculateCanvasScales(1000, 800, 1000, 800);
    
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });
});
