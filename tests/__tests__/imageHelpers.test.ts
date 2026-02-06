import { getExtension, getMimeType, getRecommendedQuality, getQualityPresetsForFormat } from '../../src/utils/imageHelpers';
import { OutputFormat } from '../../src/types';

describe('imageHelpers format helpers', () => {
  const formats: OutputFormat[] = ['webp', 'jpeg', 'png', 'png8', 'avif', 'tiff', 'jxl'];

  it('maps extensions for all formats', () => {
    const expected: Record<OutputFormat, string> = {
      webp: '.webp',
      jpeg: '.jpg',
      png: '.png',
      png8: '.png',
      avif: '.avif',
      tiff: '.tif',
      jxl: '.jxl',
    };
    formats.forEach((format) => {
      expect(getExtension(format)).toBe(expected[format]);
    });
  });

  it('maps MIME types for all formats', () => {
    const expected: Record<OutputFormat, string> = {
      webp: 'image/webp',
      jpeg: 'image/jpeg',
      png: 'image/png',
      png8: 'image/png',
      avif: 'image/avif',
      tiff: 'image/tiff',
      jxl: 'image/jxl',
    };
    formats.forEach((format) => {
      expect(getMimeType(format)).toBe(expected[format]);
    });
  });

  it('returns recommended quality in valid range', () => {
    formats.forEach((format) => {
      const quality = getRecommendedQuality(format);
      expect(quality).toBeGreaterThanOrEqual(1);
      expect(quality).toBeLessThanOrEqual(100);
    });
  });

  it('provides format quality presets for lossy formats', () => {
    const lossyFormats: OutputFormat[] = ['webp', 'jpeg', 'png8', 'avif', 'jxl'];
    lossyFormats.forEach((format) => {
      const presets = getQualityPresetsForFormat(format);
      expect(presets.length).toBe(3);
      presets.forEach((preset) => {
        expect(preset.value).toBeGreaterThanOrEqual(1);
        expect(preset.value).toBeLessThanOrEqual(100);
      });
    });
    expect(getQualityPresetsForFormat('png')).toHaveLength(0);
    expect(getQualityPresetsForFormat('tiff')).toHaveLength(0);
  });
});
