import React, { useEffect } from 'react';
import { ConverterProvider, useConverter } from '../context/ConverterContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ImageToolsPage } from '../pages/ImageToolsPage';
import { OutputFormat, SelectedFile } from '../types';

/**
 * Props for the ImageTools component
 */
export interface ImageToolsProps {
  /**
   * Theme mode: 'light', 'dark', or 'system' (follows OS preference)
   * @default 'system'
   */
  theme?: 'light' | 'dark' | 'system';
  
  /**
   * Maximum number of files that can be uploaded at once
   * @default 50
   */
  maxFiles?: number;
  
  /**
   * Default output format for conversions
   * @default 'webp'
   */
  defaultFormat?: OutputFormat;
  
  /**
   * Default quality setting (1-100)
   * @default 85
   */
  defaultQuality?: number;
  
  /**
   * Callback fired when conversion is complete
   * @param files - Array of converted files with names and blobs
   */
  onConversionComplete?: (files: Array<{ name: string; blob: Blob; originalName: string }>) => void;
  
  /**
   * Callback fired when files are selected/uploaded
   * @param count - Number of files selected
   */
  onFilesSelected?: (count: number) => void;
  
  /**
   * Custom CSS class for the container
   */
  className?: string;
  
  /**
   * Enable/disable specific features
   */
  features?: {
    crop?: boolean;
    rotate?: boolean;
    filters?: boolean;
    textOverlay?: boolean;
    comparison?: boolean;
    history?: boolean;
  };
}

interface ConvertedFile extends SelectedFile {
  convertedBlob?: Blob;
  convertedName?: string;
}

/**
 * Internal wrapper to access converter context
 */
const ImageToolsInternal: React.FC<Omit<ImageToolsProps, 'theme' | 'maxFiles' | 'defaultFormat' | 'defaultQuality'>> = ({
  onConversionComplete,
  onFilesSelected,
  className,
}) => {
  const { state } = useConverter();
  
  // Notify parent when files are selected
  useEffect(() => {
    if (onFilesSelected && state.files.length > 0) {
      onFilesSelected(state.files.length);
    }
  }, [state.files.length, onFilesSelected]);
  
  // Notify parent when conversion is complete
  useEffect(() => {
    const convertedFiles = (state.files as ConvertedFile[]).filter(f => f.convertedBlob);
    if (onConversionComplete && convertedFiles.length > 0) {
      const filesData = convertedFiles.map(f => ({
        name: f.convertedName || f.file.name,
        blob: f.convertedBlob!,
        originalName: f.file.name,
      }));
      onConversionComplete(filesData);
    }
  }, [state.files, onConversionComplete]);
  
  return (
    <div className={`image-tools-wrapper ${className || ''}`}>
      <ImageToolsPage />
    </div>
  );
};

/**
 * Theme wrapper that handles theme prop
 */
const ThemedImageTools: React.FC<ImageToolsProps> = (props) => {
  const { theme: contextTheme, toggleTheme } = useTheme();
  const { theme: propTheme = 'system' } = props;
  
  useEffect(() => {
    // Handle system theme preference
    if (propTheme === 'system') {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const shouldBeDark = darkModeQuery.matches;
        if ((shouldBeDark && contextTheme === 'light') || (!shouldBeDark && contextTheme === 'dark')) {
          toggleTheme();
        }
      };
      darkModeQuery.addEventListener('change', handleChange);
      handleChange();
      return () => darkModeQuery.removeEventListener('change', handleChange);
    } else {
      // Set explicit theme
      if (propTheme !== contextTheme) {
        toggleTheme();
      }
    }
  }, [propTheme, contextTheme, toggleTheme]);
  
  return <ImageToolsInternal {...props} />;
};

/**
 * ImageTools - Complete image conversion and editing component
 * 
 * A privacy-first React component for image conversion and editing.
 * All processing happens in the browser - no uploads, no tracking.
 * 
 * @example
 * ```tsx
 * import { ImageTools } from '@fawadhs/image-tools';
 * import '@fawadhs/image-tools/styles';
 * 
 * function App() {
 *   const handleComplete = (files) => {
 *     console.log('Converted:', files);
 *   };
 * 
 *   return (
 *     <ImageTools 
 *       theme="dark"
 *       maxFiles={50}
 *       defaultFormat="webp"
 *       onConversionComplete={handleComplete}
 *     />
 *   );
 * }
 * ```
 */
export const ImageTools: React.FC<ImageToolsProps> = (props) => {
  return (
    <ThemeProvider>
      <ConverterProvider>
        <ThemedImageTools {...props} />
      </ConverterProvider>
    </ThemeProvider>
  );
};

ImageTools.displayName = 'ImageTools';
