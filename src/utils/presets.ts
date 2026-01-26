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
  // Shopify-specific presets (v3.0)
  'shopify-collection': {
    id: 'shopify-collection',
    name: 'Shopify Collection',
    description: 'Square images for Shopify collection thumbnails',
    quality: 85,
    maxWidth: 600,
    maxHeight: 600,
  },
  'shopify-product-detail': {
    id: 'shopify-product-detail',
    name: 'Shopify Product Detail',
    description: 'High-res images for Shopify product pages with zoom',
    quality: 90,
    maxWidth: 2048,
    maxHeight: 2048,
  },
  // Social media presets
  'social-instagram': {
    id: 'social-instagram',
    name: 'Instagram Square',
    description: 'Square images optimized for Instagram posts',
    quality: 85,
    maxWidth: 1080,
    maxHeight: 1080,
  },
  'social-pinterest': {
    id: 'social-pinterest',
    name: 'Pinterest Pin',
    description: 'Tall images optimized for Pinterest pins',
    quality: 85,
    maxWidth: 1000,
    maxHeight: 1500,
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
