export type OutputFormat = 'webp' | 'jpeg' | 'png' | 'avif';

export interface ConvertOptions {
  quality: number;
  lossless: boolean;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio: boolean;
  stripMetadata: boolean;
  preset?: PresetType;
  outputFormat: OutputFormat;
}

export interface SelectedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  result?: ConvertResult;
  error?: string;
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
  | 'custom';

export interface Preset {
  id: PresetType;
  name: string;
  description: string;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}
