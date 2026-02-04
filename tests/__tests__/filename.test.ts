import { buildOutputFilename } from '../../src/utils/filename';
import { ConvertOptions } from '../../src/types';

const baseOptions: ConvertOptions = {
  quality: 80,
  lossless: false,
  maintainAspectRatio: true,
  stripMetadata: true,
  outputFormat: 'webp',
  namePrefix: '',
  nameSuffix: '',
  addTimestamp: false,
  addDimensions: false,
  addSequence: false,
  renameSequenceStart: 1,
  renameSequencePad: 0,
  renamePattern: '{prefix}{name}{suffix}{timestamp}{dimensions}{seq}',
};

describe('buildOutputFilename', () => {
  it('applies default pattern with prefix, suffix, dimensions, and sequence', () => {
    const options: ConvertOptions = {
      ...baseOptions,
      namePrefix: 'shop_',
      nameSuffix: '_hero',
      addDimensions: true,
      addSequence: true,
      renameSequencePad: 2,
      renameSequence: 3,
    };

    const filename = buildOutputFilename('photo.jpg', '.webp', 800, 600, options);
    expect(filename).toBe('shop_photo_hero_800x600_03.webp');
  });

  it('respects ext tokens without double extension', () => {
    const options: ConvertOptions = {
      ...baseOptions,
      renamePattern: '{name}.{ext}',
    };

    const filename = buildOutputFilename('image.png', '.webp', 1000, 1000, options);
    expect(filename).toBe('image.webp');
  });
});
