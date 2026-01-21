import { useEffect, useRef } from 'react';
import { useConverter } from '../context/ConverterContext';
import { isHeicFile, convertHeicToBlob } from '../utils/converter';

/**
 * Hook that automatically converts HEIC files to displayable format
 * when they are added to the file list.
 * 
 * This runs at the app level and ensures each HEIC file is converted
 * only ONCE, with the result stored in displayPreview for all components to use.
 */
export const useHeicConversion = () => {
  const { state, dispatch } = useConverter();
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const processHeicFiles = async () => {
      for (const file of state.files) {
        // Skip if already has displayPreview
        if (file.displayPreview) continue;
        
        // Skip if already being processed
        if (processingRef.current.has(file.id)) continue;
        
        // For non-HEIC files, just use the original preview
        if (!isHeicFile(file.file.name)) {
          dispatch({
            type: 'UPDATE_FILE',
            payload: {
              id: file.id,
              updates: { displayPreview: file.preview },
            },
          });
          continue;
        }

        // Mark as processing
        processingRef.current.add(file.id);

        try {
          // Convert HEIC to displayable format
          const response = await fetch(file.preview);
          const heicBlob = await response.blob();
          const convertedBlob = await convertHeicToBlob(heicBlob);
          const displayUrl = URL.createObjectURL(convertedBlob);

          dispatch({
            type: 'UPDATE_FILE',
            payload: {
              id: file.id,
              updates: { displayPreview: displayUrl },
            },
          });
        } catch (error) {
          console.error(`Failed to convert HEIC file ${file.file.name}:`, error);
          // Fallback to original preview (will show broken image but won't block)
          dispatch({
            type: 'UPDATE_FILE',
            payload: {
              id: file.id,
              updates: { displayPreview: file.preview },
            },
          });
        } finally {
          processingRef.current.delete(file.id);
        }
      }
    };

    processHeicFiles();
  }, [state.files, dispatch]);

  // Cleanup object URLs when files are removed
  useEffect(() => {
    return () => {
      // This runs on unmount - cleanup any created URLs
      state.files.forEach(file => {
        if (file.displayPreview && file.displayPreview !== file.preview && file.displayPreview.startsWith('blob:')) {
          URL.revokeObjectURL(file.displayPreview);
        }
      });
    };
  }, []);
};
