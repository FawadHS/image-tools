/**
 * Image Tools - React Component Library
 * Privacy-first image conversion & editing tool
 * 
 * @packageDocumentation
 */

export { ImageTools } from './ImageTools';
export type { ImageToolsProps } from './ImageTools';

// Export context providers for advanced usage
export { ConverterProvider, useConverter } from '../context/ConverterContext';
export { ThemeProvider, useTheme } from '../context/ThemeContext';

// Export types for TypeScript users
export type {
  SelectedFile,
  OutputFormat,
  ImageTransform,
  ConvertOptions,
  PresetType,
} from '../types';

// Export utility functions
export {
  formatFileSize,
  downloadFile,
  downloadAsZip,
} from '../utils/fileUtils';

export {
  getPreset,
  presetList,
} from '../utils/presets';
