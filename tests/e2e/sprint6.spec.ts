import { test, expect } from '@playwright/test';

const addTestImage = async (page: any, width: number, height: number, name: string) => {
  const dataUrl = await page.evaluate(({ w, h, n }) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#123456';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px Arial';
    ctx.fillText(n, 20, 50);
    return canvas.toDataURL('image/png');
  }, { w: width, h: height, n: name });

  await page.evaluate(async ({ url, filename }) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (!input) throw new Error('File input not found');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { url: dataUrl, filename: `${name}.png` });
};

test.describe('Sprint 6: Format gating and cancel behavior', () => {
  test('disables AVIF/WebP when canvas support is missing', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (type?: string) {
        if (type && (type.includes('image/avif') || type.includes('image/webp'))) {
          return 'data:image/png;base64,AAA';
        }
        return original.call(this, type as any);
      };
    });

    await page.goto('/image-tools/');
    await page.waitForSelector('text=Conversion Settings', { state: 'attached' });

    const avifButton = page.locator('button', { hasText: 'AVIF' }).first();
    const webpButton = page.locator('button', { hasText: 'WebP' }).first();

    await expect(avifButton).toHaveCount(1);
    await expect(webpButton).toHaveCount(1);
    await expect(avifButton).toBeDisabled();
    await expect(webpButton).toBeDisabled();
  });

  test('cancel stops active conversion', async ({ page }) => {
    await page.goto('/image-tools/');
    await page.waitForSelector('input[type="file"]', { state: 'attached' });

    await addTestImage(page, 5000, 5000, 'large-test');

    await page.waitForTimeout(1500);

    await page.click('[data-testid="convert-button"]');
    const cancelButton = page.getByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeVisible();

    await cancelButton.click();

    // Conversion should stop and cancel button should disappear
    await expect(cancelButton).toBeHidden({ timeout: 5000 });

    // Download should not appear immediately after cancel
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeHidden({ timeout: 2000 });
  });
});
