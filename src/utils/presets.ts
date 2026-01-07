import { Preset, PresetType } from '../types';

export const presets: Record<PresetType, Preset> = {
  'ecommerce-product': {
    id: 'ecommerce-product',
    name: 'E-commerce Product',
    description: 'High quality for product images with zoom detail',
    quality: 85,
    maxWidth: 1200,
    maxHeight: 1200,
  },
  'ecommerce-thumbnail': {
    id: 'ecommerce-thumbnail',
    name: 'E-commerce Thumbnail',
    description: 'Optimized for product listings and category grids',
    quality: 70,
    maxWidth: 400,
    maxHeight: 400,
  },
  'hero-banner': {
    id: 'hero-banner',
    name: 'Hero Banner',
    description: 'High quality for homepage banners and featured images',
    quality: 90,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  'blog-content': {
    id: 'blog-content',
    name: 'Blog / Content',
    description: 'Balanced quality for articles and blog posts',
    quality: 75,
    maxWidth: 800,
    maxHeight: 800,
  },
  'background': {
    id: 'background',
    name: 'Background',
    description: 'Lower quality for decorative backgrounds',
    quality: 60,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  'custom': {
    id: 'custom',
    name: 'Custom',
    description: 'Set your own quality and dimensions',
    quality: 80,
  },
};

export const getPreset = (id: PresetType): Preset => {
  return presets[id] || presets['custom'];
};

export const presetList = Object.values(presets);
