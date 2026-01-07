import JSZip from 'jszip';
import { ConvertResult } from '../types';

/**
 * Format file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Download a single file
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Download multiple files as ZIP
 */
export const downloadAsZip = async (
  results: ConvertResult[],
  zipFilename: string = 'converted-images.zip'
): Promise<void> => {
  const zip = new JSZip();

  results.forEach((result) => {
    zip.file(result.filename, result.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadFile(zipBlob, zipFilename);
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
};

/**
 * Check if file type is supported
 */
export const isSupportedFormat = (file: File): boolean => {
  const supportedExtensions = [
    'heic', 'heif', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'
  ];
  const extension = getFileExtension(file.name);
  return supportedExtensions.includes(extension);
};

/**
 * Create object URL for preview (remember to revoke later)
 */
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke object URL to free memory
 */
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
