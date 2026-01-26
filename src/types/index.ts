export type OutputFormat = 'webp' | 'jpeg' | 'png' | 'avif';

export interface ImageTransform {
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
    shape?: 'rectangle' | 'circle'; // Shape of crop (default: rectangle)
  };
  filters?: {
    brightness: number; // 0-200, default 100
    contrast: number; // 0-200, default 100
    saturation: number; // 0-200, default 100
    grayscale: boolean;
    sepia: boolean;
  };
  textOverlay?: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
  };
}

export interface ConvertOptions {
  quality: number;
  lossless: boolean;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio: boolean;
  stripMetadata: boolean;
  preset?: PresetType;
  outputFormat: OutputFormat;  // File naming options
  namePrefix?: string;
  nameSuffix?: string;
  addTimestamp?: boolean;
  addDimensions?: boolean;
  // Transform passed at conversion time (merged from file)
  transform?: ImageTransform;
}

export interface SelectedFile {
  id: string;
  file: File;
  preview: string;
  // Browser-displayable preview (converted from HEIC if needed)
  // All UI components should use this for display
  displayPreview?: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  result?: ConvertResult;
  error?: string;
  selected?: boolean; // For selective conversion
  // Image-specific transformations (stored per-file)
  transform?: ImageTransform;
}

export interface ConvertResult {
  blob: Blob;
  originalSize: number;
  convertedSize: number;
  reduction: number;
  dimensions: { width: number; height: number };
  filename: string;
}

export type PresetType =
  | 'ecommerce-product'
  | 'ecommerce-thumbnail'
  | 'hero-banner'
  | 'blog-content'
  | 'background'
  | 'shopify-collection'
  | 'shopify-product-detail'
  | 'social-instagram'
  | 'social-pinterest'
  | 'custom';

export interface Preset {
  id: PresetType;
  name: string;
  description: string;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}
