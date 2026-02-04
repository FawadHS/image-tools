import { getFilenameFromUrl } from '../../src/utils/urlImport';

describe('getFilenameFromUrl', () => {
  it('keeps extension from URL', () => {
    expect(getFilenameFromUrl('https://example.com/test/image.png')).toBe('image.png');
  });

  it('adds extension from content-type when missing', () => {
    expect(getFilenameFromUrl('https://example.com/image', 'image/webp')).toBe('image.webp');
  });
});
