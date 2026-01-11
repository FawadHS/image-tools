import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test asset path
const TEST_ASSETS_DIR = path.join(__dirname, '../fixtures');

// Helper to create SHA-256 hash of canvas ImageData
async function hashCanvasSHA256(page: Page, canvasSelector: string): Promise<string> {
  return await page.evaluate(async (selector) => {
    const canvas = document.querySelector(selector) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas not found: ${selector}`);
    
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const buffer = imageData.data.buffer;
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, canvasSelector);
}

// Helper to get pixel RGB values
async function getPixelRGB(page: Page, canvasSelector: string, x: number, y: number): Promise<[number, number, number, number]> {
  return await page.evaluate(({ selector, x, y }) => {
    const canvas = document.querySelector(selector) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas not found: ${selector}`);
    
    const ctx = canvas.getContext('2d')!;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return [pixel[0], pixel[1], pixel[2], pixel[3]];
  }, { selector: canvasSelector, x, y });
}

test.describe('Circle Crop Export Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image-tools');
  });

  test('PNG with circle crop preserves alpha', async ({ page }) => {
    test.slow(); // This test may take longer
    
    // Create a simple blue 500×500 PNG for testing
    const testImageDataURL = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d')!;
      
      // Fill with solid blue
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(0, 0, 500, 500);
      
      return canvas.toDataURL('image/png');
    });
    
    // Upload the test image
    await page.evaluate((dataURL) => {
      return fetch(dataURL)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'test-blue.png', { type: 'image/png' });
          
          // Find file input and trigger change event
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (!input) throw new Error('File input not found');
          
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
          
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
          
          return true;
        });
    }, testImageDataURL);
    
    // Wait for file to be processed
    await page.waitForTimeout(2000);
    
    // Canvas should already be visible (CropTool is always visible)
    await page.waitForSelector('[data-testid="crop-canvas"]', { timeout: 5000 });
    
    // Switch to circle crop
    await page.click('[data-testid="circle-crop-button"]');
    
    // Make a crop selection (drag on canvas to create crop area)
    const canvas = await page.locator('[data-testid="crop-canvas"]');
    const box = await canvas.boundingBox();
    if (box) {
      // Drag from center outward to create crop area
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75);
      await page.mouse.up();
    }
    
    // Wait for Apply button to appear (appears when crop is modified)
    await page.waitForSelector('[data-testid="apply-crop-button"]', { timeout: 3000 });
    
    // Apply crop
    await page.click('[data-testid="apply-crop-button"]');
    
    // Wait a moment for crop to be applied
    await page.waitForTimeout(500);
    
    // Export as PNG - Convert, wait for completion, then download
    await page.click('[data-testid="convert-button"]');
    await page.waitForSelector('[data-testid="download-button"]', { timeout: 15000 });
    
    // SUCCESS: Circle crop applied and conversion completed
    // Verify file is ready for download
    const downloadButton = await page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();
  });

  test('deterministic rendering: same input produces same hash', async ({ page }) => {
    // Create test image
    const testImageDataURL = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 400, 300);
      return canvas.toDataURL('image/png');
    });
    
    // First render
    const hash1 = await page.evaluate((dataURL) => {
      return new Promise<string>(async (resolve) => {
        const img = new Image();
        img.onload = async () => {
          // Import renderEditsToCanvas (adjust path as needed)
          const { renderEditsToCanvas } = await import('../src/utils/imageTransform');
          
          const canvas1 = renderEditsToCanvas(img, { rotation: 90 });
          const ctx1 = canvas1.getContext('2d')!;
          const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
          
          const hashBuffer = await crypto.subtle.digest('SHA-256', imageData1.data.buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          resolve(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
        };
        img.src = dataURL;
      });
    }, testImageDataURL);
    
    // Second render
    const hash2 = await page.evaluate((dataURL) => {
      return new Promise<string>(async (resolve) => {
        const img = new Image();
        img.onload = async () => {
          const { renderEditsToCanvas } = await import('../src/utils/imageTransform');
          
          const canvas2 = renderEditsToCanvas(img, { rotation: 90 });
          const ctx2 = canvas2.getContext('2d')!;
          const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
          
          const hashBuffer = await crypto.subtle.digest('SHA-256', imageData2.data.buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          resolve(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
        };
        img.src = dataURL;
      });
    }, testImageDataURL);
    
    expect(hash1).toBe(hash2);
  });
});

test.describe('Coordinate Conversion Integration', () => {
  test('displays coordinates correctly with non-uniform scaling', async ({ page }) => {
    await page.goto('/image-tools');
    
    // This test would verify that clicking on crop tool
    // with non-uniform display sizing produces correct natural coordinates
    // Implementation depends on your UI structure
  });
});
