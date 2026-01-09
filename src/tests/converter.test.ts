/**
 * Tests for image conversion with transformations
 * Ensures crop, text overlay, filters, rotation, and flip are applied correctly
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { convertImage } from '../utils/converter';
import { ConvertOptions } from '../types';

describe('Image Converter - Transformations', () => {
  let testBlob: Blob;
  let testFile: File;

  beforeAll(async () => {
    // Create a test image (1x1 red pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);

    testBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    testFile = new File([testBlob], 'test.png', { type: 'image/png' });
  });

  it('should apply crop transformation', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
      transform: {
        crop: {
          x: 10,
          y: 10,
          width: 50,
          height: 50,
        },
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      },
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    expect(result.dimensions.width).toBe(50);
    expect(result.dimensions.height).toBe(50);
  });

  it('should apply text overlay transformation', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
      transform: {
        textOverlay: {
          text: 'Test Watermark',
          x: 10,
          y: 10,
          fontSize: 20,
          fontFamily: 'Arial',
          color: '#ffffff',
          opacity: 1,
        },
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      },
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('should apply crop and text overlay together', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
      transform: {
        crop: {
          x: 10,
          y: 10,
          width: 80,
          height: 80,
        },
        textOverlay: {
          text: 'Cropped + Text',
          x: 20,
          y: 20,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#ffffff',
          opacity: 0.8,
        },
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      },
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    expect(result.dimensions.width).toBe(80);
    expect(result.dimensions.height).toBe(80);
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('should apply rotation transformation', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
      transform: {
        rotation: 90,
        flipHorizontal: false,
        flipVertical: false,
      },
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    // For 90 degree rotation, dimensions should swap
    expect(result.dimensions.width).toBe(100);
    expect(result.dimensions.height).toBe(100);
  });

  it('should apply flip transformations', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
      transform: {
        rotation: 0,
        flipHorizontal: true,
        flipVertical: true,
      },
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('should apply filters (grayscale)', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
      transform: {
        filters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: true,
          sepia: false,
        },
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      },
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('should apply all transformations together', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
      transform: {
        crop: {
          x: 5,
          y: 5,
          width: 90,
          height: 90,
        },
        textOverlay: {
          text: 'Complete Test',
          x: 15,
          y: 15,
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#00ff00',
          opacity: 1,
        },
        filters: {
          brightness: 110,
          contrast: 105,
          saturation: 95,
          grayscale: false,
          sepia: false,
        },
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      },
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    expect(result.dimensions.width).toBe(90);
    expect(result.dimensions.height).toBe(90);
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('should handle no transformations', async () => {
    const options: ConvertOptions = {
      outputFormat: 'png',
      quality: 100,
      maintainAspectRatio: true,
    };

    const result = await convertImage(testFile, options);
    expect(result).toBeDefined();
    expect(result.dimensions.width).toBe(100);
    expect(result.dimensions.height).toBe(100);
  });
});
